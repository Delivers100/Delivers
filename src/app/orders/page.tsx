'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/lib/auth';

interface Order {
  id: number;
  total_amount: number;
  delivery_address: string;
  status: string;
  created_at: string;
  items_count: number;
}

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          if (data.user.accountType !== 'consumer') {
            router.push('/');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      })
      .catch(() => router.push('/login'));

    // Load orders
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (response.ok && data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
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
            <Link href="/products" className="flex flex-col items-start">
              <h1 className="text-2xl font-bold text-green-600">Delivers</h1>
              <span className="text-xs text-gray-500 -mt-1">inspirado por amazon</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-gray-700">
                  Hola, {user.firstName}
                </span>
              )}
              <Link
                href="/products"
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mis Pedidos
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📦</span>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No tienes pedidos aún
            </h2>
            <p className="text-gray-600 mb-8">
              Explora nuestro catálogo y realiza tu primer pedido
            </p>
            <Link
              href="/products"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pedido #{order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Realizado el {formatDate(order.created_at)}
                    </p>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Total del Pedido</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatPrice(order.total_amount)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Productos</div>
                    <div className="text-lg font-medium text-gray-900">
                      {order.items_count} {order.items_count === 1 ? 'producto' : 'productos'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Estado del Envío</div>
                    <div className="text-lg font-medium text-gray-900">
                      {order.status === 'confirmed' ? 'Preparando envío' : 
                       order.status === 'shipped' ? 'En camino' :
                       order.status === 'delivered' ? 'Entregado' : 'Procesando'}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-500 mb-1">Dirección de Entrega</div>
                  <div className="text-gray-900">{order.delivery_address}</div>
                </div>

                {order.status === 'confirmed' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-blue-600 text-lg mr-2">ℹ️</span>
                      <div className="text-sm text-blue-800">
                        <div className="font-medium">Tu pedido está confirmado</div>
                        <div>Los pagos han sido procesados a los vendedores. Nuestro equipo recogerá los productos mañana en la mañana y los entregará en la tarde.</div>
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'shipped' && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-purple-600 text-lg mr-2">🚚</span>
                      <div className="text-sm text-purple-800">
                        <div className="font-medium">En camino</div>
                        <div>Tu pedido está en camino y será entregado hoy en la tarde.</div>
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-green-600 text-lg mr-2">✅</span>
                      <div className="text-sm text-green-800">
                        <div className="font-medium">Entregado</div>
                        <div>Tu pedido fue entregado exitosamente. ¡Gracias por comprar con Delivers!</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/products"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl mr-3">🛒</span>
              <div>
                <div className="font-medium text-gray-900">Hacer un Nuevo Pedido</div>
                <div className="text-sm text-gray-600">Explora nuestro catálogo completo</div>
              </div>
            </Link>
            
            <Link
              href="/scan"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl mr-3">📱</span>
              <div>
                <div className="font-medium text-gray-900">Escanear Código QR</div>
                <div className="text-sm text-gray-600">Buscar productos con código QR</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}