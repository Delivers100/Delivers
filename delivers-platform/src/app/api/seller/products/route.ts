import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';

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
    
    if (decoded.role !== 'seller') {
      return NextResponse.json(
        { error: 'Only sellers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get seller's products
    const result = await sql`
      SELECT id, name, description, price, markup_price, category, stock_quantity, 
             images, is_active, created_at, updated_at
      FROM products 
      WHERE seller_id = ${decoded.userId}
      ORDER BY created_at DESC
    `;

    const products = result.rows.map(row => ({
      ...row,
      images: row.images || []
    }));

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Get seller products error:', error);
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
    
    if (decoded.role !== 'seller') {
      return NextResponse.json(
        { error: 'Only sellers can create products' },
        { status: 403 }
      );
    }

    // Check if seller is verified
    const userResult = await sql`
      SELECT is_verified FROM users WHERE id = ${decoded.userId}
    `;

    if (userResult.rows.length === 0 || !userResult.rows[0].is_verified) {
      return NextResponse.json(
        { error: 'Seller must be verified to create products' },
        { status: 403 }
      );
    }

    const { name, description, price, category, stockQuantity } = await request.json();

    if (!name || !price || !category || stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Name, price, category, and stock quantity are required' },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    if (stockQuantity < 0) {
      return NextResponse.json(
        { error: 'Stock quantity cannot be negative' },
        { status: 400 }
      );
    }

    // Calculate markup price (20% markup)
    const markupPrice = Math.round(price * 1.2);

    const result = await sql`
      INSERT INTO products (seller_id, name, description, price, markup_price, category, stock_quantity, images)
      VALUES (${decoded.userId}, ${name}, ${description}, ${price}, ${markupPrice}, ${category}, ${stockQuantity}, ${JSON.stringify([])})
      RETURNING id, name, price, markup_price, category, stock_quantity, is_active, created_at
    `;

    const product = result.rows[0];

    return NextResponse.json({
      message: 'Product created successfully',
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