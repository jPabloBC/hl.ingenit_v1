"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle, Star, Calendar } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionStatusProps {
  showDetails?: boolean;
  onUpgrade?: () => void;
}

export default function SubscriptionStatus({ showDetails = false, onUpgrade }: SubscriptionStatusProps) {
  const { subscription, loading, getTrialStatus } = useSubscription();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!subscription) return;

    const updateTimeRemaining = () => {
      const trialStatus = getTrialStatus();
      if (trialStatus?.isTrial && !trialStatus.isExpired) {
        const endDate = new Date(trialStatus.endDate!);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setTimeRemaining(`${days} día${days > 1 ? 's' : ''} y ${hours}h`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes} minutos`);
          }
        } else {
          setTimeRemaining('Expirado');
        }
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [subscription, getTrialStatus]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Sin Suscripción</h3>
            <p className="text-xs text-yellow-700">Necesitas seleccionar un plan para usar el sistema</p>
          </div>
        </div>
      </div>
    );
  }

  const trialStatus = getTrialStatus();

  if (trialStatus?.isTrial) {
    if (trialStatus.isExpired) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Período de Prueba Expirado</h3>
                <p className="text-xs text-red-700">
                  Tu período de prueba de 14 días ha terminado. Actualiza tu plan para continuar.
                </p>
              </div>
            </div>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Star className="h-4 w-4 mr-2" />
                Actualizar Plan
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Período de Prueba - {subscription.plan_name}
              </h3>
              <p className="text-xs text-blue-700">
                {timeRemaining && timeRemaining !== 'Expirado' ? (
                  <>Tiempo restante: <span className="font-medium">{timeRemaining}</span></>
                ) : (
                  <>Días restantes: <span className="font-medium">{trialStatus.daysRemaining}</span></>
                )}
              </p>
              {showDetails && (
                <div className="mt-2 text-xs text-blue-600">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Expira: {new Date(trialStatus.endDate!).toLocaleDateString('es-CL')}
                  </div>
                </div>
              )}
            </div>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Star className="h-4 w-4 mr-2" />
              Actualizar Ahora
            </button>
          )}
        </div>
      </div>
    );
  }

  // Suscripción activa (no en período de prueba)
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-green-800">
            Suscripción Activa - {subscription.plan_name}
          </h3>
          <p className="text-xs text-green-700">
            Plan activo con acceso completo a todas las funcionalidades
          </p>
          {showDetails && subscription.next_billing_date && (
            <div className="mt-2 text-xs text-green-600">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Próximo pago: {new Date(subscription.next_billing_date).toLocaleDateString('es-CL')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
