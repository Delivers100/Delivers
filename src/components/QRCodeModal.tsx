'use client';

import { useState } from 'react';
import QRCodeDisplay from './QRCodeDisplay';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string;
  productName: string;
}

export default function QRCodeModal({ isOpen, onClose, qrCode, productName }: QRCodeModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${productName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
              }
              .qr-container {
                text-align: center;
                page-break-inside: avoid;
              }
              .product-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .qr-code {
                margin: 20px 0;
              }
              .footer {
                font-size: 12px;
                color: #666;
                margin-top: 10px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="product-name">${productName}</div>
              <div class="qr-code">
                <canvas id="qr-canvas"></canvas>
              </div>
              <div class="footer">
                <div>Código QR: ${qrCode}</div>
                <div>Generado por Delivers</div>
              </div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
            <script>
              QRCode.toCanvas(document.getElementById('qr-canvas'), '${qrCode}', {
                width: 300,
                margin: 2
              }, function() {
                window.print();
                window.close();
              });
            </script>
          </body>
        </html>
      `);
    }
    setIsPrinting(false);
  };

  const handleDownload = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(qrCode, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const link = document.createElement('a');
      link.download = `qr-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Error al descargar el código QR');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Código QR - {productName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="text-center mb-6">
            <QRCodeDisplay 
              value={qrCode} 
              size={300}
              className="mx-auto"
            />
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Código QR único para este producto:
            </p>
            <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
              {qrCode}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Descargar PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}