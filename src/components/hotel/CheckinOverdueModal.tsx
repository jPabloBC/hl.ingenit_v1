'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CheckinOverdueModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: any;
  onAction: (action: 'late_arrival' | 'cancelled', reason: string) => void;
}

export function CheckinOverdueModal({ isOpen, onClose, alert, onAction }: CheckinOverdueModalProps) {
  const [actionType, setActionType] = useState<'late_arrival' | 'cancelled'>('late_arrival');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAction(actionType, reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysOverdue = () => {
    if (!alert) return 0;
    const checkInDate = new Date(alert.due_date || new Date());
    const today = new Date();
    const diffTime = today.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysOverdue = getDaysOverdue();

  // No renderizar si no hay alerta
  if (!alert) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Check-in Vencido
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Información de la reserva */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>Vencido hace {daysOverdue} día{daysOverdue !== 1 ? 's' : ''}</span>
            </div>
            <p className="font-medium">{alert.message?.split('El huésped ')[1]?.split(' no realizó')[0] || 'Huésped'}</p>
            <p className="text-sm text-gray-600">
              Habitación {alert.message?.split('habitación ')[1]?.split(' el')[0] || 'N/A'}
            </p>
          </div>

          {/* Selección de acción */}
          <div className="space-y-3">
            <Label>¿Qué acción deseas realizar?</Label>
            <RadioGroup value={actionType} onValueChange={(value: 'late_arrival' | 'cancelled') => setActionType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="late_arrival" id="late_arrival" />
                <Label htmlFor="late_arrival" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Confirmar llegada tardía
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cancelled" id="cancelled" />
                <Label htmlFor="cancelled" className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  Cancelar reserva
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campo de nota/motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {actionType === 'late_arrival' ? 'Nota de llegada tardía' : 'Motivo de cancelación'}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                actionType === 'late_arrival' 
                  ? 'Ej: Cliente confirmó llegada para mañana...'
                  : 'Ej: Cliente no se presentó, sin comunicación...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!reason.trim() || isSubmitting}
              className={
                actionType === 'late_arrival' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isSubmitting ? 'Procesando...' : 
                actionType === 'late_arrival' ? 'Confirmar Llegada' : 'Cancelar Reserva'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}