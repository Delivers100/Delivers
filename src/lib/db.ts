import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export async function createTables() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        account_type VARCHAR(20) CHECK (account_type IN ('admin', 'consumer', 'business')) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        business_name VARCHAR(255),
        business_hours JSONB,
        bank_account_info JSONB,
        cedula_number VARCHAR(20),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        can_sell BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        business_price DECIMAL(10, 2) NOT NULL,
        platform_fee_percentage DECIMAL(5, 2) DEFAULT 15.00,
        public_price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        min_order_quantity INTEGER DEFAULT 1,
        images TEXT[],
        qr_code VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        delivery_address TEXT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        customer_delivery_fee DECIMAL(10, 2) NOT NULL,
        total_customer_payment DECIMAL(10, 2) NOT NULL,
        total_business_payout DECIMAL(10, 2) NOT NULL,
        total_platform_revenue DECIMAL(10, 2) NOT NULL,
        pickup_window VARCHAR(50) DEFAULT 'morning',
        delivery_window VARCHAR(50) DEFAULT 'afternoon',
        status VARCHAR(20) CHECK (status IN ('pending', 'business_paid', 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
        payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'customer_paid', 'business_paid', 'completed')) DEFAULT 'pending',
        business_payment_reference VARCHAR(255),
        delivery_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        pickup_at TIMESTAMP,
        delivered_at TIMESTAMP
      )
    `;

    // Order items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        business_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_business_price DECIMAL(10, 2) NOT NULL,
        unit_public_price DECIMAL(10, 2) NOT NULL,
        business_pickup_fee DECIMAL(10, 2) NOT NULL,
        total_business_receives DECIMAL(10, 2) NOT NULL,
        total_customer_pays DECIMAL(10, 2) NOT NULL,
        total_platform_fee DECIMAL(10, 2) NOT NULL
      )
    `;

    // Documents table
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(50) CHECK (document_type IN ('cedula', 'revenue_statement', 'bank_statement', 'tax_return', 'business_registration')) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        admin_notes TEXT
      )
    `;

    // Business payments table (instant payments to businesses)
    await sql`
      CREATE TABLE IF NOT EXISTS business_payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        business_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        platform_fee DECIMAL(10, 2) NOT NULL,
        pickup_fee DECIMAL(10, 2) NOT NULL,
        net_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_reference VARCHAR(255),
        status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `;

    // Business receipts table
    await sql`
      CREATE TABLE IF NOT EXISTS business_receipts (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        business_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        pickup_window VARCHAR(50) NOT NULL,
        items JSONB NOT NULL,
        payment_amount DECIMAL(10, 2) NOT NULL,
        platform_fee DECIMAL(10, 2) NOT NULL,
        pickup_fee DECIMAL(10, 2) NOT NULL,
        net_received DECIMAL(10, 2) NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Customer receipts table
    await sql`
      CREATE TABLE IF NOT EXISTS customer_receipts (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        delivery_address TEXT NOT NULL,
        items JSONB NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        delivery_fee DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        delivery_window VARCHAR(50) NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Delivery team receipts table
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_receipts (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        pickup_business_name VARCHAR(255) NOT NULL,
        pickup_address TEXT NOT NULL,
        delivery_customer_name VARCHAR(255) NOT NULL,
        delivery_address TEXT NOT NULL,
        pickup_contact_phone VARCHAR(20) NOT NULL,
        delivery_contact_phone VARCHAR(20) NOT NULL,
        items JSONB NOT NULL,
        pickup_window VARCHAR(50) NOT NULL,
        delivery_window VARCHAR(50) NOT NULL,
        business_payment_amount DECIMAL(10, 2) NOT NULL,
        special_instructions TEXT,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

export { sql };