"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Star, Users, Bed, AlertTriangle, X, Check, Calendar } from "lucide-react";
import { usePlanSelection } from "@/hooks/usePlanSelection";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";

interface PlanLimitsAlertProps {
  businessId: string;
  onUpgrade?: () => void;
}

export default function PlanLimitsAlert({ businessId, onUpgrade }: PlanLimitsAlertProps) {
  const { selectedPlan, canAddRooms, canAddUsers, getRemainingRooms, getRemainingUsers, planLimits } = usePlanSelection();
  const { subscription, getActiveSubscriptionDays } = useSubscription();
  const [currentStats, setCurrentStats] = useState({
    rooms: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadCurrentStats();
  }, [businessId]);

  const loadCurrentStats = async () => {
    try {
      // Cargar estadísticas actuales
      const [roomsResult, usersResult] = await Promise.all([
        supabase
          .from('hl_rooms')
          .select('id', { count: 'exact' })
          .eq('business_id', businessId),
        supabase
          .from('hl_employees')
          .select('id', { count: 'exact' })
          .eq('business_id', businessId)
      ]);

      setCurrentStats({
        rooms: roomsResult.count || 0,
        users: usersResult.count || 0
      });
    } catch (error) {
      console.error('Error loading current stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener planes disponibles para upgrade
  const getAvailablePlans = () => {
    const planHierarchy = ['trial', 'starter', 'professional', 'business', 'enterprise'];
    const currentPlanIndex = planHierarchy.indexOf(selectedPlan?.planId || 'trial');
    return planHierarchy.slice(currentPlanIndex + 1);
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setShowUpgradeModal(false);
      
      // Obtener sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        alert('Error: No se pudo obtener la sesión del usuario');
        return;
      }

      // Obtener información del plan
      const planLimitsData = planLimits[planId];
      if (!planLimitsData) {
        alert('Error: Plan no encontrado');
        return;
      }

      // Calcular costo de upgrade
      const upgradeCost = calculateUpgradeCost(planId);
      const amount = upgradeCost.cost;

      if (amount <= 0) {
        alert('No hay costo adicional para este plan');
        return;
      }

      // Inicializar pago con Webpay
      const response = await fetch('/api/webpay/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          planId: planId,
          amount: amount,
          currency: 'CLP'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al inicializar el pago');
      }

      const paymentData = await response.json();
      
      // Redirigir a Webpay
      window.location.href = paymentData.url;
      
    } catch (error) {
      console.error('Error al procesar upgrade:', error);
      alert(`Error al procesar el upgrade: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const getPlanName = (planId: string): string => {
    const names: Record<string, string> = {
      trial: 'Prueba Gratuita',
      starter: 'Hoteles Pequeños',
      professional: 'Hoteles Medianos',
      business: 'Hoteles Grandes',
      enterprise: 'Enterprise'
    };
    return names[planId] || planId;
  };

  const calculateUpgradeCost = (newPlanId: string) => {
    if (!subscription || !selectedPlan) return { cost: 0, daysRemaining: 0, message: '' };
    
    const newPlan = planLimits[newPlanId];
    if (!newPlan || newPlan.price === 0) return { cost: 0, daysRemaining: 0, message: 'Contactar para precio personalizado' };
    
    const currentPlan = selectedPlan;
    const activeDaysRemaining = getActiveSubscriptionDays();
    
    // Si está en período de prueba (solo trial, sin pago)
    if (subscription.status === 'trial') {
      const trialDaysRemaining = subscription.trial_days_remaining || 0;
      const monthlyCost = newPlan.price;
      const dailyCost = monthlyCost / 30;
      const costForRemainingDays = dailyCost * trialDaysRemaining;
      
      return {
        cost: Math.ceil(costForRemainingDays),
        daysRemaining: trialDaysRemaining,
        message: `Pagar por ${trialDaysRemaining} días restantes de prueba`
      };
    }
    
    // Si ya tiene plan activo (ya pagó)
    if (subscription.status === 'active') {
      // Calcular la diferencia entre el plan actual y el nuevo plan
      const currentMonthlyCost = currentPlan.limits.price;
      const newMonthlyCost = newPlan.price;
      const monthlyDifference = newMonthlyCost - currentMonthlyCost;
      
      if (monthlyDifference > 0) {
        return {
          cost: monthlyDifference,
          daysRemaining: activeDaysRemaining,
          message: `Diferencia mensual: ${formatCLP(monthlyDifference)}`
        };
      } else if (monthlyDifference < 0) {
        return {
          cost: 0,
          daysRemaining: activeDaysRemaining,
          message: `Sin costo adicional (plan más económico)`
        };
      } else {
        return {
          cost: 0,
          daysRemaining: activeDaysRemaining,
          message: `Mismo precio mensual`
        };
      }
    }
    
    return { cost: 0, daysRemaining: 0, message: '' };
  };

  if (loading || !selectedPlan) {
    return null;
  }

  const remainingRooms = getRemainingRooms(currentStats.rooms);
  const remainingUsers = getRemainingUsers(currentStats.users);
  const isNearLimit = remainingRooms <= 2 || remainingUsers <= 1;
  const isAtLimit = remainingRooms === 0 || remainingUsers === 0;

  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  return (
    <div className={`rounded-lg border p-4 mb-6 ${
      isAtLimit 
        ? 'bg-red-50 border-red-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${
          isAtLimit ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {isAtLimit ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${
            isAtLimit ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {isAtLimit ? 'Límite de Plan Alcanzado' : 'Límite de Plan Cerca'}
          </h3>
          <div className="mt-2 text-sm">
            <div className={`space-y-1 ${
              isAtLimit ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-2" />
                <span>
                  Habitaciones: {currentStats.rooms} / {
                    selectedPlan.limits.maxRooms === -1 
                      ? '∞' 
                      : selectedPlan.limits.maxRooms
                  }
                  {/* {remainingRooms > 0 && ` (${remainingRooms} restantes)`} */}
                </span>
              </div>
              {/* <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  Usuarios: {currentStats.users} / {
                    selectedPlan.limits.maxUsers === -1 
                      ? '∞' 
                      : selectedPlan.limits.maxUsers
                  }
                  {remainingUsers > 0 && currentStats.users > 0 && ` (${remainingUsers} restantes)`}
                </span>
              </div> */}
            </div>
            
            {isAtLimit && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-red-700 flex-1 mr-4">
                  Has alcanzado el límite de tu plan actual. Para agregar más habitaciones o usuarios, 
                  necesitas actualizar tu plan.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue8 hover:bg-blue6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue8 flex-shrink-0"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Actualizar Plan
                </button>
              </div>
            )}
            
            {isNearLimit && !isAtLimit && (
              <div className="mt-3">
                <p className="text-sm text-yellow-700">
                  Te estás acercando al límite de tu plan. Considera actualizar para evitar interrupciones.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue1">Actualizar Plan</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAvailablePlans().map((planId) => {
                const planLimitsData = planLimits[planId];
                if (!planLimitsData) return null;
                
                const planName = getPlanName(planId);
                const upgradeCost = calculateUpgradeCost(planId);
                
                return (
                  <div key={planId} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors flex flex-col">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-blue1">{planName}</h3>
                      <div className="mt-2">
                        {planLimitsData.price === 0 ? (
                          <span className="text-lg font-semibold text-gray-600">Contactar</span>
                        ) : (
                          <span className="text-3xl font-bold text-blue1">
                            {formatCLP(planLimitsData.price)}
                          </span>
                        )}
                        <span className="text-gray-500 text-sm block">por {planLimitsData.period}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Bed className="h-4 w-4 mr-2 text-blue-600" />
                        <span>
                          {planLimitsData.maxRooms === -1 ? 'Habitaciones ilimitadas' : `Hasta ${planLimitsData.maxRooms} habitaciones`}
                        </span>
                      </div>
                    </div>
                    
                    <ul className="space-y-2 mb-4 flex-grow">
                      {planLimitsData.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Costo de upgrade */}
                    {upgradeCost.cost > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              {formatCLP(upgradeCost.cost)}
                            </p>
                            <p className="text-xs text-blue-600">
                              {upgradeCost.message}
                            </p>
                          </div>
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}
                    
                    {upgradeCost.cost === 0 && upgradeCost.message && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 text-center">
                          {upgradeCost.message}
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleUpgrade(planId)}
                      className="w-full bg-blue8 hover:bg-blue6 text-white py-2 px-4 rounded-lg font-medium transition-colors mt-auto"
                    >
                      Actualizar a {planName}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
