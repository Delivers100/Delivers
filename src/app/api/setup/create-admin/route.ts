import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { createTables } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Ensure tables exist
    await createTables();

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT id FROM users WHERE account_type = 'admin'
    `;

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const admin = await createUser({
      email,
      password,
      accountType: 'admin',
      firstName,
      lastName
    });

    return NextResponse.json({
      message: 'Admin user created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create admin user' },
      { status: 500 }
    );
  }
}