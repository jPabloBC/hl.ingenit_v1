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
    console.log('QR Validate API called');
    const { token } = await request.json();
    console.log('Token received:', token ? 'Present' : 'Missing');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validar token directamente (versión simplificada)
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('hl_qr_tokens')
      .select(`
        business_id,
        employee_id,
        permissions,
        expires_at,
        used_at
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Verificar si está expirado
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      );
    }

    // Verificar si ya fue usado
    if (tokenData.used_at) {
      return NextResponse.json(
        { error: 'Token already used' },
        { status: 400 }
      );
    }

    // Marcar como usado
    await supabaseAdmin
      .from('hl_qr_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Crear sesión temporal para el empleado
    const { data: employeeData, error: employeeError } = await supabase
      .from('hl_employees')
      .select(`
        id,
        first_name,
        last_name,
        email,
        role_id,
        business_id,
        hl_user_roles (
          name,
          display_name
        )
      `)
      .eq('id', tokenData.employee_id)
      .single();

    if (employeeError || !employeeData) {
      return NextResponse.json(
        { error: 'Employee data not found' },
        { status: 404 }
      );
    }

    // Crear sesión temporal segura con JWT
    console.log('Token validated successfully for employee:', employeeData.first_name, employeeData.last_name);
    
    // Crear JWT temporal (expira en 8 horas)
    const jwt = require('jsonwebtoken');
    const sessionToken = jwt.sign({
      employee_id: tokenData.employee_id,
      business_id: tokenData.business_id,
      permissions: tokenData.permissions,
      role: employeeData.hl_user_roles?.name || 'employee',
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 horas
    }, process.env.SUPABASE_SERVICE_ROLE_KEY);

    return NextResponse.json({
      success: true,
      user: {
        id: tokenData.employee_id,
        name: `${employeeData.first_name} ${employeeData.last_name}`,
        email: employeeData.email,
        role: employeeData.hl_user_roles?.display_name || 'Sin rol',
        is_owner: false,
        employee_id: tokenData.employee_id
      },
      business_id: tokenData.business_id,
      permissions: tokenData.permissions,
      session_token: sessionToken,
      redirect_url: '/hotel',
      message: 'Acceso autorizado. Funcionalidad limitada disponible.'
    });

  } catch (error) {
    console.error('Error in QR validation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}