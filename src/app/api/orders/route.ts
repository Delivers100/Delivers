import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (decoded.accountType !== 'consumer') {
      return NextResponse.json(
        { error: 'Only consumers can place orders' },
        { status: 403 }
      );
    }

    const { items, deliveryAddress } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Validate items and calculate totals
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity || quantity < 1) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        );
      }

      // Get product details and verify availability
      const productResult = await sql`
        SELECT p.id, p.name, p.business_price, p.public_price, p.stock_quantity, 
               p.min_order_quantity, p.is_active, p.business_id,
               u.businessName, u.bankAccountInfo
        FROM products p 
        JOIN users u ON p.business_id = u.id
        WHERE p.id = ${productId} AND p.is_active = true AND u.is_verified = true
      `;

      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { error: `Product ${productId} not found or not available` },
          { status: 400 }
        );
      }

      const product = productResult.rows[0];

      if (quantity < product.min_order_quantity) {
        return NextResponse.json(
          { error: `Minimum quantity for ${product.name} is ${product.min_order_quantity}` },
          { status: 400 }
        );
      }

      if (quantity > product.stock_quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` },
          { status: 400 }
        );
      }

      const itemTotal = parseFloat(product.public_price) * quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId,
        quantity,
        unitPrice: parseFloat(product.public_price),
        businessPrice: parseFloat(product.business_price),
        total: itemTotal,
        businessId: product.business_id,
        productName: product.name,
        businessName: product.businessname,
        bankAccountInfo: product.bankaccountinfo
      });
    }

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (customer_id, total_amount, delivery_address, status)
      VALUES (${decoded.userId}, ${totalAmount}, ${deliveryAddress}, 'pending')
      RETURNING id, created_at
    `;

    const orderId = orderResult.rows[0].id;
    const orderDate = orderResult.rows[0].created_at;

    // Create order items and process payments
    for (const item of validatedItems) {
      // Add order item
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (${orderId}, ${item.productId}, ${item.quantity}, ${item.unitPrice}, ${item.total})
      `;

      // Update product stock
      await sql`
        UPDATE products 
        SET stock_quantity = stock_quantity - ${item.quantity}
        WHERE id = ${item.productId}
      `;

      // Calculate business payment (business gets their price per unit)
      const businessPayment = item.businessPrice * item.quantity;
      const platformFee = item.total - businessPayment;
      // Delivery fee is included in the price calculation

      // Create instant business payment record
      await sql`
        INSERT INTO business_payments (
          business_id, order_id, product_id, quantity_sold, 
          business_unit_price, total_business_payment, platform_fee_amount,
          payment_status, processed_at
        )
        VALUES (
          ${item.businessId}, ${orderId}, ${item.productId}, ${item.quantity},
          ${item.businessPrice}, ${businessPayment}, ${platformFee},
          'processed', CURRENT_TIMESTAMP
        )
      `;

      // Create business receipt
      await sql`
        INSERT INTO business_receipts (
          business_id, order_id, product_name, quantity_sold,
          business_unit_price, total_earned, platform_fee_deducted,
          net_payment, payment_date
        )
        VALUES (
          ${item.businessId}, ${orderId}, ${item.productName}, ${item.quantity},
          ${item.businessPrice}, ${businessPayment}, ${platformFee},
          ${businessPayment}, CURRENT_TIMESTAMP
        )
      `;
    }

    // Create customer receipt
    await sql`
      INSERT INTO customer_receipts (
        customer_id, order_id, total_paid, items_summary,
        delivery_address, order_date
      )
      VALUES (
        ${decoded.userId}, ${orderId}, ${totalAmount}, 
        ${JSON.stringify(validatedItems.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })))},
        ${deliveryAddress}, ${orderDate}
      )
    `;

    // Update order status to confirmed
    await sql`
      UPDATE orders SET status = 'confirmed' WHERE id = ${orderId}
    `;

    return NextResponse.json({
      message: 'Order placed successfully',
      orderId,
      totalAmount,
      itemsCount: validatedItems.length,
      businessPaymentsProcessed: validatedItems.length
    });

  } catch (error) {
    console.error('Order processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (decoded.accountType !== 'consumer') {
      return NextResponse.json(
        { error: 'Only consumers can view their orders' },
        { status: 403 }
      );
    }

    // Get user's orders
    const result = await sql`
      SELECT o.id, o.total_amount, o.delivery_address, o.status, o.created_at,
             COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ${decoded.userId}
      GROUP BY o.id, o.total_amount, o.delivery_address, o.status, o.created_at
      ORDER BY o.created_at DESC
    `;

    const orders = result.rows.map(row => ({
      ...row,
      total_amount: parseFloat(row.total_amount),
      items_count: parseInt(row.items_count)
    }));

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}