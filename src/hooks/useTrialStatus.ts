"use client";

import { useState, useEffect } from "react";
import { useSubscription } from "./useSubscription";

export interface TrialStatus {
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  canAccess: boolean;
  urgencyLevel: 'normal' | 'warning' | 'critical' | 'expired';
}

export function useTrialStatus(): TrialStatus {
  const { subscription, loading } = useSubscription();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isTrial: false,
    isExpired: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    canAccess: true,
    urgencyLevel: 'normal'
  });

  useEffect(() => {
    if (!subscription || loading) return;

    const updateTrialStatus = () => {
      const now = new Date();
      const trialEnd = subscription.trial_end_date ? new Date(subscription.trial_end_date) : new Date();
      const diff = trialEnd.getTime() - now.getTime();

      const isTrial = subscription.status === 'trial';
      const isExpired = isTrial && diff <= 0;
      
      const daysRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      const hoursRemaining = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      const minutesRemaining = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

      let urgencyLevel: 'normal' | 'warning' | 'critical' | 'expired' = 'normal';
      let canAccess = true;

      if (isExpired) {
        urgencyLevel = 'expired';
        canAccess = false;
      } else if (daysRemaining <= 1) {
        urgencyLevel = 'critical';
      } else if (daysRemaining <= 3) {
        urgencyLevel = 'warning';
      }

      console.log('🕐 Trial Status Update:', {
        now: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        daysRemaining,
        hoursRemaining,
        minutesRemaining,
        urgencyLevel,
        isExpired
      });

      setTrialStatus({
        isTrial,
        isExpired,
        daysRemaining,
        hoursRemaining,
        minutesRemaining,
        canAccess,
        urgencyLevel
      });
    };

    // Actualizar inmediatamente
    updateTrialStatus();

    // Actualizar cada 10 segundos para pruebas (cambiar a 60000 para producción)
    const interval = setInterval(updateTrialStatus, 10000);

    return () => clearInterval(interval);
  }, [subscription, loading]);

  return trialStatus;
}
