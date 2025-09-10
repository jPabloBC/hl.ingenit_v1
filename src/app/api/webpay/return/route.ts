import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createWebpayPlus } from '@/lib/transbank';
import { createClient } from '@supabase/supabase-js';

// Cliente con clave de servicio para operaciones de base de datos
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tokenWs = url.searchParams.get('token_ws');

    if (!tokenWs) {
      return NextResponse.redirect(new URL('/hotel?payment=error&message=Token no encontrado', request.url));
    }

    // Crear instancia de Webpay Plus
    const webpayPlus = createWebpayPlus();
    
    // Confirmar la transacción
    const confirmResponse = await webpayPlus.commit(tokenWs);

    if (confirmResponse.status === 'AUTHORIZED') {
      // Buscar la transacción en la base de datos
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('hl_subscription_payments')
        .select('*')
        .eq('webpay_token', tokenWs)
        .single();

      if (transactionError || !transaction) {
        console.error('Error al buscar transacción:', transactionError);
        return NextResponse.redirect(new URL('/hotel?payment=error&message=Transacción no encontrada', request.url));
      }

      // Actualizar el estado de la transacción
      const { error: updateError } = await supabaseAdmin
        .from('hl_subscription_payments')
        .update({
          payment_status: 'completed',
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
        console.error('Error al actualizar transacción:', updateError);
        return NextResponse.redirect(new URL('/hotel?payment=error&message=Error al actualizar transacción', request.url));
      }

      // Actualizar la suscripción del usuario
      const { error: subscriptionError } = await supabaseAdmin
        .from('hl_user_subscriptions')
        .update({
          plan_id: transaction.plan_id,
          status: 'active',
          payment_status: 'paid',
          last_payment_date: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id);

      if (subscriptionError) {
        console.error('Error al actualizar suscripción:', subscriptionError);
        // No redirigir con error, el pago fue exitoso
      }

      // Redirigir a página de éxito
      return NextResponse.redirect(new URL('/hotel?payment=success&plan=' + transaction.plan_id, request.url));
    } else {
      // Pago rechazado
      const { error: updateError } = await supabaseAdmin
        .from('hl_subscription_payments')
        .update({
          payment_status: 'failed',
          webpay_response_code: confirmResponse.response_code,
          updated_at: new Date().toISOString()
        })
        .eq('webpay_token', tokenWs);

      return NextResponse.redirect(new URL('/hotel?payment=error&message=Pago rechazado', request.url));
    }

  } catch (error) {
    console.error('Error en webpay return:', error);
    return NextResponse.redirect(new URL('/hotel?payment=error&message=Error interno del servidor', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tokenWs = formData.get('token_ws') as string;

    if (!tokenWs) {
      return NextResponse.redirect(new URL('/hotel?payment=error&message=Token no encontrado', request.url));
    }

    // Crear instancia de Webpay Plus
    const webpayPlus = createWebpayPlus();
    
    // Confirmar la transacción
    const confirmResponse = await webpayPlus.commit(tokenWs);

    if (confirmResponse.status === 'AUTHORIZED') {
      // Buscar la transacción en la base de datos
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('hl_subscription_payments')
        .select('*')
        .eq('webpay_token', tokenWs)
        .single();

      if (transactionError || !transaction) {
        console.error('Error al buscar transacción:', transactionError);
        return NextResponse.redirect(new URL('/hotel?payment=error&message=Transacción no encontrada', request.url));
      }

      // Actualizar el estado de la transacción
      const { error: updateError } = await supabaseAdmin
        .from('hl_subscription_payments')
        .update({
          payment_status: 'completed',
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
        console.error('Error al actualizar transacción:', updateError);
        return NextResponse.redirect(new URL('/hotel?payment=error&message=Error al actualizar transacción', request.url));
      }

      // Actualizar la suscripción del usuario
      const { error: subscriptionError } = await supabaseAdmin
        .from('hl_user_subscriptions')
        .update({
          plan_id: transaction.plan_id,
          status: 'active',
          payment_status: 'paid',
          last_payment_date: new Date().toISOString(),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id);

      if (subscriptionError) {
        console.error('Error al actualizar suscripción:', subscriptionError);
        // No redirigir con error, el pago fue exitoso
      }

      // Redirigir a página de éxito
      return NextResponse.redirect(new URL('/hotel?payment=success&plan=' + transaction.plan_id, request.url));
    } else {
      // Pago rechazado
      const { error: updateError } = await supabaseAdmin
        .from('hl_subscription_payments')
        .update({
          payment_status: 'failed',
          webpay_response_code: confirmResponse.response_code,
          updated_at: new Date().toISOString()
        })
        .eq('webpay_token', tokenWs);

      return NextResponse.redirect(new URL('/hotel?payment=error&message=Pago rechazado', request.url));
    }

  } catch (error) {
    console.error('Error en webpay return:', error);
    return NextResponse.redirect(new URL('/hotel?payment=error&message=Error interno del servidor', request.url));
  }
}