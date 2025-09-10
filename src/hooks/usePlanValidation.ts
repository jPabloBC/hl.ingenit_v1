import { useState, useEffect } from "react";
import { usePlanSelection } from "./usePlanSelection";
import { supabase } from "@/lib/supabase";

export interface PlanValidationResult {
  canAddRooms: boolean;
  canAddUsers: boolean;
  remainingRooms: number;
  remainingUsers: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
  currentStats: {
    rooms: number;
    users: number;
  };
}

export function usePlanValidation(businessId: string | null) {
  const { selectedPlan, canAddRooms, canAddUsers, getRemainingRooms, getRemainingUsers } = usePlanSelection();
  const [validation, setValidation] = useState<PlanValidationResult>({
    canAddRooms: true,
    canAddUsers: true,
    remainingRooms: -1,
    remainingUsers: -1,
    isAtLimit: false,
    isNearLimit: false,
    currentStats: {
      rooms: 0,
      users: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId && selectedPlan) {
      loadCurrentStats();
    } else {
      setLoading(false);
    }
  }, [businessId, selectedPlan]);

  const loadCurrentStats = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      
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

      const currentStats = {
        rooms: roomsResult.count || 0,
        users: usersResult.count || 0
      };

      const remainingRooms = getRemainingRooms(currentStats.rooms);
      const remainingUsers = getRemainingUsers(currentStats.users);
      const canAddRoomsResult = canAddRooms(currentStats.rooms);
      const canAddUsersResult = canAddUsers(currentStats.users);
      
      const isAtLimit = !canAddRoomsResult || !canAddUsersResult;
      const isNearLimit = remainingRooms <= 2 || remainingUsers <= 1;

      setValidation({
        canAddRooms: canAddRoomsResult,
        canAddUsers: canAddUsersResult,
        remainingRooms,
        remainingUsers,
        isAtLimit,
        isNearLimit,
        currentStats
      });

    } catch (error) {
      console.error('Error loading current stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeAdd = (type: 'room' | 'user'): { allowed: boolean; message?: string } => {
    if (!selectedPlan) {
      return { allowed: false, message: 'No se ha seleccionado un plan' };
    }

    if (type === 'room') {
      if (!validation.canAddRooms) {
        return { 
          allowed: false, 
          message: `Has alcanzado el límite de habitaciones de tu plan (${selectedPlan.limits.maxRooms}). Actualiza tu plan para agregar más habitaciones.` 
        };
      }
    } else if (type === 'user') {
      if (!validation.canAddUsers) {
        return { 
          allowed: false, 
          message: `Has alcanzado el límite de usuarios de tu plan (${selectedPlan.limits.maxUsers}). Actualiza tu plan para agregar más usuarios.` 
        };
      }
    }

    return { allowed: true };
  };

  const refreshStats = () => {
    loadCurrentStats();
  };

  return {
    validation,
    loading,
    validateBeforeAdd,
    refreshStats,
    selectedPlan
  };
}
