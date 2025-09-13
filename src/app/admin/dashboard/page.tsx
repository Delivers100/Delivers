'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PendingUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  phone?: string;
  created_at: string;
  documents: any[];
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          if (data.user.role !== 'admin') {
            router.push('/');
            return;
          }
          fetchPendingUsers();
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('/api/admin/pending-sellers');
      const data = await response.json();
      if (data.users) {
        setPendingUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: number, action: 'approve' | 'reject', notes?: string) => {
    setActionLoading(`${userId}-${action}`);
    
    try {
      const response = await fetch('/api/admin/verify-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, notes })
      });

      if (response.ok) {
        // Remove user from pending list
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setSelectedUser(null);
        alert(`Usuario ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
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
              <h1 className="text-2xl font-bold text-green-600">Delivers Admin</h1>
              <span className="text-xs text-gray-500 -mt-1">inspirado por amazon</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Admin: {user?.firstName}</span>
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
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Vendedores Pendientes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingUsers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Users */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Vendedores Pendientes de Verificación
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Revisa y aprueba o rechaza las solicitudes de vendedores
            </p>
          </div>
          
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">✅</span>
              <p className="text-gray-500">No hay vendedores pendientes de verificación</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingUsers.map((pendingUser) => (
                <li key={pendingUser.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {pendingUser.firstName.charAt(0)}{pendingUser.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {pendingUser.firstName} {pendingUser.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pendingUser.businessName} • {pendingUser.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          Registrado: {new Date(pendingUser.created_at).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedUser(pendingUser)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Ver Documentos
                      </button>
                      <button
                        onClick={() => handleUserAction(pendingUser.id, 'approve')}
                        disabled={actionLoading === `${pendingUser.id}-approve`}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === `${pendingUser.id}-approve` ? 'Aprobando...' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => handleUserAction(pendingUser.id, 'reject')}
                        disabled={actionLoading === `${pendingUser.id}-reject`}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === `${pendingUser.id}-reject` ? 'Rechazando...' : 'Rechazar'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Document Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Documentos de {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedUser.documents && selectedUser.documents.length > 0 ? (
                  selectedUser.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(doc.upload_date).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Archivo: {doc.file_name}
                      </p>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver Documento
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No hay documentos subidos</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'reject')}
                  disabled={actionLoading === `${selectedUser.id}-reject`}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'approve')}
                  disabled={actionLoading === `${selectedUser.id}-approve`}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}