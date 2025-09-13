import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    // Get user data from database
    const result = await sql`
      SELECT id, email, account_type, first_name, last_name, business_name, is_verified, verification_status
      FROM users
      WHERE id = ${decoded.userId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        accountType: user.account_type,
        firstName: user.first_name,
        lastName: user.last_name,
        businessName: user.business_name,
        isVerified: user.is_verified,
        verificationStatus: user.verification_status
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}