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
        { error: 'Only businesses can access payment data' },
        { status: 403 }
      );
    }

    // Get payment summary
    const summaryResult = await sql`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(total_business_payment), 0) as total_earned,
        COALESCE(SUM(platform_fee_amount), 0) as total_fees,
        COALESCE(SUM(quantity_sold), 0) as total_items_sold
      FROM business_payments 
      WHERE business_id = ${decoded.userId} AND payment_status = 'processed'
    `;

    const summary = {
      ...summaryResult.rows[0],
      total_earned: parseFloat(summaryResult.rows[0].total_earned || '0'),
      total_fees: parseFloat(summaryResult.rows[0].total_fees || '0'),
      total_payments: parseInt(summaryResult.rows[0].total_payments || '0'),
      total_items_sold: parseInt(summaryResult.rows[0].total_items_sold || '0')
    };

    // Get recent payments
    const paymentsResult = await sql`
      SELECT bp.id, bp.order_id, bp.quantity_sold, bp.business_unit_price,
             bp.total_business_payment, bp.platform_fee_amount, bp.processed_at,
             p.name as product_name
      FROM business_payments bp
      JOIN products p ON bp.product_id = p.id
      WHERE bp.business_id = ${decoded.userId} AND bp.payment_status = 'processed'
      ORDER BY bp.processed_at DESC
      LIMIT 50
    `;

    const payments = paymentsResult.rows.map(row => ({
      ...row,
      business_unit_price: parseFloat(row.business_unit_price),
      total_business_payment: parseFloat(row.total_business_payment),
      platform_fee_amount: parseFloat(row.platform_fee_amount)
    }));

    // Get today's earnings
    const todayResult = await sql`
      SELECT 
        COALESCE(SUM(total_business_payment), 0) as today_earnings,
        COALESCE(SUM(quantity_sold), 0) as today_items_sold
      FROM business_payments 
      WHERE business_id = ${decoded.userId} 
        AND payment_status = 'processed'
        AND DATE(processed_at) = CURRENT_DATE
    `;

    const todayStats = {
      today_earnings: parseFloat(todayResult.rows[0].today_earnings || '0'),
      today_items_sold: parseInt(todayResult.rows[0].today_items_sold || '0')
    };

    return NextResponse.json({
      summary,
      todayStats,
      payments
    });

  } catch (error) {
    console.error('Get business payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}