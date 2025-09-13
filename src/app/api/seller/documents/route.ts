import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/db';

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
        { error: 'Only sellers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get user's documents
    const result = await sql`
      SELECT id, document_type, file_name, verification_status, upload_date, admin_notes
      FROM documents 
      WHERE user_id = ${decoded.userId}
      ORDER BY upload_date DESC
    `;

    return NextResponse.json({
      documents: result.rows
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}