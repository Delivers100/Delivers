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
    
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all pending sellers with their documents
    const result = await sql`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.business_name, 
        u.phone, u.created_at, u.verification_status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.id,
              'document_type', d.document_type,
              'file_name', d.file_name,
              'file_url', d.file_url,
              'upload_date', d.upload_date,
              'verification_status', d.verification_status
            )
          ) FILTER (WHERE d.id IS NOT NULL), 
          '[]'::json
        ) as documents
      FROM users u
      LEFT JOIN documents d ON u.id = d.user_id
      WHERE u.role = 'seller' AND u.verification_status = 'pending'
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.business_name, u.phone, u.created_at, u.verification_status
      ORDER BY u.created_at ASC
    `;

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      businessName: row.business_name,
      phone: row.phone,
      created_at: row.created_at,
      verificationStatus: row.verification_status,
      documents: row.documents
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Get pending sellers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending sellers' },
      { status: 500 }
    );
  }
}