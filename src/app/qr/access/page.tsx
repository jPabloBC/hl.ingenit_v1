"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Smartphone, CheckCircle, XCircle, Clock, User, Building } from 'lucide-react';

function QRAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Token no encontrado en la URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/qr/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Error validando el token');
        return;
      }

      if (data.success) {
        setSuccess(true);
        setUserData(data.user);
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          // Guardar datos del empleado directamente (más simple)
          localStorage.setItem('qr_employee_session', JSON.stringify({
            employee_id: data.user.employee_id,
            name: data.user.name,
            role: data.user.role,
            business_id: data.business_id,
            expires_at: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
          }));
          
          router.push('/hotel?qr_access=true');
        }, 2000);
      } else {
        setError(data.message || 'Token inválido');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setSuccess(false);
    setUserData(null);
    if (token) {
      validateToken();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <QrCode className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso QR
          </h1>
          <p className="text-gray-600">
            Escanea el código QR para acceder al sistema
          </p>
        </div>

        {/* Status Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Validando Acceso</CardTitle>
            <CardDescription className="text-center">
              Procesando tu código QR...
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Validando token...</p>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                
                <div className="text-center">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full"
                  >
                    Intentar Nuevamente
                  </Button>
                </div>
              </div>
            )}

            {success && userData && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ¡Acceso autorizado! Redirigiendo...
                  </AlertDescription>
                </Alert>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Empleado</h3>
                  </div>
                  <p className="text-blue-800 font-medium">{userData.name}</p>
                  <p className="text-blue-700 text-sm">{userData.role}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Building className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">Acceso Autorizado</h3>
                  </div>
                  <p className="text-green-800 text-sm">
                    Tienes acceso a las funcionalidades asignadas por tu administrador.
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center text-green-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">Redirigiendo en 2 segundos...</span>
                  </div>
                </div>
              </div>
            )}

            {!token && !loading && !error && !success && (
              <div className="text-center py-8">
                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No se encontró un token QR válido en la URL.
                </p>
                <p className="text-sm text-gray-500">
                  Asegúrate de escanear el código QR desde la aplicación móvil.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>¿Problemas para acceder? Contacta al administrador</p>
        </div>
      </div>
    </div>
  );
}

export default function QRAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      </div>
    }>
      <QRAccessContent />
    </Suspense>
  );
}