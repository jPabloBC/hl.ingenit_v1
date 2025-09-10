import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { newPlanId, currentRooms } = await request.json();
    
    // Obtener el token del header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar el token con Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (!newPlanId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Verificar que el nuevo plan existe
    const { data: newPlan, error: planError } = await supabase
      .from('app_hl.hl_subscription_plans')
      .select('*')
      .eq('plan_id', newPlanId)
      .single();

    if (planError || !newPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Verificar que el usuario tiene una suscripción activa
    const { data: currentSubscription, error: subError } = await supabase
      .from('app_hl.hl_user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['trial', 'active'])
      .single();

    if (subError || !currentSubscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Verificar que el nuevo plan tiene más habitaciones que las actuales
    if (newPlan.max_rooms !== -1 && currentRooms > newPlan.max_rooms) {
      return NextResponse.json({ 
        error: `El plan ${newPlan.name} solo permite ${newPlan.max_rooms} habitaciones, pero tienes ${currentRooms} configuradas.` 
      }, { status: 400 });
    }

    // Actualizar la suscripción
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('app_hl.hl_user_subscriptions')
      .update({
        plan_id: newPlanId,
        amount: newPlan.price_monthly,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSubscription.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Si es plan enterprise, marcar como pendiente de contacto
    if (newPlanId === 'enterprise') {
      await supabase
        .from('app_hl.hl_user_subscriptions')
        .update({
          status: 'pending_contact',
          metadata: {
            ...currentSubscription.metadata,
            upgrade_reason: 'room_limit_exceeded',
            previous_plan: currentSubscription.plan_id,
            upgrade_date: new Date().toISOString()
          }
        })
        .eq('id', currentSubscription.id);
    }

    return NextResponse.json({ 
      subscription: updatedSubscription, 
      message: 'Subscription upgraded successfully',
      newPlan: {
        id: newPlan.plan_id,
        name: newPlan.name,
        maxRooms: newPlan.max_rooms,
        price: newPlan.price_monthly
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
