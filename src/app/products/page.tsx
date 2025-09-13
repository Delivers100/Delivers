'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/lib/auth';

interface Product {
  id: number;
  name: string;
  description: string;
  public_price: number;
  category: string;
  stock_quantity: number;
  min_order_quantity: number;
  images: string[];
  is_active: boolean;
  created_at: string;
}

const categories = [
  'Todos',
  'Guantes',
  'Empaques de Alimentos', 
  'Suministros de Limpieza',
  'Artículos de Cocina',
  'Otros'
];

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState({
    category: 'Todos',
    search: '',
    page: 1
  });
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.category !== 'Todos') queryParams.set('category', filters.category);
      if (filters.search) queryParams.set('search', filters.search);
      queryParams.set('page', filters.page.toString());

      const response = await fetch(`/api/products?${queryParams.toString()}`);
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetchProducts();
  }, [filters, fetchProducts]);

  const addToCart = (productId: number, quantity: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + quantity
    }));

    // Show success message
    const product = products.find(p => p.id === productId);
    alert(`${quantity} unidades de ${product?.name} agregadas al carrito`);
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && quantity < product.min_order_quantity) {
      alert(`La cantidad mínima para este producto es ${product.min_order_quantity} unidades`);
      return;
    }

    if (quantity === 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart(prev => ({ ...prev, [productId]: quantity }));
    }
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      return total + (product ? product.public_price * quantity : 0);
    }, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setCart({});
    router.refresh();
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
            <Link href="/" className="flex flex-col items-start">
              <h1 className="text-2xl font-bold text-green-600">Delivers</h1>
              <span className="text-xs text-gray-500 -mt-1">inspirado por amazon</span>
            </Link>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="relative">
                    <button
                      onClick={() => router.push('/cart')}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <span>🛒</span>
                      <span>Carrito ({getTotalItems()})</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700">
                      Hola, {user.firstName} 
                      {user.accountType === 'business' && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-1">
                          Empresa
                        </span>
                      )}
                    </span>
                    {user.accountType === 'business' && (
                      <Link
                        href="/business/dashboard"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mi Tienda
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Salir
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg transition"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Productos al Por Mayor
          </h1>
          <p className="text-lg text-gray-600">
            Compra directamente de empresas verificadas - Todos los productos vendidos por Delivers
          </p>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>
            <div className="sm:w-48">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => {
            const cartQuantity = cart[product.id] || 0;
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Por: Delivers
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm text-gray-600">
                      Min: {product.min_order_quantity} unidades
                    </div>
                    <div className="text-sm text-gray-600">
                      Stock: {product.stock_quantity} disponibles
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(product.public_price)}
                      </span>
                      <span className="text-xs text-gray-500">
                        por unidad
                      </span>
                    </div>
                  </div>

                  {user ? (
                    <div className="space-y-2">
                      {cartQuantity > 0 && (
                        <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <button
                            onClick={() => updateCartQuantity(product.id, cartQuantity - 1)}
                            className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
                          >
                            -
                          </button>
                          <span className="font-medium">{cartQuantity}</span>
                          <button
                            onClick={() => updateCartQuantity(product.id, cartQuantity + 1)}
                            disabled={cartQuantity >= product.stock_quantity}
                            className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => addToCart(product.id, product.min_order_quantity)}
                        disabled={product.stock_quantity < product.min_order_quantity}
                        className={`w-full py-2 rounded-lg font-medium transition-colors duration-200 ${
                          product.stock_quantity >= product.min_order_quantity
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {product.stock_quantity >= product.min_order_quantity 
                          ? `Agregar ${product.min_order_quantity}+ unidades`
                          : 'Sin Stock Suficiente'
                        }
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition text-center block"
                      >
                        Iniciar Sesión para Comprar
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📦</span>
            <p className="text-gray-500 text-lg">No se encontraron productos</p>
          </div>
        )}

        {/* Cart Summary (if items in cart) */}
        {user && getTotalItems() > 0 && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-lg shadow-lg">
            <div className="text-sm">
              {getTotalItems()} artículos en el carrito
            </div>
            <div className="font-bold">
              Total: {formatPrice(getTotalPrice())}
            </div>
            <button
              onClick={() => router.push('/cart')}
              className="mt-2 w-full bg-green-500 hover:bg-green-400 text-white py-2 px-4 rounded transition"
            >
              Ver Carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}