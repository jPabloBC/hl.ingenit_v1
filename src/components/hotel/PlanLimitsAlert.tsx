"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Star, Users, Bed, AlertTriangle } from "lucide-react";
import { usePlanSelection } from "@/hooks/usePlanSelection";
import { supabase } from "@/lib/supabase";

interface PlanLimitsAlertProps {
  businessId: string;
  onUpgrade?: () => void;
}

export default function PlanLimitsAlert({ businessId, onUpgrade }: PlanLimitsAlertProps) {
  const { selectedPlan, canAddRooms, canAddUsers, getRemainingRooms, getRemainingUsers } = usePlanSelection();
  const [currentStats, setCurrentStats] = useState({
    rooms: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

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
                  {remainingRooms > 0 && ` (${remainingRooms} restantes)`}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  Usuarios: {currentStats.users} / {
                    selectedPlan.limits.maxUsers === -1 
                      ? '∞' 
                      : selectedPlan.limits.maxUsers
                  }
                  {remainingUsers > 0 && ` (${remainingUsers} restantes)`}
                </span>
              </div>
            </div>
            
            {isAtLimit && (
              <div className="mt-3">
                <p className="text-sm text-red-700 mb-2">
                  Has alcanzado el límite de tu plan actual. Para agregar más habitaciones o usuarios, 
                  necesitas actualizar tu plan.
                </p>
                {onUpgrade && (
                  <button
                    onClick={onUpgrade}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue8 hover:bg-blue6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue8"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Actualizar Plan
                  </button>
                )}
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
    </div>
  );
}
