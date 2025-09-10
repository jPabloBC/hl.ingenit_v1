"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Copy, Check, Clock, User, Shield, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QRGeneratorProps {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    role_id: string;
    hl_user_roles?: {
      name: string;
      display_name: string;
    };
  };
  onClose: () => void;
}

interface QRData {
  token: string;
  qrUrl: string;
  employee: {
    id: string;
    name: string;
    role: string;
  };
  permissions: any[];
  expiresIn: number;
  expiresAt: string;
}

export default function QRGenerator({ employee, onClose }: QRGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState(30);

  const generateQR = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { session: !!session, error: sessionError });
      
      if (!session) {
        setError('Sesión no válida. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          employeeId: employee.id,
          expiresInMinutes: expiresIn
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error generando QR');
        return;
      }

      setQrData(data);
    } catch (error) {
      console.error('Error generating QR:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadQR = () => {
    if (!qrData) return;
    
    // Crear un enlace de descarga para el QR
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.qrUrl)}`;
    link.download = `qr-${employee.first_name}-${employee.last_name}.png`;
    link.click();
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Generar QR de Acceso
          </CardTitle>
          <CardDescription>
            Código QR para {employee.first_name} {employee.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!qrData && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de expiración (minutos)
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">Empleado</h3>
                </div>
                <p className="text-blue-800 font-medium">
                  {employee.first_name} {employee.last_name}
                </p>
                <p className="text-blue-700 text-sm">
                  {employee.hl_user_roles?.display_name || 'Sin rol'}
                </p>
              </div>

              <Button
                onClick={generateQR}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generar QR
                  </>
                )}
              </Button>
            </div>
          )}

          {qrData && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qrUrl)}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">QR Generado</h3>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">
                      {formatTimeRemaining(qrData.expiresAt)}
                    </span>
                  </div>
                </div>
                <p className="text-green-800 text-sm">
                  El empleado puede escanear este código para acceder al sistema.
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del QR
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={qrData.qrUrl}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(qrData.qrUrl)}
                      className="px-3"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={downloadQR}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar QR
                  </Button>
                  <Button
                    onClick={generateQR}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• El empleado debe escanear el QR con su celular</li>
                  <li>• El código expira en {expiresIn} minutos</li>
                  <li>• Solo puede usarse una vez</li>
                  <li>• El acceso es limitado según los permisos del empleado</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cerrar
            </Button>
            {qrData && (
              <Button
                onClick={() => {
                  setQrData(null);
                  setError('');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Nuevo QR
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}