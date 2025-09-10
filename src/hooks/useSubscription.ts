import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  description: string;
  max_rooms: number;
  max_users: number;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  trial_days: number;
  features: string[];
  is_active: boolean;
}

export interface UserSubscription {
  subscription_id: string;
  user_id: string;
  business_id: string;
  plan_id: string;
  plan_name: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  next_billing_date?: string;
  amount: number;
  currency: string;
  max_rooms: number;
  max_users: number;
  current_rooms: number;
  current_users: number;
  rooms_usage_percentage: number;
  users_usage_percentage: number;
  trial_days_remaining: number;
  trial_expired: boolean;
}

export interface SubscriptionLimits {
  maxRooms: number;
  maxUsers: number;
  currentRooms: number;
  currentUsers: number;
  canAddRooms: boolean;
  canAddUsers: boolean;
  remainingRooms: number;
  remainingUsers: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // 1. PRIMERO: Consultar suscripción real en la base de datos
      console.log('🔍 Consultando suscripción en base de datos...');
      const { data: subscription, error: subscriptionError } = await supabase
        .from('hl_user_subscriptions')
        .select(`
          id,
          user_id,
          business_id,
          plan_id,
          status,
          trial_start_date,
          trial_end_date,
          subscription_start_date,
          subscription_end_date,
          next_billing_date,
          amount,
          currency,
          metadata
        `)
        .eq('user_id', user.id)
        .single();

