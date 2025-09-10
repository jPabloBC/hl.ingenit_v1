"use client";

import { useTrialDays } from "@/hooks/useTrialDays";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";

export default function TrialIndicator() {
  const { isTrial, daysRemaining, isExpired } = useTrialDays();

  if (!isTrial) {
    return null;
  }

  const getIndicatorColor = () => {
    if (isExpired) return "bg-red-500";
    if (daysRemaining <= 3) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getTextColor = () => {
    if (isExpired) return "text-red-700";
    if (daysRemaining <= 3) return "text-yellow-700";
    return "text-blue-700";
  };

  const getIcon = () => {
    if (isExpired) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getIndicatorColor()} bg-opacity-10 border ${getIndicatorColor().replace('bg-', 'border-')} border-opacity-30`}>
      {getIcon()}
      <span className={`text-sm font-medium ${getTextColor()}`}>
        {isExpired 
          ? "Prueba expirada" 
          : `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
        }
      </span>
      {!isExpired && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/pricing', '_blank')}
          className={`ml-2 text-xs ${getTextColor()} border-current hover:bg-opacity-20`}
        >
          Actualizar
        </Button>
      )}
    </div>
  );
}