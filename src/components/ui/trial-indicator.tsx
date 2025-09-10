"use client";

import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";

export default function TrialIndicator() {
  const { isTrial, daysRemaining, hoursRemaining, minutesRemaining, isExpired, urgencyLevel } = useTrialStatus();

  if (!isTrial) {
    return null;
  }

  const getIndicatorColor = () => {
    switch (urgencyLevel) {
      case 'expired': return "bg-red-500";
      case 'critical': return "bg-red-400";
      case 'warning': return "bg-orange-500";
      case 'normal': return "bg-blue-500";
      default: return "bg-blue-500";
    }
  };

  const getTextColor = () => {
    switch (urgencyLevel) {
      case 'expired': return "text-red-700";
      case 'critical': return "text-red-700";
      case 'warning': return "text-orange-700";
      case 'normal': return "text-blue-700";
      default: return "text-blue-700";
    }
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
          : daysRemaining > 0 
            ? `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} y ${hoursRemaining}h`
            : `${hoursRemaining}h ${minutesRemaining}m`
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