import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    console.log('Session validation API called');
    const { session_token } = await request.json();
    console.log('Session token received:', session_token ? 'Present' : 'Missing');

    if (!session_token) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 400 }
      );
    }

    // Verificar JWT
    const decoded = jwt.verify(session_token, process.env.SUPABASE_SERVICE_ROLE_KEY!) as any;
    console.log('JWT decoded successfully:', { employee_id: decoded.employee_id, role: decoded.role });
    
    return NextResponse.json({
      valid: true,
      employee_id: decoded.employee_id,
      business_id: decoded.business_id,
      permissions: decoded.permissions,
      role: decoded.role,
      exp: decoded.exp
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Invalid session token' },
      { status: 401 }
    );
  }
}