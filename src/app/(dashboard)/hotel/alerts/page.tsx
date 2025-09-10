"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HotelLayout from '@/components/layout/hotel-layout';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  User,
  CheckCircle,
  X,
  ArrowRight,
  Calendar,
  RefreshCw,
  Zap,
  Shield,
  Info
} from 'lucide-react';
import Link from 'next/link';

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

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string>('');

  useEffect(() => {
    loadBusinessAndAlerts();
  }, []);

  const loadBusinessAndAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) return;
      
      setBusinessId(businessData.id);
      await loadAlerts(businessData.id);
    } catch (error) {
      console.error('Error loading business:', error);
    }
  };

  const loadAlerts = async (businessId: string) => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check-out vencidos
      const { data: overdueCheckouts, error: error1 } = await supabase
        .from('hl_reservations')
        .select(`id, primary_guest_name, check_out_date, check_out_time, hl_rooms(room_number)`)
        .eq('business_id', businessId)
        .eq('status', 'checked_in')
        .lte('check_out_date', today);

      // Check-in vencidos
      const { data: overdueCheckins, error: error2 } = await supabase
        .from('hl_reservations')
        .select(`id, primary_guest_name, check_in_date, check_in_time, hl_rooms(room_number)`)
        .eq('business_id', businessId)
        .eq('status', 'confirmed')
        .lte('check_in_date', today);

      console.log('🔍 DEBUG - overdueCheckouts:', overdueCheckouts);
      console.log('🔍 DEBUG - overdueCheckins:', overdueCheckins);

      if (error1 || error2) {
        console.error('Error loading alerts:', error1 || error2);
        return;
      }

      const alerts: Alert[] = [];
      const processedReservations = new Set<string>();
      
      // Agregar check-outs vencidos
      overdueCheckouts?.forEach((res: any) => {
        const checkoutDate = res.check_out_date;
        const checkoutTime = res.check_out_time || '11:00';
        const now = new Date();
        
        const timeFormatted = checkoutTime.substring(0, 5);
        const checkoutDateTime = new Date(`${checkoutDate}T${timeFormatted}:00`);
        
        if (now > checkoutDateTime) {
          const reservationKey = `checkout_${res.id}`;
          // Verificar si ya procesamos esta reservación
          if (!processedReservations.has(reservationKey)) {
            processedReservations.add(reservationKey);
            const hoursOverdue = Math.floor((now.getTime() - checkoutDateTime.getTime()) / (1000 * 60 * 60));
            alerts.push({
              id: reservationKey,
              business_id: businessId,
              alert_type: 'overdue_checkout',
              title: `Check-out Vencido - Habitación ${res.hl_rooms.room_number}`,
              message: `${res.primary_guest_name} - Check-out vencido desde las ${timeFormatted}`,
              severity: hoursOverdue > 24 ? 'critical' : 'error',
              reservation_id: res.id,
              room_id: '',
              due_date: res.check_out_date,
              is_active: true,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              days_overdue: Math.floor(hoursOverdue / 24),
              primary_guest_name: res.primary_guest_name,
              room_number: res.hl_rooms.room_number
            });
          }
        }
      });

      // Agregar check-ins vencidos
      overdueCheckins?.forEach((res: any) => {
        const checkinDate = res.check_in_date;
        const checkinTime = res.check_in_time || '15:00';
        const now = new Date();
        
        const timeFormatted = checkinTime.substring(0, 5);
        const checkinDateTime = new Date(`${checkinDate}T${timeFormatted}:00`);
        
        if (now > checkinDateTime) {
          const reservationKey = `checkin_${res.id}`;
          // Verificar si ya procesamos esta reservación
          if (!processedReservations.has(reservationKey)) {
            processedReservations.add(reservationKey);
            const hoursOverdue = Math.floor((now.getTime() - checkinDateTime.getTime()) / (1000 * 60 * 60));
            alerts.push({
              id: reservationKey,
              business_id: businessId,
              alert_type: 'overdue_checkin',
              title: `Check-in Vencido - Habitación ${res.hl_rooms.room_number}`,
              message: `${res.primary_guest_name} - Check-in vencido desde las ${timeFormatted}`,
              severity: hoursOverdue > 24 ? 'critical' : 'error',
              reservation_id: res.id,
              room_id: '',
              due_date: res.check_in_date,
              is_active: true,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              days_overdue: Math.floor(hoursOverdue / 24),
              primary_guest_name: res.primary_guest_name,
              room_number: res.hl_rooms.room_number
            });
          }
        }
      });

      console.log('🔍 DEBUG - Total alerts created:', alerts.length);
      console.log('🔍 DEBUG - Processed reservations:', Array.from(processedReservations));
      console.log('🔍 DEBUG - Final alerts:', alerts.map(a => ({ id: a.id, reservation_id: a.reservation_id, room: a.room_number })));

      const uniqueAlerts = alerts;

      setAlerts(uniqueAlerts);
      if (uniqueAlerts.length > 0 && !selectedAlert) {
        setSelectedAlert(uniqueAlerts[0]);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, is_read: true } : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'error':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getActionLink = (alert: Alert) => {
    switch (alert.alert_type) {
      case 'overdue_checkout':
        return '/hotel/front-desk';
      case 'overdue_checkin':
        return '/hotel/front-desk';
      default:
        return '/hotel';
    }
  };

  const getActionText = (alert: Alert) => {
    switch (alert.alert_type) {
      case 'overdue_checkout':
        return 'Ir a Front Desk para Check-out';
      case 'overdue_checkin':
        return 'Ir a Front Desk para Check-in';
      default:
        return 'Ver Detalles';
    }
  };

  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;
  const unreadCount = alerts.filter(alert => !alert.is_read).length;

  return (
    
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="p-6">
          {/* Header mejorado */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Alertas del Sistema
                  </h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-gray-600">
                      {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} activa{alerts.length !== 1 ? 's' : ''}
                    </p>
                    {criticalCount > 0 && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {alerts.length === 0 && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm font-medium">Todo en orden</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => loadAlerts(businessId)}
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>
            </div>
          </div>

          {/* Content mejorado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Alertas mejorada */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Lista de Alertas</span>
                    </h2>
                    {alerts.length > 0 && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {alerts.length}
                      </div>
                    )}
                  </div>
                  {criticalCount > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{criticalCount} alerta{criticalCount !== 1 ? 's' : ''} crítica{criticalCount !== 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  )}
                </div>
            
                <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-4 font-medium">Cargando alertas...</p>
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">¡Excelente!</h3>
                      <p className="text-gray-600 leading-relaxed">
                        No hay alertas activas.<br />
                        Todo está funcionando correctamente.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            setSelectedAlert(alert);
                            if (!alert.is_read) markAsRead(alert.id);
                          }}
                          className={`p-5 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                            selectedAlert?.id === alert.id 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 shadow-sm' 
                              : ''
                          } ${!alert.is_read ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : ''}`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              {getSeverityIcon(alert.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-bold text-gray-900 leading-tight">
                                  {alert.title}
                                </h4>
                                {!alert.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                {alert.message}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                                  {alert.severity === 'critical' ? 'Crítico' :
                                   alert.severity === 'error' ? 'Error' :
                                   alert.severity === 'warning' ? 'Advertencia' : 'Info'}
                                </span>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>Hab. {alert.room_number}</span>
                                </div>
                              </div>
                              {alert.reservation_id && (
                                <div className="mt-2 text-xs text-gray-400 font-mono">
                                  ID: {alert.reservation_id.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Detalle de Alerta mejorado */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                {selectedAlert ? (
                  <div className="h-full flex flex-col">
                    <div className={`p-8 border-b border-gray-100 ${getSeverityColor(selectedAlert.severity)} bg-gradient-to-r`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            {getSeverityIcon(selectedAlert.severity)}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedAlert.title}</h2>
                            <p className="text-gray-700 leading-relaxed">{selectedAlert.message}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-4 py-2 text-sm rounded-full font-bold shadow-sm ${getSeverityColor(selectedAlert.severity)} ring-2 ring-white/50`}>
                            {selectedAlert.severity === 'critical' ? '🔥 Crítico' :
                             selectedAlert.severity === 'error' ? '⚠️ Error' :
                             selectedAlert.severity === 'warning' ? '⚡ Advertencia' : 'ℹ️ Info'}
                          </span>
                          <div className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                            Alerta ID: {selectedAlert.id.slice(-8)}
                          </div>
                          {selectedAlert.reservation_id && (
                            <div className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded font-mono">
                              Reserva ID: {selectedAlert.reservation_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Información de la Alerta mejorada */}
                        <div className="space-y-6">
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Info className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Información</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                              <label className="text-sm font-bold text-blue-700 uppercase tracking-wide">Habitación</label>
                              <p className="text-2xl font-bold text-blue-800 mt-1">
                                {selectedAlert.room_number}
                              </p>
                            </div>
                            
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                              <label className="text-sm font-bold text-purple-700 uppercase tracking-wide">Huésped</label>
                              <p className="text-lg font-bold text-purple-800 mt-1">{selectedAlert.primary_guest_name}</p>
                            </div>
                            
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                              <label className="text-sm font-bold text-green-700 uppercase tracking-wide">Fecha Límite</label>
                              <p className="text-lg font-bold text-green-800 mt-1 flex items-center space-x-2">
                                <Calendar className="h-5 w-5" />
                                <span>{selectedAlert.due_date}</span>
                              </p>
                            </div>
                            
                            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                              <label className="text-sm font-bold text-red-700 uppercase tracking-wide">Tiempo Vencido</label>
                              <p className="text-lg font-bold text-red-800 mt-1 flex items-center space-x-2">
                                <Clock className="h-5 w-5" />
                                <span>
                                  {selectedAlert.days_overdue > 0 
                                    ? `${selectedAlert.days_overdue} día${selectedAlert.days_overdue !== 1 ? 's' : ''}`
                                    : 'Menos de 1 día'
                                  }
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Acciones mejoradas */}
                        <div className="space-y-6">
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Zap className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Acciones</h3>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 shadow-sm">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <h4 className="text-lg font-bold text-blue-900">Acción Recomendada</h4>
                              </div>
                              <p className="text-blue-700 mb-4 leading-relaxed">
                                {selectedAlert.alert_type === 'overdue_checkout' 
                                  ? 'Contactar al huésped inmediatamente y procesar el check-out. Es importante resolver esta situación para liberar la habitación.'
                                  : 'Contactar al huésped para confirmar su llegada o gestionar la reserva. Puede ser necesario cancelar o reprogramar.'
                                }
                              </p>
                              <Link href={getActionLink(selectedAlert)}>
                                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white font-bold py-3 rounded-xl">
                                  <div className="flex items-center justify-center space-x-3">
                                    <User className="h-5 w-5" />
                                    <span>{getActionText(selectedAlert)}</span>
                                    <ArrowRight className="h-5 w-5" />
                                  </div>
                                </Button>
                              </Link>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200">
                              <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-500 rounded-lg flex items-center justify-center">
                                  <ArrowRight className="h-4 w-4 text-white" />
                                </div>
                                <span>Enlaces Rápidos</span>
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                <Link 
                                  href="/hotel/reservations" 
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                                >
                                  <Calendar className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                  <span className="font-medium text-gray-700 group-hover:text-blue-700">Ver todas las reservas</span>
                                </Link>
                                <Link 
                                  href="/hotel/front-desk" 
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                                >
                                  <User className="h-5 w-5 text-gray-500 group-hover:text-green-600" />
                                  <span className="font-medium text-gray-700 group-hover:text-green-700">Ir a Front Desk</span>
                                </Link>
                                <Link 
                                  href="/hotel/sales" 
                                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                                >
                                  <Bell className="h-5 w-5 text-gray-500 group-hover:text-purple-600" />
                                  <span className="font-medium text-gray-700 group-hover:text-purple-700">Nueva reserva</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Bell className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Selecciona una alerta
                      </h3>
                      <p className="text-gray-600 leading-relaxed max-w-sm">
                        Elige una alerta de la lista de la izquierda para ver los detalles completos y las acciones disponibles.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}