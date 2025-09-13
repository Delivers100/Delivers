import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { qr_code } = await request.json();

    if (!qr_code) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Find product by QR code
    const result = await sql`
      SELECT p.id, p.name, p.description, p.public_price, p.category, 
             p.stock_quantity, p.min_order_quantity, p.images, p.is_active,
             u.businessName, u.city, u.address
      FROM products p 
      JOIN users u ON p.business_id = u.id 
      WHERE p.qr_code = ${qr_code} AND p.is_active = true AND u.is_verified = true
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado o no disponible' },
        { status: 404 }
      );
    }

    const product = result.rows[0];

    // Check if product has sufficient stock
    if (product.stock_quantity < product.min_order_quantity) {
      return NextResponse.json(
        { 
          error: 'Producto sin stock suficiente',
          product: {
            ...product,
            business: {
              name: product.businessname,
              city: product.city,
              address: product.address
            }
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        public_price: parseFloat(product.public_price),
        category: product.category,
        stock_quantity: product.stock_quantity,
        min_order_quantity: product.min_order_quantity,
        images: product.images || [],
        business: {
          name: product.businessname,
          city: product.city,
          address: product.address
        }
      }
    });
  } catch (error) {
    console.error('QR scan error:', error);
    return NextResponse.json(
      { error: 'Error al escanear código QR' },
      { status: 500 }
    );
  }
}