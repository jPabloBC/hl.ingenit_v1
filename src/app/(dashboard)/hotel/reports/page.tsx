"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Bed, 
  Users, 
  Calendar, 
  Download,
  Filter,
  RefreshCw,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface KPIData {
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  total_revenue: number;
  paid_revenue: number;
  pending_revenue: number;
  total_reservations: number;
  confirmed_reservations: number;
  pending_reservations: number;
  checked_in_reservations: number;
  occupancy_rate: number;
  average_rate: number;
}

interface RoomRevenue {
  room_number: string;
  room_type: string;
  total_revenue: number;
  paid_revenue: number;
  pending_revenue: number;
  reservations_count: number;
}

interface ReservationStatus {
  status: string;
  count: number;
  revenue: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Data states
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [roomRevenues, setRoomRevenues] = useState<RoomRevenue[]>([]);
  const [reservationStatuses, setReservationStatuses] = useState<ReservationStatus[]>([]);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  useEffect(() => {
    if (businessId && dateRange.start && dateRange.end) {
      loadAllData();
    }
  }, [businessId, dateRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      // Get current user and business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get business info
      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) {
        console.error('Error getting business:', businessError);
        alert('Error al obtener información del negocio');
        return;
      }

      setBusinessId(businessData.id);

    } catch (error) {
      console.error('Error loading reports data:', error);
      alert('Error al cargar datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadKPIData(),
        loadRoomRevenues(),
        loadReservationStatuses(),
        loadRecentReservations()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    try {
      // Load rooms data
      const { data: rooms, error: roomsError } = await supabase
        .from('hl_rooms')
        .select('*')
        .eq('business_id', businessId);

      if (roomsError) {
        console.error('Error loading rooms:', roomsError);
        return;
      }

      // Load reservations data
      const { data: reservations, error: reservationsError } = await supabase
        .from('hl_reservations')
        .select('*')
        .eq('business_id', businessId)
        .gte('check_in_date', dateRange.start)
        .lte('check_out_date', dateRange.end);

      if (reservationsError) {
        console.error('Error loading reservations:', reservationsError);
        return;
      }

      // Calculate KPIs
      const totalRooms = rooms?.length || 0;
      
      // Calculate occupied rooms - simplified approach
      const occupiedRooms = reservations?.filter(r => r.status === 'checked_in').length || 0;
      
      const availableRooms = totalRooms - occupiedRooms;

      const totalRevenue = reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
      const paidRevenue = reservations?.filter(r => r.payment_status === 'paid')
        .reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
      const pendingRevenue = totalRevenue - paidRevenue;

      const totalReservations = reservations?.length || 0;
      const confirmedReservations = reservations?.filter(r => r.status === 'confirmed').length || 0;
      const pendingReservations = reservations?.filter(r => r.status === 'pending').length || 0;
      const checkedInReservations = reservations?.filter(r => r.status === 'checked_in').length || 0;

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      const averageRate = totalReservations > 0 ? totalRevenue / totalReservations : 0;

      setKpiData({
        total_rooms: totalRooms,
        occupied_rooms: occupiedRooms,
        available_rooms: availableRooms,
        total_revenue: totalRevenue,
        paid_revenue: paidRevenue,
        pending_revenue: pendingRevenue,
        total_reservations: totalReservations,
        confirmed_reservations: confirmedReservations,
        pending_reservations: pendingReservations,
        checked_in_reservations: checkedInReservations,
        occupancy_rate: occupancyRate,
        average_rate: averageRate
      });

    } catch (error) {
      console.error('Error loading KPI data:', error);
    }
  };

  const loadRoomRevenues = async () => {
    try {
      const { data: reservations, error } = await supabase
        .from('hl_reservations')
        .select(`
          *,
          hl_rooms!inner(room_number, room_type)
        `)
        .eq('business_id', businessId)
        .gte('check_in_date', dateRange.start)
        .lte('check_out_date', dateRange.end);

      if (error) {
        console.error('Error loading room revenues:', error);
        return;
      }

      // Group by room
      const roomData = reservations?.reduce((acc, reservation) => {
        const roomNumber = reservation.hl_rooms?.room_number || 'Unknown';
        const roomType = reservation.hl_rooms?.room_type || 'Unknown';
        
        if (!acc[roomNumber]) {
          acc[roomNumber] = {
            room_number: roomNumber,
            room_type: roomType,
            total_revenue: 0,
            paid_revenue: 0,
            pending_revenue: 0,
            reservations_count: 0
          };
        }

        acc[roomNumber].total_revenue += reservation.total_amount || 0;
        acc[roomNumber].reservations_count += 1;

        if (reservation.payment_status === 'paid') {
          acc[roomNumber].paid_revenue += reservation.total_amount || 0;
        } else {
          acc[roomNumber].pending_revenue += reservation.total_amount || 0;
        }

        return acc;
      }, {} as Record<string, RoomRevenue>);

      setRoomRevenues(Object.values(roomData || {}));
    } catch (error) {
      console.error('Error loading room revenues:', error);
    }
  };

  const loadReservationStatuses = async () => {
    try {
      const { data: reservations, error } = await supabase
        .from('hl_reservations')
        .select('status, total_amount')
        .eq('business_id', businessId)
        .gte('check_in_date', dateRange.start)
        .lte('check_out_date', dateRange.end);

      if (error) {
        console.error('Error loading reservation statuses:', error);
        return;
      }

      // Group by status
      const statusData = reservations?.reduce((acc, reservation) => {
        const status = reservation.status || 'unknown';
        
        if (!acc[status]) {
          acc[status] = {
            status: status,
            count: 0,
            revenue: 0
          };
        }

        acc[status].count += 1;
        acc[status].revenue += reservation.total_amount || 0;

        return acc;
      }, {} as Record<string, ReservationStatus>);

      setReservationStatuses(Object.values(statusData || {}));
    } catch (error) {
      console.error('Error loading reservation statuses:', error);
    }
  };

  const loadRecentReservations = async () => {
    try {
      const { data: reservations, error } = await supabase
        .from('hl_reservations')
        .select(`
          *,
          hl_rooms!inner(room_number, room_type)
        `)
        .eq('business_id', businessId)
        .gte('check_in_date', dateRange.start)
        .lte('check_out_date', dateRange.end)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading recent reservations:', error);
        return;
      }

      setRecentReservations(reservations || []);
    } catch (error) {
      console.error('Error loading recent reservations:', error);
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'confirmed': 'Reservada',
      'pending': 'Pendiente',
      'checked_in': 'Check-In',
      'checked_out': 'Check-Out',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'checked_in': 'bg-blue-100 text-blue-800',
      'checked_out': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
            <p className="text-gray4">Cargando reportes...</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-blue1 font-title">
                Reportes y Analytics
              </h1>
              <p className="text-gray4">
                KPIs hoteleros, tendencias y proyecciones
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <Button
              onClick={() => router.push('/hotel/reports/advanced')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Target className="h-4 w-4" />
              <span>Reportes Avanzados</span>
            </Button>
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Resumen</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'revenue'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Ingresos</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'rooms'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bed className="h-4 w-4" />
              <span>Por Habitación</span>
            </div>
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCLP(kpiData?.total_revenue || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pagado:</span>
                    <span className="text-green-600 font-medium">
                      {formatCLP(kpiData?.paid_revenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pendiente:</span>
                    <span className="text-yellow-600 font-medium">
                      {formatCLP(kpiData?.pending_revenue || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ocupación</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {kpiData?.occupancy_rate.toFixed(1) || 0}%
                    </p>
                  </div>
                  <Bed className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ocupadas:</span>
                    <span className="font-medium">{kpiData?.occupied_rooms || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Disponibles:</span>
                    <span className="font-medium">{kpiData?.available_rooms || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Reservas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {kpiData?.total_reservations || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reservadas:</span>
                    <span className="font-medium">{kpiData?.confirmed_reservations || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Check-In:</span>
                    <span className="font-medium">{kpiData?.checked_in_reservations || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tarifa Promedio</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCLP(kpiData?.average_rate || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Por noche</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reservation Status Chart */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Estado de Reservas</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reservationStatuses}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${getStatusLabel(status)}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reservationStatuses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by Status */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Ingresos por Estado</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reservationStatuses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tickFormatter={getStatusLabel} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCLP(Number(value))} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Reservations */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Reservas Recientes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Huésped</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Habitación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentReservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.primary_guest_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.primary_guest_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reservation.hl_rooms?.room_number} ({reservation.hl_rooms?.room_type})
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(reservation.check_in_date).toLocaleDateString()} - {new Date(reservation.check_out_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                            {getStatusLabel(reservation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCLP(reservation.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Análisis de Ingresos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCLP(kpiData?.paid_revenue || 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Ingresos Confirmados</div>
                  <div className="flex items-center justify-center mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Pagado</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {formatCLP(kpiData?.pending_revenue || 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Pendiente de Pago</div>
                  <div className="flex items-center justify-center mt-2">
                    <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-xs text-yellow-600">Pendiente</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCLP(kpiData?.total_revenue || 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Total Generado</div>
                  <div className="flex items-center justify-center mt-2">
                    <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-xs text-blue-600">Total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Ingresos por Habitación</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Habitación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Generado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roomRevenues.map((room) => (
                      <tr key={room.room_number}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Habitación {room.room_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 capitalize">
                            {room.room_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {room.reservations_count}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCLP(room.total_revenue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600 font-medium">
                            {formatCLP(room.paid_revenue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-yellow-600 font-medium">
                            {formatCLP(room.pending_revenue)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}