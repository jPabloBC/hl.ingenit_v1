import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug - Iniciando prueba simple...');
    
    // Verificar variables de entorno
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 Debug - Variables de entorno:', { hasUrl, hasKey });
    
    if (!hasUrl || !hasKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Variables de entorno faltantes',
        hasUrl,
        hasKey
      }, { status: 500 });
    }

    // Crear cliente
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔍 Debug - Cliente creado exitosamente');

    // Probar consulta simple
    const { data, error } = await supabaseAdmin
      .from('app_hl.hl_subscription_payments')
      .select('count')
      .limit(1);

    if (error) {
      console.error('🔍 Debug - Error en consulta:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('🔍 Debug - Consulta exitosa:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'Conexión exitosa',
      data: data
    });

  } catch (error) {
    console.error('🔍 Debug - Error general:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}