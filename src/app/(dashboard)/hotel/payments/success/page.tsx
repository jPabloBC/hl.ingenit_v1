"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const token_ws = searchParams.get('token_ws');
        const TBK_TOKEN = searchParams.get('TBK_TOKEN');

        if (TBK_TOKEN) {
          // Pago cancelado por el usuario
          setPaymentStatus('failed');
          setLoading(false);
          return;
        }

        if (!token_ws) {
          setPaymentStatus('failed');
          setLoading(false);
          return;
        }

        // Confirmar pago con Webpay
        const response = await fetch('/api/webpay/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token_ws })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.status === 'AUTHORIZED') {
            setPaymentStatus('success');
            setPaymentDetails(data.response);
          } else {
            setPaymentStatus('failed');
          }
        } else {
          setPaymentStatus('failed');
        }
      } catch (error) {
        console.error('Error confirmando pago:', error);
        setPaymentStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  const handleReturnToDashboard = () => {
    router.push('/hotel');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmando pago...</h2>
          <p className="text-gray-600">Por favor espera mientras procesamos tu pago</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {paymentStatus === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Pago Exitoso!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades de tu plan.
            </p>

            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Detalles del Pago</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Monto:</span>
                    <span className="font-medium">${paymentDetails.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span className="font-medium">
                      {paymentDetails.transaction_date ? 
                        new Date(paymentDetails.transaction_date).toLocaleDateString('es-CL') : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Autorización:</span>
                    <span className="font-medium">{paymentDetails.authorization_code || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleReturnToDashboard}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ir al Dashboard
            </Button>
          </>
        )}

        {paymentStatus === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago No Procesado
            </h1>
            
            <p className="text-gray-600 mb-6">
              Hubo un problema al procesar tu pago. Por favor, intenta nuevamente o contacta a soporte si el problema persiste.
            </p>

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/hotel')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Volver al Dashboard
              </Button>
              
              <Button 
                onClick={() => router.push('/hotel')}
                variant="outline"
                className="w-full"
              >
                Intentar Nuevamente
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}