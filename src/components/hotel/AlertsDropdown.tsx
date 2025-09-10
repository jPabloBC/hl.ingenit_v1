"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Alert {
  id: string;
  business_id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  reservation_id?: string;
  room_id?: string;
  due_date?: string;
  is_active: boolean;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  resolved_date?: string;
  days_overdue: number;
  primary_guest_name?: string;
  room_number?: string;
}

interface AlertsDropdownProps {
  businessId: string;
}

export default function AlertsDropdown({ businessId }: AlertsDropdownProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadAlerts();
    }
  }, [businessId]);

  const loadAlerts = async () => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check-out vencidos: reservas checked_in con check_out_date <= hoy (incluye hoy si pasó la hora)
      const { data: overdueCheckouts, error: error1 } = await supabase
        .from('hl_reservations')
        .select(`id, primary_guest_name, check_out_date, check_out_time, hl_rooms(room_number)`)
        .eq('business_id', businessId)
        .eq('status', 'checked_in')
        .lte('check_out_date', today);

      // Check-in vencidos: reservas confirmed con check_in_date <= hoy (incluye hoy si pasó la hora)
      const { data: overdueCheckins, error: error2 } = await supabase
        .from('hl_reservations')
        .select(`id, primary_guest_name, check_in_date, check_in_time, hl_rooms(room_number)`)
        .eq('business_id', businessId)
        .eq('status', 'confirmed')
        .lte('check_in_date', today);

      if (error1 || error2) {
        console.error('Error loading alerts:', error1 || error2);
        return;
      }

      console.log('=== DEBUG ALERTS ===');
      console.log('Today:', today);
      console.log('Overdue checkouts found:', overdueCheckouts?.length || 0, overdueCheckouts);
      console.log('Overdue checkins found:', overdueCheckins?.length || 0, overdueCheckins);
      console.log('🔍 Raw overdueCheckins data:', overdueCheckins?.map(r => ({ id: r.id, room: r.hl_rooms?.[0]?.room_number, guest: r.primary_guest_name })));

      const alerts: Alert[] = [];
      const processedRooms = new Set<string>();
      
      // Agregar check-outs vencidos (validar fecha Y hora)
      overdueCheckouts?.forEach((res: any) => {
        const checkoutDate = res.check_out_date;
        const checkoutTime = res.check_out_time || '11:00'; // Default 11:00
        const now = new Date();
        
        // Crear fecha/hora de checkout límite (fix time format)
        const timeFormatted = checkoutTime.substring(0, 5); // Remove seconds if present
        const checkoutDateTime = new Date(`${checkoutDate}T${timeFormatted}:00`);
        
        const roomNumber = res.hl_rooms?.[0]?.room_number;
        console.log(`Checkout ${roomNumber}: ${checkoutDate} ${checkoutTime} vs now ${now.toISOString()}`);
        console.log(`Checkout DateTime: ${checkoutDateTime.toISOString()}, Is overdue: ${now > checkoutDateTime}`);
        
        // Solo agregar si ya pasó la fecha/hora límite
        if (now > checkoutDateTime && roomNumber) {
          const roomKey = `checkout_${roomNumber}`;
          if (!processedRooms.has(roomKey)) {
            processedRooms.add(roomKey);
            console.log(`Adding checkout alert for room ${roomNumber}`);
            alerts.push({
              id: `checkout_${res.id}`,
              business_id: businessId,
              alert_type: 'overdue_checkout',
              title: `Check-out Vencido - Habitación ${roomNumber}`,
              message: `${res.primary_guest_name} - Check-out vencido desde las ${checkoutTime}`,
              severity: 'error',
              reservation_id: res.id,
              room_id: '',
              due_date: res.check_out_date,
              is_active: true,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              days_overdue: 1,
              primary_guest_name: res.primary_guest_name,
              room_number: roomNumber
            });
          }
        }
      });

      // Agregar check-ins vencidos (validar fecha Y hora)
      overdueCheckins?.forEach((res: any) => {
        const checkinDate = res.check_in_date;
        const checkinTime = res.check_in_time || '15:00'; // Default 15:00
        const now = new Date();
        
        // Crear fecha/hora de checkin límite (fix time format)
        const timeFormatted = checkinTime.substring(0, 5); // Remove seconds if present
        const checkinDateTime = new Date(`${checkinDate}T${timeFormatted}:00`);
        
        const roomNumber = res.hl_rooms?.[0]?.room_number;
        console.log(`Checkin ${roomNumber}: ${checkinDate} ${checkinTime} vs now ${now.toISOString()}`);
        console.log(`Checkin DateTime: ${checkinDateTime.toISOString()}, Is overdue: ${now > checkinDateTime}`);
        
        // Solo agregar si ya pasó la fecha/hora límite
        if (now > checkinDateTime && roomNumber) {
          const roomKey = `checkin_${roomNumber}`;
          console.log(`🔍 Processing room: ${roomKey}, already processed: ${processedRooms.has(roomKey)}`);
          if (!processedRooms.has(roomKey)) {
            processedRooms.add(roomKey);
            console.log(`Adding checkin alert for room ${roomNumber}`);
            alerts.push({
              id: `checkin_${res.id}`,
              business_id: businessId,
              alert_type: 'overdue_checkin',
              title: `Check-in Vencido - Habitación ${roomNumber}`,
              message: `${res.primary_guest_name} - Check-in vencido desde las ${checkinTime}`,
              severity: 'error',
              reservation_id: res.id,
              room_id: '',
              due_date: res.check_in_date,
              is_active: true,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              days_overdue: 1,
              primary_guest_name: res.primary_guest_name,
              room_number: roomNumber
            });
          }
        }
      });

      console.log('Final alerts count:', alerts.length, alerts);
      setAlerts(alerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateOverdueAlerts = async () => {
    // SIMPLIFIED - No database alerts, just visual alerts
    return;
  };


  const totalCount = alerts.length;
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;

  return (
    <Link href="/hotel/alerts" className="relative">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <div>
          <Bell className="h-4 w-4" />
        </div>
        <div className="hidden sm:flex sm:flex-col sm:items-start">
          <span className="text-sm font-medium">Alertas</span>
          {totalCount > 0 && (
            <span className="text-xs text-gray-500">
              {criticalCount > 0 ? `${criticalCount} crítica${criticalCount > 1 ? 's' : ''}` : `${totalCount} activa${totalCount > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </Button>

      {/* Badge for alerts - positioned on the button container */}
      {totalCount > 0 && (
        <span className={`absolute -top-3 -right-3 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center font-bold z-10 border-2 border-white shadow-lg bg-red-500 ${
          criticalCount > 0 ? 'animate-pulse' : ''
        }`}>
          {totalCount > 9 ? '9+' : totalCount}
        </span>
      )}
    </Link>
  );
}