      if (subscription && !subscriptionError) {
        // Usuario tiene suscripción real en BD
        console.log('✅ Suscripción encontrada en BD:', subscription);
        
        // Obtener información del plan desde metadata o consultar tabla de planes
        let planInfo = null;
        if (subscription.metadata && subscription.metadata.plan_name) {
          planInfo = {
            name: subscription.metadata.plan_name,
            max_rooms: subscription.metadata.max_rooms || 20,
            max_users: subscription.metadata.max_users || 5
          };
        } else {
          // Consultar tabla de planes si no hay metadata
          const { data: planData } = await supabase
            .from('hl_subscription_plans')
            .select('name, max_rooms, max_users')
            .eq('plan_id', subscription.plan_id)
            .single();
          
          if (planData) {
            planInfo = planData;
          }
        }
        
        // Crear suscripción con formato esperado
        const formattedSubscription: UserSubscription = {
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          business_id: subscription.business_id,
          plan_id: subscription.plan_id,
          plan_name: planInfo?.name || 'Plan',
          status: subscription.status as any,
          trial_start_date: subscription.trial_start_date,
          trial_end_date: subscription.trial_end_date,
          subscription_start_date: subscription.subscription_start_date,
          subscription_end_date: subscription.subscription_end_date,
          next_billing_date: subscription.next_billing_date,
          amount: subscription.amount,
          currency: subscription.currency,
          max_rooms: planInfo?.max_rooms || 20,
          max_users: planInfo?.max_users || 5,
          current_rooms: 0, // Se calculará después
          current_users: 1, // Usuario actual
          rooms_usage_percentage: 0,
          users_usage_percentage: 0,
          trial_days_remaining: Math.max(0, Math.ceil((new Date(subscription.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
          trial_expired: new Date(subscription.trial_end_date) < new Date()
        };
        
        setSubscription(formattedSubscription);
        
        // Calcular límites desde BD
        const calculatedLimits: SubscriptionLimits = {
          maxRooms: formattedSubscription.max_rooms,
          maxUsers: formattedSubscription.max_users,
          currentRooms: formattedSubscription.current_rooms,
          currentUsers: formattedSubscription.current_users,
          canAddRooms: formattedSubscription.max_rooms === -1 || formattedSubscription.current_rooms < formattedSubscription.max_rooms,
          canAddUsers: formattedSubscription.max_users === -1 || formattedSubscription.current_users < formattedSubscription.max_users,
          remainingRooms: formattedSubscription.max_rooms === -1 ? -1 : Math.max(0, formattedSubscription.max_rooms - formattedSubscription.current_rooms),
          remainingUsers: formattedSubscription.max_users === -1 ? -1 : Math.max(0, formattedSubscription.max_users - formattedSubscription.current_users),
          isAtLimit: formattedSubscription.current_rooms >= formattedSubscription.max_rooms || formattedSubscription.current_users >= formattedSubscription.max_users,
          isNearLimit: formattedSubscription.rooms_usage_percentage >= 80 || formattedSubscription.users_usage_percentage >= 80
        };
        
        setLimits(calculatedLimits);
        setLoading(false);
        return;
      }

      // 2. SOLO SI no hay suscripción en BD: verificar localStorage (onboarding)
      console.log('⚠️ No hay suscripción en BD, verificando localStorage...');
      const storedPlan = localStorage.getItem('selected_plan');
      if (storedPlan) {
        try {
          const planData = JSON.parse(storedPlan);
          console.log('📋 Plan encontrado en localStorage (onboarding):', planData);
          
          // Crear suscripción simulada para el onboarding
          const mockSubscription = {
            subscription_id: 'onboarding',
            user_id: user.id,
            business_id: null, // Aún no existe
            plan_id: planData.planId,
            plan_name: planData.planName,
            status: 'trial' as const,
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 0,
            currency: 'CLP',
            max_rooms: planData.limits.maxRooms,
            max_users: planData.limits.maxUsers,
            current_rooms: 0, // Aún no hay habitaciones
            current_users: 1, // Solo el usuario actual
            rooms_usage_percentage: 0,
            users_usage_percentage: 0,
            trial_days_remaining: 14,
            trial_expired: false
          };
          
          setSubscription(mockSubscription);
          
          // Calcular límites
          const calculatedLimits: SubscriptionLimits = {
            maxRooms: planData.limits.maxRooms,
            maxUsers: planData.limits.maxUsers,
            currentRooms: 0,
            currentUsers: 1,
            canAddRooms: planData.limits.maxRooms === -1 || 0 < planData.limits.maxRooms,
            canAddUsers: planData.limits.maxUsers === -1 || 1 < planData.limits.maxUsers,
            remainingRooms: planData.limits.maxRooms === -1 ? -1 : planData.limits.maxRooms,
            remainingUsers: planData.limits.maxUsers === -1 ? -1 : Math.max(0, planData.limits.maxUsers - 1),
            isAtLimit: false,
            isNearLimit: planData.limits.maxRooms !== -1 && planData.limits.maxRooms <= 2
          };
          
          setLimits(calculatedLimits);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing stored plan:', error);
        }
      }
      
      // Si no hay plan en localStorage ni en BD, no hay suscripción
      console.log('⚠️ No hay suscripción en BD ni en localStorage - usuario sin suscripción');
      setSubscription(null);
      setLimits(null);
      setLoading(false);
      return;

    } catch (error) {
      console.error('Error loading subscription:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar suscripción');
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar re-renders

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const createSubscription = async (planId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener business_id del usuario
      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError || !businessData) {
        throw new Error('No se encontró información del negocio');
      }

      // Crear suscripción usando la función de base de datos
      const { data, error: createError } = await supabase
        .rpc('create_user_subscription', {
          p_user_id: user.id,
          p_business_id: businessData.id,
          p_plan_id: planId
        });

      if (createError) {
        throw createError;
      }

      // Recargar suscripción
      await loadSubscription();

      return data;

    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error instanceof Error ? error.message : 'Error al crear suscripción');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeAdd = (type: 'room' | 'user'): { allowed: boolean; message?: string } => {
    if (!subscription || !limits) {
      return { allowed: false, message: 'No se ha configurado una suscripción' };
    }

    if (subscription.trial_expired && subscription.status === 'trial') {
      return { 
        allowed: false, 
        message: 'Tu período de prueba ha expirado. Actualiza tu plan para continuar usando el sistema.' 
      };
    }

    if (type === 'room') {
      if (!limits.canAddRooms) {
        return { 
          allowed: false, 
          message: `Has alcanzado el límite de habitaciones de tu plan (${limits.maxRooms}). Actualiza tu plan para agregar más habitaciones.` 
        };
      }
    } else if (type === 'user') {
      if (!limits.canAddUsers) {
        return { 
          allowed: false, 
          message: `Has alcanzado el límite de usuarios de tu plan (${limits.maxUsers}). Actualiza tu plan para agregar más usuarios.` 
        };
      }
    }

    return { allowed: true };
  };

  const refreshLimits = async () => {
    if (!subscription?.business_id) return;

    try {
      // Actualizar límites de uso en la base de datos
      await supabase.rpc('update_usage_limits', {
        p_business_id: subscription.business_id
      });

      // Recargar suscripción
      await loadSubscription();
    } catch (error) {
      console.error('Error refreshing limits:', error);
    }
  };

  const getTrialStatus = () => {
    if (!subscription) return null;

    if (subscription.status === 'trial') {
      return {
        isTrial: true,
        daysRemaining: subscription.trial_days_remaining,
        isExpired: subscription.trial_expired,
        endDate: subscription.trial_end_date
      };
    }

    return {
      isTrial: false,
      daysRemaining: 0,
      isExpired: false,
      endDate: null
    };
  };

  return {
    subscription,
    limits,
    loading,
    error,
    createSubscription,
    validateBeforeAdd,
    refreshLimits,
    getTrialStatus,
    reload: loadSubscription
  };
}