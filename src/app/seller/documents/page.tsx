'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

const documentTypes: DocumentType[] = [
  {
    id: 'cedula',
    name: 'Cédula de Ciudadanía',
    description: 'Foto clara de tu cédula por ambos lados',
    required: true
  },
  {
    id: 'revenue_statement',
    name: 'Estados de Ingresos',
    description: 'Estados financieros mensuales y anuales',
    required: true
  },
  {
    id: 'bank_statement',
    name: 'Extractos Bancarios',
    description: 'Últimos 3 meses de extractos bancarios',
    required: true
  },
  {
    id: 'tax_return',
    name: 'Declaración de Renta',
    description: 'Última declaración de renta (opcional)',
    required: false
  }
];

export default function DocumentsPage() {
  const [user, setUser] = useState<any>(null);
  const [uploads, setUploads] = useState<{ [key: string]: File | null }>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and get user data
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          if (data.user.role !== 'seller') {
            router.push('/');
          }
        } else {
          router.push('/login');
        }
      });

    // Get existing documents
    fetch('/api/seller/documents')
      .then(res => res.json())
      .then(data => {
        if (data.documents) {
          setExistingDocs(data.documents);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleFileChange = (documentType: string, file: File | null) => {
    setUploads(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const handleUpload = async (documentType: string) => {
    const file = uploads[documentType];
    if (!file) return;

    setUploading(documentType);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      const response = await fetch('/api/seller/upload-document', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from uploads and refresh existing docs
        setUploads(prev => ({ ...prev, [documentType]: null }));
        
        // Refresh existing documents
        const docsResponse = await fetch('/api/seller/documents');
        const docsData = await docsResponse.json();
        if (docsData.documents) {
          setExistingDocs(docsData.documents);
        }
      } else {
        alert(`Error subiendo documento: ${data.error}`);
      }
    } catch (error) {
      alert('Error de conexión al subir documento');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      const response = await fetch('/api/seller/submit-verification', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error al enviar para revisión');
    }
  };

  const getDocumentStatus = (docType: string) => {
    const existing = existingDocs.find(doc => doc.document_type === docType);
    return existing ? existing.verification_status : null;
  };

  const hasRequiredDocuments = () => {
    const requiredTypes = documentTypes.filter(dt => dt.required).map(dt => dt.id);
    return requiredTypes.every(type => getDocumentStatus(type) !== null);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (submitted || user.verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Documentos en Revisión
            </h1>
            <p className="text-gray-600 mb-6">
              Hemos recibido tus documentos y están siendo revisados por nuestro equipo. 
              Te contactaremos por email en las próximas 24-48 horas.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.verificationStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Cuenta Verificada!
            </h1>
            <p className="text-gray-600 mb-6">
              Tu cuenta de vendedor ha sido aprobada. Ya puedes empezar a vender productos.
            </p>
            <button
              onClick={() => router.push('/seller/dashboard')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verificación de Vendedor
            </h1>
            <p className="text-gray-600">
              Sube los documentos requeridos para verificar tu cuenta
            </p>
          </div>

          <div className="space-y-6">
            {documentTypes.map((docType) => {
              const status = getDocumentStatus(docType.id);
              const hasUpload = uploads[docType.id];

              return (
                <div key={docType.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        {docType.name}
                        {docType.required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                    </div>
                    
                    {status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'approved' ? 'bg-green-100 text-green-800' :
                        status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status === 'approved' ? 'Aprobado' :
                         status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    )}
                  </div>

                  {!status && (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(docType.id, e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      
                      {hasUpload && (
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <span className="text-sm text-gray-700">{hasUpload.name}</span>
                          <button
                            onClick={() => handleUpload(docType.id)}
                            disabled={uploading === docType.id}
                            className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {uploading === docType.id ? 'Subiendo...' : 'Subir'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {status === 'rejected' && (
                    <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                      Documento rechazado. Por favor sube una nueva versión.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasRequiredDocuments() && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmitForReview}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Enviar para Revisión
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Una vez enviado, revisaremos tus documentos en 24-48 horas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}