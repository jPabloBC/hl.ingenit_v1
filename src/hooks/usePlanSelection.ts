import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export interface PlanLimits {
  maxRooms: number;
  maxUsers: number;
  features: string[];
  price: number;
  currency: string;
  period: string;
}

export interface PlanSelection {
  planId: string;
  planName: string;
  limits: PlanLimits;
  selectedAt: string;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  trial: {
    maxRooms: 5,
    maxUsers: 1,
    features: [
      'Prueba gratuita 14 días',
      'Hasta 5 habitaciones',
      'Gestión básica de reservas',
      'Check-in y check-out digital',
      'Soporte técnico'
    ],
    price: 0, // Gratis
    currency: 'CLP',
    period: '14 días'
  },
  starter: {
    maxRooms: 20,
    maxUsers: 3,
    features: [
      'Gestión completa de reservas',
      'Check-in y check-out digital',
      'Gestión de huéspedes',
      'Reportes y estadísticas',
      'Integración SII (Chile)',
      'Soporte técnico'
    ],
    price: 9990, // CLP
    currency: 'CLP',
    period: 'mes'
  },
  professional: {
    maxRooms: 50,
    maxUsers: 10,
    features: [
      'Channel Manager integrado',
      'Multi-usuario avanzado',
      'Reportes ejecutivos',
      'Housekeeping avanzado',
      'API para integraciones',
      'Soporte prioritario 24/7'
    ],
    price: 19990, // CLP
    currency: 'CLP',
    period: 'mes'
  },
  business: {
    maxRooms: 80,
    maxUsers: 20,
    features: [
      'Channel Manager integrado',
      'Multi-usuario avanzado',
      'Reportes ejecutivos',
      'Housekeeping avanzado',
      'API para integraciones',
      'Soporte prioritario 24/7',
      'Integraciones avanzadas',
      'Yield Management básico'
    ],
    price: 29990, // CLP
    currency: 'CLP',
    period: 'mes'
  },
  enterprise: {
    maxRooms: -1, // Ilimitado
    maxUsers: -1, // Ilimitado
    features: [
      'Solución personalizada',
      'Multi-propiedad',
      'Integraciones avanzadas',
      'Yield Management',
      'Gerente de cuenta dedicado',
      'Migración de datos incluida'
    ],
    price: 0, // Contactar
    currency: 'CLP',
    period: 'contactar'
  }
};

export function usePlanSelection() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanSelection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener plan desde URL params
    const planId = searchParams.get('plan');
    
    if (planId && PLAN_LIMITS[planId]) {
      const limits = PLAN_LIMITS[planId];
      const planSelection: PlanSelection = {
        planId,
        planName: getPlanName(planId),
        limits,
        selectedAt: new Date().toISOString()
      };
      
      setSelectedPlan(planSelection);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('selected_plan', JSON.stringify(planSelection));
    } else {
      // Intentar cargar desde localStorage
      const savedPlan = localStorage.getItem('selected_plan');
      if (savedPlan) {
        try {
          const parsedPlan = JSON.parse(savedPlan);
          setSelectedPlan(parsedPlan);
        } catch (error) {
          console.error('Error parsing saved plan:', error);
          localStorage.removeItem('selected_plan');
        }
      }
    }
    
    setLoading(false);
  }, [searchParams]);

  const selectPlan = (planId: string) => {
    if (PLAN_LIMITS[planId]) {
      const limits = PLAN_LIMITS[planId];
      const planSelection: PlanSelection = {
        planId,
        planName: getPlanName(planId),
        limits,
        selectedAt: new Date().toISOString()
      };
      
      setSelectedPlan(planSelection);
      localStorage.setItem('selected_plan', JSON.stringify(planSelection));
    }
  };

  const clearPlanSelection = () => {
    setSelectedPlan(null);
    localStorage.removeItem('selected_plan');
  };

  const canAddRooms = (currentRoomCount: number): boolean => {
    if (!selectedPlan) return false;
    if (selectedPlan.limits.maxRooms === -1) return true; // Ilimitado
    return currentRoomCount < selectedPlan.limits.maxRooms;
  };

  const canAddUsers = (currentUserCount: number): boolean => {
    if (!selectedPlan) return false;
    if (selectedPlan.limits.maxUsers === -1) return true; // Ilimitado
    return currentUserCount < selectedPlan.limits.maxUsers;
  };

  const getRemainingRooms = (currentRoomCount: number): number => {
    if (!selectedPlan) return 0;
    if (selectedPlan.limits.maxRooms === -1) return -1; // Ilimitado
    return Math.max(0, selectedPlan.limits.maxRooms - currentRoomCount);
  };

  const getRemainingUsers = (currentUserCount: number): number => {
    if (!selectedPlan) return 0;
    if (selectedPlan.limits.maxUsers === -1) return -1; // Ilimitado
    return Math.max(0, selectedPlan.limits.maxUsers - currentUserCount);
  };

  return {
    selectedPlan,
    loading,
    selectPlan,
    clearPlanSelection,
    canAddRooms,
    canAddUsers,
    getRemainingRooms,
    getRemainingUsers,
    planLimits: PLAN_LIMITS
  };
}


function getPlanName(planId: string): string {
  const names: Record<string, string> = {
    trial: 'Prueba Gratuita',
    starter: 'Hoteles Pequeños',
    professional: 'Hoteles Medianos',
    business: 'Hoteles Grandes',
    enterprise: 'Hoteles Enterprise'
  };
  return names[planId] || planId;
}
