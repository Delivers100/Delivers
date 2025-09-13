import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';

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
    
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, action, notes } = await request.json();

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Update user verification status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const isVerified = action === 'approve';

    await sql`
      UPDATE users 
      SET verification_status = ${newStatus}, 
          is_verified = ${isVerified},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId} AND role = 'seller'
    `;

    // Update all documents status for this user
    await sql`
      UPDATE documents 
      SET verification_status = ${newStatus},
          admin_notes = ${notes || null}
      WHERE user_id = ${userId}
    `;

    // Here you could send email notification to the seller
    // await sendEmailToSeller(userId, action, notes);

    return NextResponse.json({
      message: `Seller ${action}ed successfully`
    });
  } catch (error: any) {
    console.error('Verify seller error:', error);
    return NextResponse.json(
      { error: 'Failed to update seller verification' },
      { status: 500 }
    );
  }
}