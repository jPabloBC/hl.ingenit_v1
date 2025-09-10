import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createWebpayPlus } from '@/lib/transbank';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tokenWs = formData.get('token_ws') as string;

    if (!tokenWs) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 400 });
    }

    // Crear instancia de Webpay Plus
    const webpayPlus = createWebpayPlus();
    
    // Confirmar la transacción
    const confirmResponse = await webpayPlus.commit(tokenWs);

    // Buscar la transacción en la base de datos
    const { data: transaction, error: transactionError } = await supabase
      .from('hl_subscription_payments')
      .select('*')
      .eq('webpay_token', tokenWs)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
    }

    if (confirmResponse.status === 'AUTHORIZED') {
      // Actualizar el estado de la transacción
      const { error: updateError } = await supabase
        .from('hl_subscription_payments')
        .update({
          status: 'completed',
          webpay_authorization_code: confirmResponse.authorization_code,
          webpay_payment_type_code: confirmResponse.payment_type_code,
          webpay_response_code: confirmResponse.response_code,
          webpay_installments_number: confirmResponse.installments_number,
          webpay_installments_amount: confirmResponse.installments_amount,
          webpay_transaction_date: confirmResponse.transaction_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        return NextResponse.json({ error: 'Error al actualizar transacción' }, { status: 500 });
      }

      // Actualizar la suscripción del usuario
      const { error: subscriptionError } = await supabase
        .from('hl_user_subscriptions')
        .update({
          plan_id: transaction.plan_id,
          status: 'active',
          payment_status: 'paid',
          last_payment_date: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id);

      if (subscriptionError) {
        console.error('Error al actualizar suscripción:', subscriptionError);
      }

      return NextResponse.json({
        success: true,
        status: 'AUTHORIZED',
        authorization_code: confirmResponse.authorization_code,
        payment_type_code: confirmResponse.payment_type_code,
        response_code: confirmResponse.response_code,
        installments_number: confirmResponse.installments_number,
        installments_amount: confirmResponse.installments_amount,
        transaction_date: confirmResponse.transaction_date
      });
    } else {
      // Pago rechazado
      const { error: updateError } = await supabase
        .from('hl_subscription_payments')
        .update({
          status: 'failed',
          webpay_response_code: confirmResponse.response_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: false,
        status: confirmResponse.status,
        response_code: confirmResponse.response_code
      });
    }

  } catch (error) {
    console.error('Error en webpay confirm:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}