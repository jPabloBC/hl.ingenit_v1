import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: Iniciando creación de suscripción');
    const { planId } = await request.json();
    console.log('🔍 API: Plan ID recibido:', planId);

    if (!planId) {
      console.log('❌ API: Plan ID no proporcionado');
      return NextResponse.json(
        { error: 'planId es requerido' },
        { status: 400 }
      );
    }

    // Obtener usuario actual
    let user;
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 API: Usuario autenticado:', authUser ? 'Sí' : 'No');
    
    if (userError || !authUser) {
      console.log('🔍 API: Intentando autenticación por token');
      // Si no hay usuario autenticado, intentar obtener desde el header de autorización
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
        if (tokenError || !tokenUser) {
          console.log('❌ API: Token inválido:', tokenError);
          return NextResponse.json(
            { error: 'Token de autorización inválido' },
            { status: 401 }
          );
        }
        user = tokenUser;
        console.log('✅ API: Usuario autenticado por token');
      } else {
        console.log('❌ API: No hay token de autorización');
        return NextResponse.json(
          { error: 'Usuario no autenticado' },
          { status: 401 }
        );
      }
    } else {
      user = authUser;
      console.log('✅ API: Usuario autenticado por sesión');
    }

    // Verificar que el usuario no tenga ya una suscripción activa
    const { data: existingSubscription, error: existingError } = await supabase
      .from('hl_active_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Ya tienes una suscripción activa' },
        { status: 400 }
      );
    }

    // Obtener business_id del usuario (opcional durante registro)
    const { data: businessData, error: businessError } = await supabase
      .from('hl_business')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Si no hay business_id, crear suscripción sin él (durante registro)
    const businessId = businessData?.id || null;

    // Crear suscripción usando la función de base de datos
    console.log('🔍 API: Creando suscripción con:', {
      user_id: user.id,
      business_id: businessId,
      plan_id: planId
    });
    
    // Verificar que el plan existe primero
    console.log('🔍 API: Buscando plan con ID:', planId);
    const { data: planData, error: planError } = await supabase
      .from('hl_subscription_plans')
      .select('*')
      .eq('plan_id', planId)
      .single();
    
    console.log('🔍 API: Resultado búsqueda plan:', { planData, planError });
    
    if (planError || !planData) {
      console.error('❌ API: Plan no encontrado:', planError);
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 400 }
      );
    }
    
    console.log('✅ API: Plan encontrado:', planData);
    
    const { data: subscriptionId, error: createError } = await supabase
      .rpc('create_user_subscription', {
        p_user_id: user.id,
        p_plan_id: planId,
        p_business_id: businessId
      });

    if (createError) {
      console.error('❌ API: Error creating subscription:', createError);
      return NextResponse.json(
        { error: `Error al crear suscripción: ${createError.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ API: Suscripción creada con ID:', subscriptionId);

    // Obtener la suscripción creada con información completa
    const { data: newSubscription, error: fetchError } = await supabase
      .from('hl_user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      console.error('Error fetching new subscription:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener información de la suscripción' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: newSubscription,
      message: 'Suscripción creada exitosamente'
    });

  } catch (error) {
    console.error('Error in create subscription API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
