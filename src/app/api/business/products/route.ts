import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

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
    
    if (decoded.accountType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can access this endpoint' },
        { status: 403 }
      );
    }

    // Get business products
    const result = await sql`
      SELECT id, name, description, business_price, platform_fee_percentage, public_price, 
             category, stock_quantity, min_order_quantity, images, qr_code, is_active, 
             created_at, updated_at
      FROM products 
      WHERE business_id = ${decoded.userId}
      ORDER BY created_at DESC
    `;

    const products = result.rows.map(row => ({
      ...row,
      images: row.images || []
    }));

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Get business products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

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
    
    if (decoded.accountType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can create products' },
        { status: 403 }
      );
    }

    // Check if business is verified
    const userResult = await sql`
      SELECT is_verified FROM users WHERE id = ${decoded.userId}
    `;

    if (userResult.rows.length === 0 || !userResult.rows[0].is_verified) {
      return NextResponse.json(
        { error: 'Business must be verified to create products' },
        { status: 403 }
      );
    }

    const { name, description, businessPrice, category, stockQuantity, minOrderQuantity } = await request.json();

    if (!name || !businessPrice || !category || stockQuantity === undefined || !minOrderQuantity) {
      return NextResponse.json(
        { error: 'Name, business price, category, stock quantity, and minimum order quantity are required' },
        { status: 400 }
      );
    }

    if (businessPrice <= 0) {
      return NextResponse.json(
        { error: 'Business price must be greater than 0' },
        { status: 400 }
      );
    }

    if (stockQuantity < 0) {
      return NextResponse.json(
        { error: 'Stock quantity cannot be negative' },
        { status: 400 }
      );
    }

    if (minOrderQuantity < 1) {
      return NextResponse.json(
        { error: 'Minimum order quantity must be at least 1' },
        { status: 400 }
      );
    }

    // Calculate platform fee and public price
    const platformFeePercentage = 15.00;
    const platformFee = businessPrice * (platformFeePercentage / 100);
    const publicPrice = Math.round(businessPrice + platformFee);

    // Generate unique QR code identifier
    const qrCode = `QR_${decoded.userId}_${Date.now()}_${uuidv4().substring(0, 8)}`;

    const result = await sql`
      INSERT INTO products (business_id, name, description, business_price, platform_fee_percentage, 
                           public_price, category, stock_quantity, min_order_quantity, images, qr_code)
      VALUES (${decoded.userId}, ${name}, ${description}, ${businessPrice}, ${platformFeePercentage}, 
              ${publicPrice}, ${category}, ${stockQuantity}, ${minOrderQuantity}, ${JSON.stringify([])}, ${qrCode})
      RETURNING id, name, business_price, public_price, category, stock_quantity, min_order_quantity, 
                qr_code, is_active, created_at
    `;

    const product = result.rows[0];

    return NextResponse.json({
      message: 'Product created successfully with QR code',
      product: {
        ...product,
        images: []
      }
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}