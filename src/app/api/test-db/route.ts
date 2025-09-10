import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente con clave de servicio para operaciones de base de datos
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug - Iniciando prueba de base de datos...');
    
    // Probar inserción directa
    const { data, error } = await supabaseAdmin
      .from('app_hl.hl_subscription_payments')
      .insert({
        user_id: 'bba89079-04a5-4ecd-ab65-6a59bec3e24d',
        amount: 9990.00,
        currency: 'CLP',
        payment_method: 'webpay_plus',
        payment_status: 'pending',
        webpay_token: 'test_api_endpoint',
        webpay_buy_order: 'test_buy_order_api',
        webpay_session_id: 'test_session_api',
        plan_id: 'starter',
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { test: 'api_endpoint' }
      })
      .select()
      .single();

    if (error) {
      console.error('🔍 Debug - Error en inserción:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('🔍 Debug - Inserción exitosa:', data);
    
    // Limpiar el registro de prueba
    await supabaseAdmin
      .from('app_hl.hl_subscription_payments')
      .delete()
      .eq('id', data.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Inserción exitosa',
      data: data
    });

  } catch (error) {
    console.error('🔍 Debug - Error general:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}