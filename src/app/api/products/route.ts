import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.id, p.name, p.description, p.public_price, p.category, 
             p.stock_quantity, p.min_order_quantity, p.images, p.is_active, p.created_at
      FROM products p 
      JOIN users u ON p.business_id = u.id 
      WHERE p.is_active = true AND u.is_verified = true AND p.stock_quantity > 0
    `;
    const params: (string | number)[] = [];
    let paramCount = 0;

    if (category && category !== 'Todos') {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await sql.query(query, params);

    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      public_price: parseFloat(row.public_price),
      category: row.category,
      stock_quantity: row.stock_quantity,
      min_order_quantity: row.min_order_quantity,
      images: row.images || [],
      is_active: row.is_active,
      created_at: row.created_at
    }));

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        hasMore: result.rows.length === limit
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}