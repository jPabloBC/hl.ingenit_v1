"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import BaseLayout from "@/components/layout/base-layout";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/hooks/useRegion";

interface Reservation {
  id: string;
  primary_guest_name: string;
  primary_guest_email: string;
  total_amount: number;
  currency: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  status: string;
  payment_status: string;
  hl_business: {
    business_name: string;
    address: string;
    city: string;
  };
  hl_rooms: {
    room_number: string;
    room_type: string;
  };
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get('reservationId');
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('hl_reservations')
        .select(`
          id,
          primary_guest_name,
          primary_guest_email,
          total_amount,
          currency,
          check_in_date,
          check_out_date,
          guest_count,
          status,
          payment_status,
          hl_business (
            business_name,
            address,
            city
          ),
          hl_rooms (
            room_number,
            room_type
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error) {
        console.error('Error loading reservation:', error);
        setError('No se pudo cargar la información de la reserva');
        return;
      }

      // Supabase devuelve arrays para las relaciones, necesitamos acceder al primer elemento
      const reservationData = {
        ...data,
        hl_business: data.hl_business?.[0] || data.hl_business,
        hl_rooms: data.hl_rooms?.[0] || data.hl_rooms
      };
      setReservation(reservationData);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!reservation) return 0;
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePayment = async () => {
    if (!reservation) return;

    try {
      setProcessing(true);
      setError(null);

      // Crear transacción de pago
      const response = await fetch('/api/webpay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          amount: reservation.total_amount,
          guestName: reservation.primary_guest_name,
          guestEmail: reservation.primary_guest_email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la transacción de pago');
      }

      // Redirigir a Webpay
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No se recibió la URL de pago');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4 font-body">Cargando información de pago...</p>
        </div>
      </BaseLayout>
    );
  }

  if (error || !reservation) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray4 mb-4">Error en el pago</h2>
          <p className="text-gray4 mb-6">{error || 'No se pudo cargar la información de la reserva'}</p>
          <Link href="/book">
            <Button className="bg-blue8 hover:bg-blue6 text-white">
              Volver a la búsqueda
            </Button>
          </Link>
        </div>
      </BaseLayout>
    );
  }

  const nights = calculateNights();

  return (
    <BaseLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue8 to-blue6 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/book" className="inline-flex items-center text-white hover:text-blue15 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la búsqueda
          </Link>
          
          <h1 className="text-3xl font-bold mb-2 font-title">Pago Seguro</h1>
          <p className="text-blue15 font-body">Completa tu reserva con Webpay</p>
        </div>
      </div>

      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información de la reserva */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-blue1 mb-6 font-title">Resumen de Reserva</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-blue1 mb-2">{reservation.hl_business.business_name}</h3>
                    <p className="text-sm text-gray4">
                      {reservation.hl_business.address}, {reservation.hl_business.city}
                    </p>
                  </div>

                  <div className="border-t border-gray8 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray4">Habitación:</span>
                      <span className="font-semibold">
                        {reservation.hl_rooms.room_number} - {reservation.hl_rooms.room_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray4">Check-in:</span>
                      <span className="font-semibold">{reservation.check_in_date}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray4">Check-out:</span>
                      <span className="font-semibold">{reservation.check_out_date}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray4">Noches:</span>
                      <span className="font-semibold">{nights}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray4">Huéspedes:</span>
                      <span className="font-semibold">{reservation.guest_count}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray8 pt-4">
                    <div className="flex justify-between items-center text-lg font-bold text-blue8">
                      <span>Total a pagar:</span>
                      <span>{formatCurrency(reservation.total_amount, reservation.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del huésped */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-blue1 mb-6 font-title">Datos del Huésped</h2>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray4">Nombre:</span>
                    <p className="font-semibold">{reservation.primary_guest_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray4">Email:</span>
                    <p className="font-semibold">{reservation.primary_guest_email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pago */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-blue1 mb-6 font-title">Método de Pago</h2>
                
                <div className="space-y-6">
                  {/* Webpay */}
                  <div className="border-2 border-blue8 rounded-lg p-4 bg-blue15">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <CreditCard className="h-6 w-6 text-blue8 mr-3" />
                        <div>
                          <h3 className="font-semibold text-blue1">Webpay Plus</h3>
                          <p className="text-sm text-gray4">Pago seguro con tarjeta de crédito/débito</p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-blue8" />
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray4">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue8 mr-2" />
                        Pago seguro con encriptación SSL
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue8 mr-2" />
                        Acepta todas las tarjetas principales
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue8 mr-2" />
                        Confirmación inmediata
                      </div>
                    </div>
                  </div>

                  {/* Información de seguridad */}
                  <div className="bg-gray10 rounded-lg p-4">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-blue8 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue1 mb-1">Pago 100% Seguro</h4>
                        <p className="text-sm text-gray4">
                          Tus datos están protegidos con encriptación de nivel bancario. 
                          No almacenamos información de tu tarjeta.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botón de pago */}
                  <Button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full bg-blue8 hover:bg-blue6 text-white font-body py-4 text-lg"
                  >
                    {processing ? (
                      <div className="flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Procesando pago...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pagar {formatCurrency(reservation.total_amount, reservation.currency)}
                      </div>
                    )}
                  </Button>

                  {error && (
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <p className="text-xs text-gray4 text-center">
                    Al completar el pago, aceptas nuestros{' '}
                    <Link href="/terms" className="text-blue8 hover:underline">términos y condiciones</Link>
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                <h3 className="font-semibold text-blue1 mb-4">¿Necesitas ayuda?</h3>
                <div className="space-y-3 text-sm text-gray4">
                  <p>• Tu reserva será confirmada inmediatamente después del pago</p>
                  <p>• Recibirás un email con los detalles de tu reserva</p>
                  <p>• Puedes cancelar hasta 24 horas antes del check-in</p>
                  <p>• Soporte disponible 24/7 en caso de problemas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}