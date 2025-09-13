'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRCodeModal from '@/components/QRCodeModal';

interface Product {
  id: number;
  name: string;
  description: string;
  business_price: number;
  public_price: number;
  platform_fee_percentage: number;
  category: string;
  stock_quantity: number;
  min_order_quantity: number;
  images: string[];
  qr_code: string;
  is_active: boolean;
  created_at: string;
}

const categories = [
  'Guantes',
  'Empaques de Alimentos', 
  'Suministros de Limpieza',
  'Artículos de Cocina',
  'Otros'
];

export default function BusinessDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    businessPrice: '',
    category: categories[0],
    stockQuantity: '',
    minOrderQuantity: '1'
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedQRProduct, setSelectedQRProduct] = useState<Product | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          if (data.user.accountType !== 'business') {
            router.push('/');
            return;
          }
          if (!data.user.isVerified) {
            router.push('/business/documents');
            return;
          }
          fetchProducts();
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/business/products');
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch {
      
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/business/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          businessPrice: parseFloat(formData.businessPrice),
          category: formData.category,
          stockQuantity: parseInt(formData.stockQuantity),
          minOrderQuantity: parseInt(formData.minOrderQuantity)
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form and refresh products
        setFormData({
          name: '',
          description: '',
          businessPrice: '',
          category: categories[0],
          stockQuantity: '',
          minOrderQuantity: '1'
        });
        setShowAddProduct(false);
        fetchProducts();
        alert('Producto agregado exitosamente con código QR generado');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleProductStatus = async (productId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/business/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        fetchProducts();
      } else {
        alert('Error al actualizar producto');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const updateStock = async (productId: number, newStock: number) => {
    try {
      const response = await fetch(`/api/business/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock })
      });

      if (response.ok) {
        fetchProducts();
      } else {
        alert('Error al actualizar stock');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculatePlatformFee = (businessPrice: number) => {
    return businessPrice * 0.15; // 15% platform fee
  };

  const calculatePublicPrice = (businessPrice: number) => {
    return businessPrice + calculatePlatformFee(businessPrice);
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex flex-col items-start">
              <h1 className="text-2xl font-bold text-green-600">Mi Tienda - {user?.businessName}</h1>
              <span className="text-xs text-gray-500 -mt-1">inspirado por amazon</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/business/payments"
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Pagos
              </Link>
              <span className="text-gray-700">{user?.firstName} {user?.lastName}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Productos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Productos Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.filter(p => p.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Órdenes Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ingresos Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Inventario de Productos
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Gestiona tu inventario y códigos QR para ventas
              </p>
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Agregar Producto
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🏪</span>
              <p className="text-gray-500 mb-4">No tienes productos en tu tienda aún</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Agregar tu Primer Producto
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {products.map((product) => (
                <li key={product.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.category} • Min: {product.min_order_quantity} unidades
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Tu precio:</span> {formatPrice(product.business_price)} • 
                            <span className="font-medium"> Precio público:</span> {formatPrice(product.public_price)} • 
                            <span className="font-medium"> Fee plataforma:</span> {formatPrice(product.public_price - product.business_price)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">Stock</div>
                          <input
                            type="number"
                            min="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            value={product.stock_quantity}
                            onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">QR Code</div>
                          <button
                            onClick={() => setSelectedQRProduct(product)}
                            className="hover:opacity-75 transition-opacity"
                            title="Click para ver QR grande"
                          >
                            <QRCodeDisplay 
                              value={product.qr_code} 
                              size={48}
                              className="mx-auto"
                            />
                          </button>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                          <button
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                            className={`px-3 py-1 rounded text-xs ${
                              product.is_active
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {product.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Agregar Nuevo Producto a tu Tienda
                </h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tu Precio (COP) *
                    </label>
                    <input
                      type="number"
                      name="businessPrice"
                      required
                      min="0"
                      step="100"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      value={formData.businessPrice}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stock Inicial *
                    </label>
                    <input
                      type="number"
                      name="stockQuantity"
                      required
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      value={formData.stockQuantity}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad Mínima de Orden *
                    </label>
                    <input
                      type="number"
                      name="minOrderQuantity"
                      required
                      min="1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      value={formData.minOrderQuantity}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-blue-600">💰</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Precios Automáticos
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        {formData.businessPrice && (
                          <div>
                            <div><strong>Tu precio:</strong> {formatPrice(parseFloat(formData.businessPrice) || 0)}</div>
                            <div><strong>Fee plataforma (15%):</strong> {formatPrice(calculatePlatformFee(parseFloat(formData.businessPrice) || 0))}</div>
                            <div><strong>Precio público:</strong> {formatPrice(calculatePublicPrice(parseFloat(formData.businessPrice) || 0))}</div>
                            <div className="mt-2 text-xs">
                              <strong>Importante:</strong> Los clientes pagan el precio público. Tú recibes tu precio menos fees de pickup al momento de la orden.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Agregando...' : 'Agregar Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* QR Code Modal */}
      {selectedQRProduct && (
        <QRCodeModal 
          isOpen={true}
          onClose={() => setSelectedQRProduct(null)}
          qrCode={selectedQRProduct.qr_code}
          productName={selectedQRProduct.name}
        />
      )}
    </div>
  );
}