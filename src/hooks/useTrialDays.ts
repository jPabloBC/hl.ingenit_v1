import { useState, useEffect } from 'react';
import { usePlanSelection } from './usePlanSelection';

export interface TrialInfo {
  isTrial: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  isExpired: boolean;
}

export function useTrialDays() {
  const { selectedPlan } = usePlanSelection();
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({
    isTrial: false,
    daysRemaining: 0,
    trialEndDate: null,
    isExpired: false
  });

  useEffect(() => {
    if (!selectedPlan) {
      setTrialInfo({
        isTrial: false,
        daysRemaining: 0,
        trialEndDate: null,
        isExpired: false
      });
      return;
    }

    // Verificar si es un plan de prueba (trial)
    const isTrial = selectedPlan.planId === 'trial' || selectedPlan.planName.toLowerCase().includes('prueba');
    
    if (!isTrial) {
      setTrialInfo({
        isTrial: false,
        daysRemaining: 0,
        trialEndDate: null,
        isExpired: false
      });
      return;
    }

    // Calcular días restantes de la prueba
    const trialStartDate = new Date(selectedPlan.selectedAt);
    const trialDuration = 14; // 14 días de prueba
    const trialEndDate = new Date(trialStartDate.getTime() + (trialDuration * 24 * 60 * 60 * 1000));
    const now = new Date();
    const timeDiff = trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isExpired = daysRemaining <= 0;

    setTrialInfo({
      isTrial: true,
      daysRemaining: Math.max(0, daysRemaining),
      trialEndDate,
      isExpired
    });
  }, [selectedPlan]);

  return trialInfo;
}