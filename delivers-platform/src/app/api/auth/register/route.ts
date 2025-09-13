import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken } from '@/lib/auth';
import { createTables } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Ensure tables exist
    await createTables();

    const body = await request.json();
    const { email, password, accountType, firstName, lastName, businessName, phone, address } = body;

    // Validation
    if (!email || !password || !accountType || !firstName || !lastName || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await createUser({
      email,
      password,
      accountType,
      firstName,
      lastName,
      businessName,
      phone,
      address
    });

    const token = generateToken(user);

    const response = NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        address: user.address,
        isVerified: user.isVerified,
        canSell: user.canSell
      },
      requiresDocuments: !user.isVerified
    });

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}