import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  email: string;
  accountType: 'admin' | 'consumer' | 'business';
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  businessName?: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  canSell: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      accountType: user.accountType,
      canSell: user.canSell
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function createUser(userData: {
  email: string;
  password: string;
  accountType: 'admin' | 'consumer' | 'business';
  firstName: string;
  lastName: string;
  businessName?: string;
  phone?: string;
  address?: string;
}): Promise<User> {
  const { email, password, accountType, firstName, lastName, businessName, phone, address } = userData;
  
  // Check if user already exists
  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email}
  `;
  
  if (existingUser.rows.length > 0) {
    throw new Error('User already exists with this email');
  }

  const passwordHash = await hashPassword(password);
  
  // Set can_sell based on account type and default verification status
  const canSell = accountType === 'business';
  const defaultVerificationStatus = accountType === 'admin' ? 'approved' : 'pending';
  const isVerified = accountType === 'admin';

  const result = await sql`
    INSERT INTO users (email, password_hash, account_type, first_name, last_name, business_name, phone, address, can_sell, is_verified, verification_status)
    VALUES (${email}, ${passwordHash}, ${accountType}, ${firstName}, ${lastName}, ${businessName || null}, ${phone || null}, ${address || null}, ${canSell}, ${isVerified}, ${defaultVerificationStatus})
    RETURNING id, email, account_type, first_name, last_name, business_name, phone, address, is_verified, verification_status, can_sell
  `;

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    accountType: user.account_type,
    firstName: user.first_name,
    lastName: user.last_name,
    businessName: user.business_name,
    phone: user.phone,
    address: user.address,
    isVerified: user.is_verified,
    verificationStatus: user.verification_status,
    canSell: user.can_sell
  };
}

export async function authenticateUser(email: string, password: string): Promise<User> {
  const result = await sql`
    SELECT id, email, password_hash, account_type, first_name, last_name, business_name, phone, address, is_verified, verification_status, can_sell
    FROM users 
    WHERE email = ${email}
  `;

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];
  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  return {
    id: user.id,
    email: user.email,
    accountType: user.account_type,
    firstName: user.first_name,
    lastName: user.last_name,
    businessName: user.business_name,
    phone: user.phone,
    address: user.address,
    isVerified: user.is_verified,
    verificationStatus: user.verification_status,
    canSell: user.can_sell
  };
}