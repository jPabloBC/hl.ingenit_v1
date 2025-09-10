import { NextRequest, NextResponse } from 'next/server';
import { webpayTransaction, formatAmount, generateBuyOrder, getReturnUrls } from '@/lib/webpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, amount, guestName, guestEmail } = body;

    // Validar datos requeridos
    if (!reservationId || !amount || !guestName) {
      return NextResponse.json(
        { error: 'Datos incompletos: reservationId, amount y guestName son requeridos' },
        { status: 400 }
      );
    }

    // Obtener business_id de la reserva
    const { data: reservationData, error: reservationError } = await supabase
      .from('hl_reservations')
      .select('business_id')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservationData) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Formatear monto para Webpay
    const formattedAmount = formatAmount(amount);
    
    // Generar orden única
    const buyOrder = generateBuyOrder();
    
    // URLs de retorno
    const { returnUrl } = getReturnUrls();

    // Crear transacción en Webpay
    const createResponse = await webpayTransaction.create(
      buyOrder,
      `Reserva Hotel - ${guestName}`,
      formattedAmount,
      returnUrl
    );

    // Guardar transacción en base de datos
    const { error: dbError } = await supabase
      .from('hl_payment_transactions')
      .insert([
        {
          business_id: reservationData.business_id,
          reservation_id: reservationId,
          webpay_token: createResponse.token,
          buy_order: buyOrder,
          amount: formattedAmount,
          guest_name: guestName,
          guest_email: guestEmail,
          status: 'created',
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error('Error saving transaction to DB:', dbError);
      return NextResponse.json(
        { error: 'Error al guardar transacción en base de datos' },
        { status: 500 }
      );
    }

    // Retornar URL y token para redirección
    return NextResponse.json({
      success: true,
      token: createResponse.token,
      url: createResponse.url,
      buyOrder: buyOrder
    });

  } catch (error) {
    console.error('Error creating Webpay transaction:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al crear transacción' },
      { status: 500 }
    );
  }
}