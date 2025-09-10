import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createWebpayPlus, getWebpayUrls } from '@/lib/transbank';
import { createClient } from '@supabase/supabase-js';

// Cliente con clave de servicio para operaciones de base de datos
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Debug: verificar variables de entorno
console.log('🔍 Debug - SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('🔍 Debug - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

export async function POST(request: NextRequest) {
  try {
    const { planId, amount, currency = 'CLP' } = await request.json();

    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // Validar plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('hl_subscription_plans')
      .select('*')
      .eq('plan_id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // Generar ID único para la transacción (máximo 26 caracteres)
    const timestamp = Date.now().toString().slice(-8);
    const userIdShort = user.id.slice(-8);
    const buyOrder = `SUB${userIdShort}${timestamp}`;
    const sessionId = `SES${userIdShort}${timestamp}`;
    const { returnUrl } = getWebpayUrls();

    // Crear transacción en Webpay
    const webpayPlus = createWebpayPlus();
    
    console.log('🔍 Debug - Parámetros de Webpay:');
    console.log('  - buyOrder:', buyOrder);
    console.log('  - sessionId:', sessionId);
    console.log('  - amount:', amount);
    console.log('  - returnUrl:', returnUrl);
    
    const initResponse = await webpayPlus.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );
    
    console.log('🔍 Debug - Respuesta de Webpay create:');
    console.log('  - token:', initResponse.token);
    console.log('  - url:', initResponse.url);

    // Buscar suscripción existente del usuario
    let existingSubscription = null;
    console.log('🔍 Debug - Buscando suscripción existente para user:', user.id);
    
    try {
      const { data, error } = await supabaseAdmin
        .from('hl_user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!error) {
        existingSubscription = data;
        console.log('🔍 Debug - Suscripción encontrada:', existingSubscription);
      } else {
        console.log('🔍 Debug - No se encontró suscripción existente:', error.message);
      }
    } catch (error) {
      console.log('🔍 Debug - Error al buscar suscripción:', error);
    }

    // Guardar transacción en la tabla de pagos de suscripciones
    console.log('🔍 Debug - Intentando insertar transacción...');
    console.log('🔍 Debug - User ID:', user.id);
    console.log('🔍 Debug - Plan ID:', planId);
    
    // Calcular fechas de facturación
    const now = new Date();
    const billingPeriodStart = now;
    const billingPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días
    const dueDate = billingPeriodEnd; // Fecha de vencimiento = fin del período de facturación
    
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('hl_subscription_payments')
      .insert({
        user_id: user.id,
        subscription_id: existingSubscription?.id || null,
        amount: amount,
        currency: currency,
        payment_method: 'webpay_plus',
        payment_status: 'pending',
        webpay_token: initResponse.token,
        webpay_buy_order: buyOrder,
        webpay_session_id: sessionId,
        plan_id: planId,
        billing_period_start: billingPeriodStart.toISOString(),
        billing_period_end: billingPeriodEnd.toISOString(),
        due_date: dueDate.toISOString(),
        metadata: {
          plan_name: plan.name,
          plan_features: plan.features,
          transaction_type: 'subscription_upgrade'
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('🔍 Debug - Error completo:', transactionError);
      console.error('🔍 Debug - Error code:', transactionError.code);
      console.error('🔍 Debug - Error message:', transactionError.message);
      console.error('🔍 Debug - Error details:', transactionError.details);
      console.error('🔍 Debug - Error hint:', transactionError.hint);
      
      return NextResponse.json({ 
        error: 'Error al crear transacción',
        details: transactionError.message,
        code: transactionError.code,
        hint: transactionError.hint
      }, { status: 500 });
    }

    console.log('🔍 Debug - Respuesta de Webpay:', initResponse);
    console.log('🔍 Debug - Token recibido:', initResponse.token);
    console.log('🔍 Debug - URL recibida:', initResponse.url);
    
    const response = {
      success: true,
      token: initResponse.token,
      url: initResponse.url,
      buyOrder,
      sessionId,
      transactionId: transaction.id
    };
    
    console.log('🔍 Debug - Respuesta final:', response);
    
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Error al inicializar el pago',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}