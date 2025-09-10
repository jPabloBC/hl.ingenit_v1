import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Cliente con service role para operaciones administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('QR Generate API called');
    
    const { employeeId, expiresInMinutes = 30 } = await request.json();
    console.log('Request data:', { employeeId, expiresInMinutes });

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Obtener usuario actual
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication', details: authError?.message },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Verificar que el usuario es owner del negocio
    const { data: businessData, error: businessError } = await supabase
      .from('hl_business')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_type', 'hotel')
      .single();

    if (businessError || !businessData) {
      console.error('Business error:', businessError);
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    console.log('Business found:', businessData.id);

    // Verificar que el empleado pertenece al negocio
    const { data: employeeData, error: employeeError } = await supabase
      .from('hl_employees')
      .select(`
        id,
        first_name,
        last_name,
        role_id
      `)
      .eq('id', employeeId)
      .eq('business_id', businessData.id)
      .single();

    if (employeeError || !employeeData) {
      console.error('Employee error:', employeeError);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    console.log('Employee found:', employeeData);

    // Generar token QR directamente (versión simplificada)
    const tokenData = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    console.log('Generated token:', tokenData);
    console.log('Expires at:', expiresAt.toISOString());
    
    // Insertar token en la base de datos
    const { error: tokenError } = await supabaseAdmin
      .from('hl_qr_tokens')
      .insert({
        business_id: businessData.id,
        employee_id: employeeId,
        token: tokenData,
        permissions: [],
        expires_at: expiresAt.toISOString(),
        created_by: user.id
      });

    if (tokenError) {
      console.error('Error generating QR token:', tokenError);
      return NextResponse.json(
        { error: 'Error generating QR token: ' + tokenError.message },
        { status: 500 }
      );
    }

    console.log('Token inserted successfully');

    // Crear URL del QR
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/qr/access?token=${tokenData}`;

    return NextResponse.json({
      success: true,
      token: tokenData,
      qrUrl,
      employee: {
        id: employeeData.id,
        name: `${employeeData.first_name} ${employeeData.last_name}`,
        role: 'Empleado'
      },
      permissions: [],
      expiresIn: expiresInMinutes,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error in QR generation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}