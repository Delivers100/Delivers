'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({ value, size = 200, className = '' }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        setError('');
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Error generating QR code');
      } finally {
        setIsLoading(false);
      }
    };

    if (value) {
      generateQR();
    }
  }, [value, size]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-gray-500 text-sm">Generando QR...</div>
      </div>
    );
  }

  if (error || !qrCodeUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border-2 border-dashed border-red-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-red-500 text-sm">Error QR</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <img 
        src={qrCodeUrl} 
        alt={`QR Code: ${value}`}
        className="border rounded"
        style={{ width: size, height: size }}
      />
    </div>
  );
}