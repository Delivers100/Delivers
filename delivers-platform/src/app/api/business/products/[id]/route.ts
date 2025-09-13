import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (decoded.accountType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can update products' },
        { status: 403 }
      );
    }

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive, name, description, businessPrice, category, stockQuantity, minOrderQuantity } = body;

    // Verify product belongs to this business
    const productResult = await sql`
      SELECT id FROM products 
      WHERE id = ${productId} AND business_id = ${decoded.userId}
    `;

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let updateQuery = 'UPDATE products SET updated_at = CURRENT_TIMESTAMP';
    const values: any[] = [];
    let valueIndex = 1;

    if (isActive !== undefined) {
      updateQuery += `, is_active = $${valueIndex}`;
      values.push(isActive);
      valueIndex++;
    }

    if (name) {
      updateQuery += `, name = $${valueIndex}`;
      values.push(name);
      valueIndex++;
    }

    if (description !== undefined) {
      updateQuery += `, description = $${valueIndex}`;
      values.push(description);
      valueIndex++;
    }

    if (businessPrice) {
      const platformFeePercentage = 15.00;
      const platformFee = businessPrice * (platformFeePercentage / 100);
      const publicPrice = Math.round(businessPrice + platformFee);
      
      updateQuery += `, business_price = $${valueIndex}, public_price = $${valueIndex + 1}`;
      values.push(businessPrice, publicPrice);
      valueIndex += 2;
    }

    if (category) {
      updateQuery += `, category = $${valueIndex}`;
      values.push(category);
      valueIndex++;
    }

    if (stockQuantity !== undefined) {
      updateQuery += `, stock_quantity = $${valueIndex}`;
      values.push(stockQuantity);
      valueIndex++;
    }

    if (minOrderQuantity !== undefined) {
      updateQuery += `, min_order_quantity = $${valueIndex}`;
      values.push(minOrderQuantity);
      valueIndex++;
    }

    updateQuery += ` WHERE id = $${valueIndex} AND business_id = $${valueIndex + 1} RETURNING *`;
    values.push(productId, decoded.userId);

    // Execute update using raw query
    const result = await sql.query(updateQuery, values);

    const updatedProduct = result.rows[0];

    return NextResponse.json({
      message: 'Product updated successfully',
      product: {
        ...updatedProduct,
        images: updatedProduct.images || []
      }
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (decoded.accountType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can delete products' },
        { status: 403 }
      );
    }

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Verify product belongs to this business and delete
    const result = await sql`
      DELETE FROM products 
      WHERE id = ${productId} AND business_id = ${decoded.userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}