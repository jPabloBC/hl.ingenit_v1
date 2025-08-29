"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HotelLayout from "@/components/layout/hotel-layout";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Home,
  CreditCard,
  Calendar
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState({
    status: '',
    buyOrder: '',
    amount: '',
    message: ''
  });

  useEffect(() => {
    // Obtener parámetros de la URL
    const status = searchParams.get('status') || '';
    const buyOrder = searchParams.get('buyOrder') || '';
    const amount = searchParams.get('amount') || '';
    const message = searchParams.get('message') || '';

    setPaymentData({
      status,
      buyOrder,
      amount,
      message
    });
  }, [searchParams]);

  const getStatusInfo = () => {
    switch (paymentData.status) {
      case 'approved':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-600" />,
          title: '¡Pago Exitoso!',
          description: 'Tu pago ha sido procesado correctamente.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-16 w-16 text-red-600" />,
          title: 'Pago Rechazado',
          description: 'Tu pago no pudo ser procesado. Intenta nuevamente.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-16 w-16 text-orange-600" />,
          title: 'Error en el Pago',
          description: paymentData.message || 'Ocurrió un error durante el procesamiento.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800'
        };
      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-gray-600" />,
          title: 'Estado Desconocido',
          description: 'No se pudo determinar el estado del pago.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isSuccess = paymentData.status === 'approved';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center py-12">
        {/* Status Icon and Title */}
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2 rounded-lg p-8 mb-8`}>
          <div className="flex justify-center mb-6">
            {statusInfo.icon}
          </div>
          
          <h1 className={`text-3xl font-bold ${statusInfo.textColor} mb-4 font-title`}>
            {statusInfo.title}
          </h1>
          
          <p className={`text-lg ${statusInfo.textColor} mb-6`}>
            {statusInfo.description}
          </p>

          {/* Payment Details */}
          {(paymentData.buyOrder || paymentData.amount) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Transacción</h3>
              <div className="space-y-3">
                {paymentData.buyOrder && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Orden de Compra:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {paymentData.buyOrder}
                    </span>
                  </div>
                )}
                {paymentData.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-semibold text-green-600">
                      ${parseFloat(paymentData.amount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="text-gray-900">
                    {new Date().toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          {isSuccess ? (
            <>
              <Button 
                onClick={() => router.push('/business-type/hotel/reservations')}
                className="flex items-center space-x-2 bg-blue8 hover:bg-blue6"
              >
                <Calendar className="h-4 w-4" />
                <span>Ver Reservas</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/business-type/hotel/payments')}
                className="flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Ver Pagos</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => router.push('/business-type/hotel/sales')}
                className="flex items-center space-x-2 bg-blue8 hover:bg-blue6"
              >
                <CreditCard className="h-4 w-4" />
                <span>Intentar Nuevamente</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/business-type/hotel')}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Ir al Dashboard</span>
              </Button>
            </>
          )}
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-blue-800">Información</h4>
              <p className="text-sm text-blue-700 mt-1">
                {isSuccess 
                  ? 'Tu reserva ha sido confirmada. Recibirás un email con los detalles de tu reserva.'
                  : 'Si el problema persiste, contacta con nuestro soporte técnico.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <HotelLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <PaymentSuccessContent />
      </Suspense>
    </HotelLayout>
  );
}
