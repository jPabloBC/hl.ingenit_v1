import { NextRequest, NextResponse } from 'next/server';
import { webpayTransaction, getReturnUrls } from '@/lib/webpay';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token_ws = formData.get('token_ws') as string;

    if (!token_ws) {
      return NextResponse.json(
        { error: 'Token no recibido' },
        { status: 400 }
      );
    }

    // Confirmar transacción con Webpay
    const commitResponse = await webpayTransaction.commit(token_ws);

    // Buscar transacción en base de datos
    const { data: transaction, error: findError } = await supabase
      .from('hl_payment_transactions')
      .select('*')
      .eq('webpay_token', token_ws)
      .single();

    if (findError || !transaction) {
      console.error('Transaction not found:', findError);
      return NextResponse.redirect(`${getReturnUrls().finalUrl}?status=error&message=Transacción no encontrada`);
    }

    // Determinar estado final basado en respuesta de Webpay
    const isApproved = commitResponse.response_code === 0;
    const finalStatus = isApproved ? 'approved' : 'rejected';

    // Actualizar estado en base de datos
    const { error: updateError } = await supabase
      .from('hl_payment_transactions')
      .update({
        status: finalStatus,
        webpay_response: commitResponse,
        authorization_code: commitResponse.authorization_code,
        card_number: commitResponse.card_detail?.card_number,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('webpay_token', token_ws);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
    }

    // Si el pago fue aprobado, actualizar estado de la reserva
    if (isApproved && transaction.reservation_id) {
      const { error: reservationError } = await supabase
        .from('hl_reservations')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.reservation_id);

      if (reservationError) {
        console.error('Error updating reservation:', reservationError);
      }
    }

    // Redireccionar a página de resultado
    const redirectUrl = `${getReturnUrls().finalUrl}?status=${finalStatus}&buyOrder=${transaction.buy_order}&amount=${transaction.amount}`;
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error processing Webpay return:', error);
    const errorUrl = `${getReturnUrls().finalUrl}?status=error&message=Error procesando pago`;
    return NextResponse.redirect(errorUrl);
  }
}

