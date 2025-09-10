import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: 'reservationId es requerido' },
        { status: 400 }
      );
    }

    // Obtener información completa de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        business_id,
        total_amount,
        guest_name,
        guest_email,
        check_in_date,
        status,
        hl_business (
          business_name
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la reserva esté pendiente de pago
    if (reservation.status !== 'pending') {
      return NextResponse.json(
        { error: 'La reserva ya ha sido procesada o cancelada' },
        { status: 400 }
      );
    }

    // Verificar que tenga monto pendiente
    if (reservation.total_amount <= 0) {
      return NextResponse.json(
        { error: 'La reserva no tiene monto pendiente de pago' },
        { status: 400 }
      );
    }

    // Verificar que no exista ya una transacción aprobada
    const { data: existingTransaction, error: transactionError } = await supabase
      .from('hl_payment_transactions')
      .select('id, status')
      .eq('reservation_id', reservationId)
      .eq('status', 'approved')
      .single();

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'La reserva ya tiene un pago aprobado' },
        { status: 400 }
      );
    }

    // Crear transacción Webpay para el pago pendiente
    const webpayResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/webpay/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          amount: reservation.total_amount,
          guestName: reservation.guest_name,
          guestEmail: reservation.guest_email,
        }),
      }
    );

    const webpayResult = await webpayResponse.json();

    if (!webpayResponse.ok) {
      throw new Error(webpayResult.error || 'Error al crear transacción de pago');
    }

    return NextResponse.json({
      success: true,
      paymentUrl: webpayResult.formUrl,
      token: webpayResult.token,
      message: 'Transacción de pago creada exitosamente'
    });

  } catch (error) {
    console.error('Error processing pending payment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}