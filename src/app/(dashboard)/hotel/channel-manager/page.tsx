"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Settings, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  DollarSign,
  Calendar,
  Users,
  BarChart3,
  Wifi,
  WifiOff,
  ExternalLink,
  Shield,
  Database
} from "lucide-react";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx

interface Channel {
  id: string;
  name: string;
  type: 'ota' | 'direct' | 'gds' | 'metasearch';
  status: 'active' | 'inactive' | 'syncing' | 'error';
  api_key?: string;
  api_secret?: string;
  hotel_id?: string;
  commission_rate: number;
  last_sync?: string;
  sync_frequency: 'realtime' | 'hourly' | 'daily';
  auto_accept: boolean;
  rate_parity: boolean;
  inventory_sync: boolean;
  booking_sync: boolean;
  created_at: string;
}

interface ChannelStats {
  channel_id: string;
  channel_name: string;
  total_bookings: number;
  total_revenue: number;
  average_adr: number;
  commission_paid: number;
  last_booking?: string;
  sync_status: 'success' | 'error' | 'pending';
}

interface InventoryItem {
  room_type: string;
  total_rooms: number;
  available_rooms: number;
  booked_rooms: number;
  channels: {
    [channelId: string]: {
      available: number;
      price: number;
      last_update: string;
    };
  };
}

