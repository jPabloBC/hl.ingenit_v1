"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  EyeOff,
  RefreshCw,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  reservation_id?: string;
  room_id?: string;
  guest_id?: string;
  is_read: boolean;
  alert_date: string;
  due_date?: string;
  days_overdue: number;
}

interface AlertsPanelProps {
  businessId: string;
  showAll?: boolean;
  maxAlerts?: number;
}

export default function AlertsPanel({ businessId, showAll = false, maxAlerts = 5 }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [businessId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      console.log('Loading alerts for business:', businessId);
      
      // Comentado para evitar regeneración automática
      // await regenerateOverdueAlerts();
      
      const { data, error } = await supabase
        .rpc('get_active_alerts', { p_business_id: businessId });

      console.log('Alerts response:', { data, error });

      if (error) {
        console.error('Error loading alerts:', error);
        return;
      }

      console.log('Setting alerts:', data);
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateOverdueAlerts = async () => {
    try {
      console.log('=== REGENERATING OVERDUE ALERTS (AlertsPanel) ===');
      
      // Create overdue checkout alerts for any checked-in reservations that are overdue
      const { data: overdueReservations, error: overdueError } = await supabase
        .from('hl_reservations')
        .select(`
          id,
          room_id,
          primary_guest_name,
          check_out_date,
          hl_rooms!inner(room_number)
        `)
        .eq('business_id', businessId)
        .eq('status', 'checked_in')
        .lt('check_out_date', new Date().toISOString().split('T')[0]);

      if (overdueError) {
        console.error('Error fetching overdue reservations:', overdueError);
        return;
      }

      console.log('Overdue reservations found (AlertsPanel):', overdueReservations);

      // For each overdue reservation, ensure alert exists and is active
      for (const reservation of overdueReservations || []) {
        const { data: existingAlert, error: alertCheckError } = await supabase
          .from('hl_system_alerts')
          .select('id')
          .eq('business_id', businessId)
          .eq('alert_type', 'overdue_checkout')
          .eq('reservation_id', reservation.id)
          .eq('is_active', true)
          .single();

        if (alertCheckError && alertCheckError.code !== 'PGRST116') {
          console.error('Error checking existing alert:', alertCheckError);
          continue;
        }

        if (!existingAlert) {
          // Create new alert
          const { error: createError } = await supabase
            .from('hl_system_alerts')
            .insert({
              business_id: businessId,
              alert_type: 'overdue_checkout',
              title: 'Check-out Vencido',
              message: `El huésped ${reservation.primary_guest_name} no realizó check-out en la habitación ${reservation.hl_rooms?.[0]?.room_number || 'N/A'} el ${reservation.check_out_date}`,
              severity: 'warning',
              reservation_id: reservation.id,
              room_id: reservation.room_id,
              is_active: true,
              is_read: false,
              is_resolved: false,
              alert_date: new Date().toISOString(),
              due_date: reservation.check_out_date
            });

          if (createError) {
            console.error('Error creating overdue checkout alert:', createError);
          }
        }
      }
    } catch (error) {
      console.error('Error regenerating overdue alerts:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('hl_system_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) {
        console.error('Error marking alert as read:', error);
        return;
      }

      // Actualizar estado local
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('hl_system_alerts')
        .update({ 
          is_resolved: true, 
          resolved_date: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        console.error('Error resolving alert:', error);
        return;
      }

      // Remover de la lista
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'error':
        return 'border-orange-200 bg-orange-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-800';
      case 'error':
        return 'text-orange-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const filteredAlerts = showAll ? alerts : alerts.slice(0, maxAlerts);
  const hasUnreadAlerts = alerts.some(alert => !alert.is_read);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando alertas...</span>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center py-6">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin alertas</h3>
          <p className="text-gray-600">No hay alertas pendientes en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Alertas del Sistema
            {hasUnreadAlerts && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {alerts.filter(a => !a.is_read).length} sin leer
              </span>
            )}
            {criticalAlerts.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {criticalAlerts.length} críticas
              </span>
            )}
          </h3>
        </div>
        <Button
          onClick={() => {
            setRefreshing(true);
            loadAlerts().finally(() => setRefreshing(false));
          }}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-200">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 border-l-4 ${getSeverityColor(alert.severity)} ${
              !alert.is_read ? 'border-l-4' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`text-sm font-medium ${getSeverityTextColor(alert.severity)}`}>
                      {alert.title}
                    </h4>
                    {!alert.is_read && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Nuevo
                      </span>
                    )}
                    {alert.days_overdue > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {alert.days_overdue} días
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${getSeverityTextColor(alert.severity)} opacity-90`}>
                    {alert.message}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>
                      {new Date(alert.alert_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {alert.due_date && (
                      <span>
                        Vencimiento: {new Date(alert.due_date).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                  {alert.alert_type === 'overdue_checkout' && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ Esta alerta permanecerá activa hasta que se haga el check-out. Haz clic en 👤 para ir al Front Desk.
                    </div>
                  )}
                  {alert.alert_type === 'overdue_checkin' && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ Esta alerta permanecerá activa hasta que se gestione el check-in vencido. Haz clic en ⏰ para ir al Front Desk.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {!alert.is_read && (
                  <Button
                    onClick={() => markAsRead(alert.id)}
                    variant="ghost"
                    size="sm"
                    title="Marcar como leída"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {alert.alert_type === 'overdue_checkout' ? (
                  <Link
                    href="/hotel/front-desk"
                    className="inline-flex items-center justify-center p-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Ir a Front Desk para hacer check-out"
                  >
                    <User className="h-4 w-4" />
                  </Link>
                ) : alert.alert_type === 'overdue_checkin' ? (
                  <Link
                    href="/hotel/front-desk"
                    className="inline-flex items-center justify-center p-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    title="Ir a Front Desk para gestionar check-in vencido"
                  >
                    <Clock className="h-4 w-4" />
                  </Link>
                ) : (
                  <Button
                    onClick={() => resolveAlert(alert.id)}
                    variant="ghost"
                    size="sm"
                    title="Resolver alerta"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {!showAll && alerts.length > maxAlerts && (
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={() => window.location.href = '/hotel/front-desk'}
            variant="outline"
            className="w-full"
          >
            Ver todas las alertas ({alerts.length})
          </Button>
        </div>
      )}
    </div>
  );
}