'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
  id: number;
  name: string;
  public_price: number;
  category: string;
  stock_quantity: number;
  min_order_quantity: number;
  quantity: number;
}

export default function CartPage() {
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          setDeliveryAddress(data.user.address || '');
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));

    // Load cart from localStorage and fetch product details
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '{}');
      const productIds = Object.keys(cart);
      
      if (productIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch current product details
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data.products) {
        const items = data.products
          .filter((product: any) => cart[product.id])
          .map((product: any) => ({
            ...product,
            quantity: cart[product.id]
          }));
        
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(productId);
      return;
    }

    const item = cartItems.find(item => item.id === productId);
    if (item && newQuantity < item.min_order_quantity) {
      alert(`La cantidad mínima para este producto es ${item.min_order_quantity} unidades`);
      return;
    }

    if (item && newQuantity > item.stock_quantity) {
      alert(`Stock insuficiente. Máximo disponible: ${item.stock_quantity} unidades`);
      return;
    }

    // Update localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    cart[productId] = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update state
    setCartItems(items => 
      items.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (productId: number) => {
    // Update localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    delete cart[productId];
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update state
    setCartItems(items => items.filter(item => item.id !== productId));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.public_price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      alert('Por favor ingresa una dirección de entrega');
      return;
    }

    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      setSubmitting(true);

      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          deliveryAddress: deliveryAddress.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear cart
        localStorage.removeItem('cart');
        setCartItems([]);

        alert(`¡Pedido realizado exitosamente! Número de pedido: ${data.orderId}`);
        router.push('/orders');
      } else {
        alert(data.error || 'Error al procesar el pedido');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error al procesar el pedido');
    } finally {
      setSubmitting(false);
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
          Carrito de Compras
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🛒</span>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-8">
              Agrega productos al carrito para continuar con tu compra
            </p>
            <Link
              href="/products"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      <span className="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded mb-3">
                        {item.category}
                      </span>
                      <div className="text-sm text-gray-600">
                        Stock disponible: {item.stock_quantity} unidades
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 ml-4"
                      title="Eliminar del carrito"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-medium text-lg w-12 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatPrice(item.public_price)} c/u
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(item.public_price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del Pedido
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos ({getTotalItems()})</span>
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium">Incluido</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="delivery-address" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de Entrega
                </label>
                <textarea
                  id="delivery-address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ingresa tu dirección completa..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting || cartItems.length === 0}
                className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                  submitting || cartItems.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {submitting ? 'Procesando...' : 'Realizar Pedido'}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Al realizar el pedido, aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}