export default function ChannelManagerPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadChannelManagerData();
  }, []);

  const loadChannelManagerData = async () => {
    try {
      setLoading(true);
      
      // Obtener business_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: businessData } = await supabase
        .from('hl_business')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!businessData) return;

      // Cargar canales
      const { data: channelsData } = await supabase
        .from('hl_channels')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      // Cargar estadísticas de canales
      const { data: statsData } = await supabase
        .from('hl_channel_stats')
        .select('*')
        .eq('business_id', businessData.id);

      // Cargar inventario
      const { data: inventoryData } = await supabase
        .from('hl_rooms')
        .select('id, room_type, price_per_night')
        .eq('business_id', businessData.id);

      // Cargar reservas para calcular estadísticas
      const { data: reservationsData } = await supabase
        .from('hl_reservations')
        .select('id, total_amount, source, created_at, status')
        .eq('business_id', businessData.id)
        .eq('payment_status', 'paid');

      setChannels(channelsData || []);

      // Procesar estadísticas de canales
      if (channelsData && reservationsData) {
        const stats = channelsData.map(channel => {
          const channelReservations = reservationsData.filter(r => r.source === channel.name);
          const totalBookings = channelReservations.length;
          const totalRevenue = channelReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
          const averageADR = totalBookings > 0 ? totalRevenue / totalBookings : 0;
          const commissionPaid = totalRevenue * (channel.commission_rate / 100);
          const lastBooking = channelReservations.length > 0 
            ? channelReservations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : null;

          return {
            channel_id: channel.id,
            channel_name: channel.name,
            total_bookings: totalBookings,
            total_revenue: totalRevenue,
            average_adr: averageADR,
            commission_paid: commissionPaid,
            last_booking: lastBooking,
            sync_status: channel.status === 'active' ? 'success' : 'error'
          };
        });
        setChannelStats(
          stats.map(stat => ({
            ...stat,
            sync_status: stat.sync_status as 'success' | 'error' | 'pending'
          }))
        );
      }

      // Procesar inventario
      if (inventoryData && channelsData) {
        const inventoryItems = inventoryData.reduce((acc: any, room) => {
          const roomType = room.room_type;
          if (!acc[roomType]) {
            acc[roomType] = {
              room_type: roomType,
              total_rooms: 0,
              available_rooms: 0,
              booked_rooms: 0,
              channels: {}
            };
          }
          acc[roomType].total_rooms += 1;
          acc[roomType].available_rooms += 1;
          
          // Simular datos de canales
          channelsData.forEach(channel => {
            if (!acc[roomType].channels[channel.id]) {
              acc[roomType].channels[channel.id] = {
                available: 1,
                price: room.price_per_night,
                last_update: new Date().toISOString()
              };
            }
          });
          
          return acc;
        }, {});
        
        setInventory(Object.values(inventoryItems));
      }

    } catch (error) {
      console.error('Error loading channel manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelTypeLabel = (type: string) => {
    const labels = {
      'ota': 'OTA',
      'direct': 'Directo',
      'gds': 'GDS',
      'metasearch': 'Metabúsqueda'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'syncing': 'bg-blue-100 text-blue-800',
      'error': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <Clock className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleSyncChannel = async (channelId: string) => {
    try {
      setSyncing(channelId);
      
      // Simular sincronización
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actualizar estado del canal
      const { error } = await supabase
        .from('hl_channels')
        .update({
          status: 'active',
          last_sync: new Date().toISOString()
        })
        .eq('id', channelId);

      if (!error) {
        loadChannelManagerData();
      }
    } catch (error) {
      console.error('Error syncing channel:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleChannel = async (channelId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('hl_channels')
        .update({ status: newStatus })
        .eq('id', channelId);

      if (!error) {
        loadChannelManagerData();
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este canal?')) return;
    
    try {
      const { error } = await supabase
        .from('hl_channels')
        .delete()
        .eq('id', channelId);

      if (!error) {
        loadChannelManagerData();
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  if (loading) {
    return (
      
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4">Cargando channel manager...</p>
        </div>
      
    );
  }

  return (
    
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">Channel Manager</h1>
            <p className="text-gray4 font-body">Gestión de canales de distribución</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAddChannel(true)}
              className="bg-blue8 hover:bg-blue6 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Canal
            </Button>
            <Button
              onClick={loadChannelManagerData}
              variant="outline"
              className="border-blue8 text-blue8 hover:bg-blue15"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue15 rounded-lg">
                <Globe className="h-6 w-6 text-blue8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Canales Activos</p>
                <p className="text-2xl font-bold text-blue1">
                  {channels.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Revenue Total</p>
                <p className="text-2xl font-bold text-blue1">
                  ${channelStats.reduce((sum, s) => sum + s.total_revenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Reservas Totales</p>
                <p className="text-2xl font-bold text-blue1">
                  {channelStats.reduce((sum, s) => sum + s.total_bookings, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">ADR Promedio</p>
                <p className="text-2xl font-bold text-blue1">
                  ${channelStats.length > 0 ? (channelStats.reduce((sum, s) => sum + s.average_adr, 0) / channelStats.length).toFixed(0) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray8">
            <h2 className="text-xl font-semibold text-blue1">Canales de Distribución</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Canal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Última Sincronización</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Comisión</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Reservas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray8">
                {channels.map((channel) => {
                  const stats = channelStats.find(s => s.channel_id === channel.id);
                  return (
                    <tr key={channel.id} className="hover:bg-gray10">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 text-blue8 mr-2" />
                          <span className="font-semibold">{channel.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{getChannelTypeLabel(channel.type)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {getStatusIcon(channel.status)}
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(channel.status)}`}>
                            {channel.status === 'active' && 'Activo'}
                            {channel.status === 'inactive' && 'Inactivo'}
                            {channel.status === 'syncing' && 'Sincronizando'}
                            {channel.status === 'error' && 'Error'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {channel.last_sync 
                            ? new Date(channel.last_sync).toLocaleString('es-CL')
                            : 'Nunca'
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{channel.commission_rate}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{stats?.total_bookings || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSyncChannel(channel.id)}
                            disabled={syncing === channel.id}
                            className="bg-blue8 hover:bg-blue6 text-white"
                          >
                            {syncing === channel.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleToggleChannel(channel.id, channel.status)}
                            variant="outline"
                            className="border-blue8 text-blue8 hover:bg-blue15"
                          >
                            {channel.status === 'active' ? (
                              <WifiOff className="h-4 w-4" />
                            ) : (
                              <Wifi className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => setSelectedChannel(channel)}
                            variant="outline"
                            className="border-gray8 text-gray8 hover:bg-gray10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleDeleteChannel(channel.id)}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {channels.length === 0 && (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray4 mx-auto mb-4" />
                <p className="text-gray4">No hay canales configurados</p>
                <Button
                  onClick={() => setShowAddChannel(true)}
                  className="mt-4 bg-blue8 hover:bg-blue6 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Canal
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray8">
            <h2 className="text-xl font-semibold text-blue1">Rendimiento por Canal</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channelStats.map((stat) => (
                <div key={stat.channel_id} className="border border-gray8 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue1">{stat.channel_name}</h3>
                    <div className={`p-1 rounded-full ${stat.sync_status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {stat.sync_status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray4">Reservas:</span>
                      <span className="font-semibold">{stat.total_bookings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray4">Ingresos:</span>
                      <span className="font-semibold">${stat.total_revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray4">ADR:</span>
                      <span className="font-semibold">${stat.average_adr.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray4">Comisión:</span>
                      <span className="font-semibold text-red-600">${stat.commission_paid.toFixed(0)}</span>
                    </div>
                  </div>
                  
                  {stat.last_booking && (
                    <div className="mt-3 pt-3 border-t border-gray8">
                      <div className="flex items-center text-sm text-gray4">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Última: {new Date(stat.last_booking).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray8">
            <h2 className="text-xl font-semibold text-blue1">Vista General del Inventario</h2>
          </div>
          
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Tipo de Habitación</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Disponible</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Ocupado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Última Actualización</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray8">
                  {inventory.map((item) => (
                    <tr key={item.room_type}>
                      <td className="px-4 py-3 font-semibold">{item.room_type}</td>
                      <td className="px-4 py-3">{item.total_rooms}</td>
                      <td className="px-4 py-3 text-green-600">{item.available_rooms}</td>
                      <td className="px-4 py-3 text-red-600">{item.booked_rooms}</td>
                      <td className="px-4 py-3 text-sm text-gray4">
                        {new Date().toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    
  );
}