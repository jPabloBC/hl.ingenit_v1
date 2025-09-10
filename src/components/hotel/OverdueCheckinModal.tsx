'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, X, CheckCircle, AlertTriangle, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OverdueCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  onSuccess: () => void;
}

export function OverdueCheckinModal({ isOpen, onClose, reservation, onSuccess }: OverdueCheckinModalProps) {
  const [actionType, setActionType] = useState<'no_show' | 'late_arrival' | 'cancelled'>('no_show');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('record_overdue_checkin_note', {
        p_reservation_id: reservation.id,
        p_note: note,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error recording overdue checkin note:', error);
        alert(`Error: ${error.message}`);
        return;
      }

      if (data?.success) {
        alert(data.message);
        onSuccess();
        onClose();
      } else {
        alert(`Error: ${data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error procesando la acción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysOverdue = () => {
    const checkInDate = new Date(reservation.check_in_date);
    const today = new Date();
    const diffTime = today.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysOverdue = getDaysOverdue();

  if (!reservation) return null;

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
            <p className="font-medium">{reservation.primary_guest_name}</p>
            <p className="text-sm text-gray-600">
              Habitación {reservation.room_number} - {reservation.check_in_date}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Reserva: {reservation.check_in_date} al {reservation.check_out_date}
            </p>
          </div>

          {/* Selección de acción */}
          <div className="space-y-3">
            <Label>¿Qué acción deseas realizar?</Label>
            <RadioGroup value={actionType} onValueChange={(value: string) => setActionType(value as 'no_show' | 'late_arrival' | 'cancelled')}>
              <RadioGroupItem value="no_show" id="no_show">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-500" />
                  No se presentó
                </div>
              </RadioGroupItem>
              <RadioGroupItem value="late_arrival" id="late_arrival">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Confirmar llegada tardía
                </div>
              </RadioGroupItem>
              <RadioGroupItem value="cancelled" id="cancelled">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  Cancelar reserva
                </div>
              </RadioGroupItem>
            </RadioGroup>
          </div>

          {/* Campo de nota */}
          <div className="space-y-2">
            <Label htmlFor="note">
              {actionType === 'no_show' ? 'Motivo de no presentación' : 
               actionType === 'late_arrival' ? 'Nota de llegada tardía' : 
               'Motivo de cancelación'}
            </Label>
            <Textarea
              id="note"
              placeholder={
                actionType === 'no_show' 
                  ? 'Ej: Cliente no se presentó, sin comunicación, no respondió llamadas...'
                  : actionType === 'late_arrival'
                  ? 'Ej: Cliente confirmó llegada para mañana, problemas de transporte...'
                  : 'Ej: Cliente canceló por motivos personales, sin reembolso...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
              disabled={!note.trim() || isSubmitting}
              className={
                actionType === 'no_show' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : actionType === 'late_arrival'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }
            >
              {isSubmitting ? 'Procesando...' : 
                actionType === 'no_show' ? 'Registrar No Presentó' :
                actionType === 'late_arrival' ? 'Confirmar Llegada' : 
                'Cancelar Reserva'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}