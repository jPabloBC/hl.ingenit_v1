import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Obtener suscripción activa
    const { data: subscription, error: subscriptionError } = await supabase
      .from('hl_active_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subscriptionError) {
      if (subscriptionError.code === 'PGRST116') {
        // No hay suscripción activa
        return NextResponse.json({
          hasSubscription: false,
          subscription: null
        });
      }
      throw subscriptionError;
    }

    // Calcular estado de la suscripción
    const now = new Date();
    const trialEndDate = new Date(subscription.trial_end_date);
    const isTrialExpired = subscription.status === 'trial' && trialEndDate <= now;
    const daysRemaining = subscription.trial_days_remaining;

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        ...subscription,
        isTrialExpired,
        daysRemaining,
        canUseSystem: !isTrialExpired && subscription.status !== 'cancelled' && subscription.status !== 'expired'
      }
    });

  } catch (error) {
    console.error('Error in subscription status API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
