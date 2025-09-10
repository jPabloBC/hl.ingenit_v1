import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente con service role para operaciones administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('Testing API...');
    
    // Probar conexión a la base de datos
    const { data, error } = await supabaseAdmin
      .from('hl_qr_tokens')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API is working',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
