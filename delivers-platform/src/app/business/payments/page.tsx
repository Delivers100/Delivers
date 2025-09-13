'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Payment {
  id: number;
  order_id: number;
  quantity_sold: number;
  business_unit_price: number;
  total_business_payment: number;
  platform_fee_amount: number;
  processed_at: string;
  product_name: string;
}

interface PaymentSummary {
  total_payments: number;
  total_earned: number;
  total_fees: number;
  total_items_sold: number;
}

interface TodayStats {
  today_earnings: number;
  today_items_sold: number;
}

export default function BusinessPaymentsPage() {
  const [user, setUser] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          if (data.user.accountType !== 'business') {
            router.push('/');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      })
      .catch(() => router.push('/login'));

    // Load payment data
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/business/payments');
      const data = await response.json();
      
      if (response.ok) {
        setPayments(data.payments);
        setSummary(data.summary);
        setTodayStats(data.todayStats);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/business/dashboard" className="flex flex-col items-start">
              <h1 className="text-2xl font-bold text-green-600">Delivers</h1>
              <span className="text-xs text-gray-500 -mt-1">Panel de Negocio</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-gray-700">
                  {user.businessName || user.firstName}
                </span>
              )}
              <Link
                href="/business/dashboard"
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Pagos y Ganancias
        </h1>

        {/* Summary Cards */}
        {summary && todayStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  💰
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ganancias Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(summary.total_earned)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  📊
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Comisiones Pagadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(summary.total_fees)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  📈
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(todayStats.today_earnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  📦
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.total_items_sold}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Historial de Pagos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Pagos instantáneos procesados cuando los clientes realizan pedidos
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">💳</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay pagos aún
              </h3>
              <p className="text-gray-600 mb-6">
                Los pagos aparecerán aquí cuando los clientes compren tus productos
              </p>
              <Link
                href="/business/dashboard"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Ver Mi Inventario
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto / Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Recibido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Pedido #{payment.order_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.quantity_sold} unidades
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(payment.business_unit_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatPrice(payment.total_business_payment)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(payment.platform_fee_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(payment.processed_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ¿Cómo funcionan los pagos instantáneos?
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Recibes el pago inmediatamente cuando un cliente compra tu producto
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Delivers cobra una comisión del 15% que se deduce automáticamente
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Tu inventario se actualiza automáticamente después de cada venta
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Los pagos se procesan a tu cuenta registrada
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}