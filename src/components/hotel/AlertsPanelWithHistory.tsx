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
  User,
  History,
  AlertCircle
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
  is_resolved?: boolean;
  resolved_at?: string;
  primary_guest_name?: string;
  room_number?: string;
}

interface Movement {
  id: string;
  movement_type: string;
  notes: string;
  created_at: string;
  primary_guest_name?: string;
  room_number?: string;
  reservation_status?: string;
}

interface AlertsPanelWithHistoryProps {
  businessId: string;
  showAll?: boolean;
  maxAlerts?: number;
}

export default function AlertsPanelWithHistory({ businessId, showAll = false, maxAlerts = 5 }: AlertsPanelWithHistoryProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'movements'>('active');

  useEffect(() => {
    loadAlerts();
    loadResolvedAlerts();
    loadMovements();
  }, [businessId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      console.log('Loading alerts for business:', businessId);
      
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

  const loadResolvedAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('hl_system_alerts')
        .select(`
          id,
          alert_type,
          title,
          message,
          severity,
          reservation_id,
          room_id,
          guest_id,
          is_read,
          alert_date,
          due_date,
          is_resolved,
          updated_at,
          hl_reservations!left(primary_guest_name),
          hl_rooms!left(room_number)
        `)
        .eq('business_id', businessId)
        .eq('is_resolved', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading resolved alerts:', error);
        return;
      }

      const formattedData = (data || []).map(alert => ({
        ...alert,
        primary_guest_name: alert.hl_reservations?.[0]?.primary_guest_name,
        room_number: alert.hl_rooms?.[0]?.room_number,
        days_overdue: 0
      }));

      setResolvedAlerts(formattedData);
    } catch (error) {
      console.error('Error loading resolved alerts:', error);
    }
  };

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('hl_room_movements')
        .select(`
          id,
          movement_type,
          notes,
          created_at,
          reservation_id,
          hl_reservations!left(primary_guest_name, status),
          hl_rooms!left(room_number)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading movements:', error);
        return;
      }

      const formattedData = (data || []).map(movement => ({
        id: movement.id,
        movement_type: movement.movement_type,
        notes: movement.notes,
        created_at: movement.created_at,
        primary_guest_name: movement.hl_reservations?.[0]?.primary_guest_name,
        room_number: movement.hl_rooms?.[0]?.room_number,
        reservation_status: movement.hl_reservations?.[0]?.status
      }));

      setMovements(formattedData);
    } catch (error) {
      console.error('Error loading movements:', error);
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
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) {
        console.error('Error resolving alert:', error);
        return;
      }

      const alertToResolve = alerts.find(a => a.id === alertId);
      if (alertToResolve) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        setResolvedAlerts(prev => [alertToResolve, ...prev]);
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'checkin':
        return 'Check-in';
      case 'checkout':
        return 'Check-out';
      case 'maintenance':
        return 'Mantenimiento';
      case 'cleaning':
        return 'Limpieza';
      case 'blocked':
        return 'Bloqueado';
      default:
        return type;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'checkin':
        return 'bg-green-100 text-green-800';
      case 'checkout':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaning':
        return 'bg-purple-100 text-purple-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = showAll ? alerts : alerts.slice(0, maxAlerts);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Alertas Activas ({alerts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Historial ({resolvedAlerts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'movements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Movimientos ({movements.length})</span>
              </div>
            </button>
          </div>
          
          <Button
            onClick={() => {
              setRefreshing(true);
              Promise.all([
                loadAlerts(),
                loadResolvedAlerts(),
                loadMovements()
              ]).finally(() => setRefreshing(false));
            }}
            variant="ghost"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'active' && (
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
      )}

      {activeTab === 'history' && (
        <div className="divide-y divide-gray-200">
          {resolvedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 border-l-4 border-green-500 bg-green-50"
            >
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-green-800">
                      {alert.title} ✅
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Resuelto
                    </span>
                  </div>
                  <p className="text-sm text-green-800 opacity-90">
                    {alert.message}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>
                      Creada: {new Date(alert.alert_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {alert.resolved_at && (
                      <span>
                        Resuelta: {new Date(alert.resolved_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  {alert.primary_guest_name && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Huésped:</strong> {alert.primary_guest_name}
                      {alert.room_number && ` • Habitación: ${alert.room_number}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {resolvedAlerts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay alertas resueltas en el historial</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="divide-y divide-gray-200">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="p-4 border-l-4 border-blue-500 bg-blue-50"
            >
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                      {getMovementTypeLabel(movement.movement_type)}
                    </span>
                    {movement.reservation_status && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {movement.reservation_status}
                      </span>
                    )}
                  </div>
                  {movement.notes && (
                    <p className="text-sm text-blue-800 opacity-90 mb-2">
                      {movement.notes}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>
                      {new Date(movement.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {movement.primary_guest_name && (
                      <span>
                        <strong>Huésped:</strong> {movement.primary_guest_name}
                      </span>
                    )}
                    {movement.room_number && (
                      <span>
                        <strong>Habitación:</strong> {movement.room_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {movements.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay movimientos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Show More Button for Active Alerts */}
      {activeTab === 'active' && !showAll && alerts.length > maxAlerts && (
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