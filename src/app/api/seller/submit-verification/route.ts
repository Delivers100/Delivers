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
    
    if (decoded.accountType !== 'business') {
      return NextResponse.json(
        { error: 'Only sellers can submit for verification' },
        { status: 403 }
      );
    }

    // Check if user has uploaded required documents
    const requiredDocs = ['cedula', 'revenue_statement', 'bank_statement'];
    
    for (const docType of requiredDocs) {
      const result = await sql`
        SELECT id FROM documents 
        WHERE user_id = ${decoded.userId} AND document_type = ${docType}
      `;
      
      if (result.length === 0) {
        return NextResponse.json(
          { error: `Missing required document: ${docType}` },
          { status: 400 }
        );
      }
    }

    // Update user verification status to pending
    await sql`
      UPDATE users 
      SET verification_status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${decoded.userId}
    `;

    // Here you could also send an email notification to admin
    // await sendEmailToAdmin('New seller verification pending', { userId: decoded.userId });

    return NextResponse.json({
      message: 'Verification submitted successfully. You will be contacted within 24-48 hours.'
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    );
  }
}