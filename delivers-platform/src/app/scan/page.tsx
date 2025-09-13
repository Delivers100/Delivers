'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description: string;
  public_price: number;
  category: string;
  stock_quantity: number;
  min_order_quantity: number;
  images: string[];
  business: {
    name: string;
    city: string;
    address: string;
  };
}

export default function QRScanPage() {
  const [qrCode, setQrCode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleScan = async () => {
    if (!qrCode.trim()) {
      setError('Por favor ingresa un código QR');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProduct(null);

      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code: qrCode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setProduct(data.product);
      } else {
        setError(data.error || 'Error al buscar producto');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setError('Error al conectar con el servidor');
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

  const handleViewInCatalog = () => {
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              onClick={() => router.push('/')}
              className="flex flex-col items-start cursor-pointer"
            >
              <h1 className="text-2xl font-bold text-green-600">Delivers</h1>
              <span className="text-xs text-gray-500 -mt-1">inspirado por amazon</span>
            </div>
            <button
              onClick={handleViewInCatalog}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Ver Catálogo Completo
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Escanear Código QR
          </h1>
          <p className="text-lg text-gray-600">
            Ingresa el código QR del producto para ver su información
          </p>
        </div>

        {/* QR Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="qr-code" className="block text-sm font-medium text-gray-700 mb-2">
                Código QR del Producto
              </label>
              <input
                id="qr-code"
                type="text"
                placeholder="Ej: QR_123_1234567890_abc123def"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
              />
            </div>
            <button
              onClick={handleScan}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? 'Buscando...' : 'Buscar Producto'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Product Display */}
        {product && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h2>
                  <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {formatPrice(product.public_price)}
                  </div>
                  <div className="text-sm text-gray-500">por unidad</div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Stock Disponible</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {product.stock_quantity} unidades
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Cantidad Mínima</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {product.min_order_quantity} unidades
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="text-sm text-blue-600 font-medium mb-1">Vendido por</div>
                <div className="text-lg font-semibold text-blue-900">Delivers</div>
                <div className="text-sm text-blue-700">
                  Producto de {product.business.name} - {product.business.city}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleViewInCatalog}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  Comprar en el Catálogo Delivers
                </button>
                <p className="text-center text-sm text-gray-500">
                  Para realizar la compra, visita nuestro catálogo completo
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ¿Cómo usar el escáner QR?
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">1.</span>
              Encuentra el código QR en el producto o tienda
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">2.</span>
              Copia o escribe el código en el campo de arriba
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">3.</span>
              Haz clic en "Buscar Producto" para ver la información
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">4.</span>
              Ve al catálogo para realizar tu compra
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}