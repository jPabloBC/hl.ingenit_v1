"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Download, 
  Filter,
  RefreshCw,
  Bed,
  CreditCard,
  Star,
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { formatCurrency } from "@/hooks/useRegion";

interface KPIData {
  adr: number;
  revpar: number;
  occupancy: number;
  totalRevenue: number;
  totalBookings: number;
  averageStay: number;
  cancellationRate: number;
  conversionRate: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  adr: number;
  revpar: number;
  occupancy: number;
}

interface RoomTypePerformance {
  room_type: string;
  total_revenue: number;
  total_bookings: number;
  average_adr: number;
  occupancy_rate: number;
}

interface ChannelPerformance {
  source: string;
  bookings: number;
  revenue: number;
  average_adr: number;
  conversion_rate: number;
}

export default function AdvancedReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // días
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [roomPerformance, setRoomPerformance] = useState<RoomTypePerformance[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [previousPeriodData, setPreviousPeriodData] = useState<KPIData | null>(null);

  useEffect(() => {
    loadAdvancedReports();
  }, [dateRange, selectedPeriod]);

  const loadAdvancedReports = async () => {
    try {
      setLoading(true);
      
      // Obtener business_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: businessData } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (!businessData) return;

      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Cargar datos de reservas
      const { data: reservations } = await supabase
        .from('hl_reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          total_amount,
          status,
          payment_status,
          source,
          room_id,
          hl_rooms (
            room_type,
            price_per_night
          )
        `)
        .eq('business_id', businessData.id)
        .gte('check_in_date', startDate.toISOString().split('T')[0])
        .lte('check_in_date', endDate.toISOString().split('T')[0]);

      // Cargar datos de habitaciones
      const { data: rooms } = await supabase
        .from('hl_rooms')
        .select('id, room_type, price_per_night')
        .eq('business_id', businessData.id);

      if (!reservations || !rooms) return;

      // Calcular KPIs
      const kpis = calculateKPIs(reservations, rooms, days);
      setKpiData(kpis);

      // Calcular datos de ingresos por período
      const revenue = calculateRevenueData(reservations, days, selectedPeriod);
      setRevenueData(revenue);

      // Calcular rendimiento por tipo de habitación
      const roomPerf = calculateRoomTypePerformance(reservations, rooms);
      setRoomPerformance(roomPerf);

      // Calcular rendimiento por canal
      const channelPerf = calculateChannelPerformance(reservations);
      setChannelPerformance(channelPerf);

      // Cargar datos del período anterior para comparación
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);
      const prevEndDate = new Date(startDate);

      const { data: prevReservations } = await supabase
        .from('hl_reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          total_amount,
          status,
          payment_status,
          source,
          room_id,
          hl_rooms (
            room_type,
            price_per_night
          )
        `)
        .eq('business_id', businessData.id)
        .gte('check_in_date', prevStartDate.toISOString().split('T')[0])
        .lte('check_in_date', prevEndDate.toISOString().split('T')[0]);

      if (prevReservations) {
        const prevKPIs = calculateKPIs(prevReservations, rooms, days);
        setPreviousPeriodData(prevKPIs);
      }

    } catch (error) {
      console.error('Error loading advanced reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (reservations: any[], rooms: any[], days: number): KPIData => {
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
    const paidReservations = confirmedReservations.filter(r => r.payment_status === 'paid');
    
    const totalRevenue = paidReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalBookings = confirmedReservations.length;
    const totalRooms = rooms.length;
    const totalRoomNights = totalRooms * days;
    
    // Calcular estadías
    const totalNights = confirmedReservations.reduce((sum, r) => {
      const checkIn = new Date(r.check_in_date);
      const checkOut = new Date(r.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);

    const averageStay = totalBookings > 0 ? totalNights / totalBookings : 0;
    
    // ADR (Average Daily Rate)
    const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
    
    // RevPAR (Revenue Per Available Room)
    const revpar = totalRoomNights > 0 ? totalRevenue / totalRoomNights : 0;
    
    // Occupancy Rate
    const occupancy = totalRoomNights > 0 ? (totalNights / totalRoomNights) * 100 : 0;
    
    // Cancellation Rate
    const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
    const cancellationRate = totalBookings > 0 ? (cancelledReservations / (totalBookings + cancelledReservations)) * 100 : 0;
    
    // Conversion Rate (simplificado)
    const conversionRate = 85; // Placeholder - en un sistema real se calcularía con datos de visitas

    return {
      adr,
      revpar,
      occupancy,
      totalRevenue,
      totalBookings,
      averageStay,
      cancellationRate,
      conversionRate
    };
  };

  const calculateRevenueData = (reservations: any[], days: number, period: string): RevenueData[] => {
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
    const paidReservations = confirmedReservations.filter(r => r.payment_status === 'paid');
    
    const data: RevenueData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayReservations = paidReservations.filter(r => r.check_in_date === dateStr);
      const dayRevenue = dayReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const dayBookings = dayReservations.length;
      
      // Calcular ADR y RevPAR para el día
      const dayNights = dayReservations.reduce((sum, r) => {
        const checkIn = new Date(r.check_in_date);
        const checkOut = new Date(r.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0);
      
      const dayADR = dayNights > 0 ? dayRevenue / dayNights : 0;
      const dayRevPAR = dayRevenue / 10; // Asumiendo 10 habitaciones
      const dayOccupancy = (dayNights / 10) * 100; // Asumiendo 10 habitaciones
      
      data.push({
        date: dateStr,
        revenue: dayRevenue,
        bookings: dayBookings,
        adr: dayADR,
        revpar: dayRevPAR,
        occupancy: dayOccupancy
      });
    }
    
    return data;
  };

  const calculateRoomTypePerformance = (reservations: any[], rooms: any[]): RoomTypePerformance[] => {
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
    const paidReservations = confirmedReservations.filter(r => r.payment_status === 'paid');
    
    const roomTypes = [...new Set(rooms.map(r => r.room_type))];
    
    return roomTypes.map(type => {
      const typeRooms = rooms.filter(r => r.room_type === type);
      const typeReservations = paidReservations.filter(r => 
        typeRooms.some(room => room.id === r.room_id)
      );
      
      const totalRevenue = typeReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const totalBookings = typeReservations.length;
      const averageADR = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      
      // Calcular ocupación (simplificado)
      const occupancyRate = (totalBookings / (typeRooms.length * 30)) * 100; // 30 días
      
      return {
        room_type: type,
        total_revenue: totalRevenue,
        total_bookings: totalBookings,
        average_adr: averageADR,
        occupancy_rate: occupancyRate
      };
    });
  };

  const calculateChannelPerformance = (reservations: any[]): ChannelPerformance[] => {
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
    const paidReservations = confirmedReservations.filter(r => r.payment_status === 'paid');
    
    const sources = [...new Set(paidReservations.map(r => r.source || 'direct'))];
    
    return sources.map(source => {
      const sourceReservations = paidReservations.filter(r => (r.source || 'direct') === source);
      const bookings = sourceReservations.length;
      const revenue = sourceReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const averageADR = bookings > 0 ? revenue / bookings : 0;
      
      return {
        source: source === 'direct' ? 'Directo' : source,
        bookings,
        revenue,
        average_adr: averageADR,
        conversion_rate: 85 // Placeholder
      };
    });
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (!previous || previous === 0) return <Minus className="h-4 w-4 text-gray4" />;
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray4" />;
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (!previous || previous === 0) return '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const exportReport = () => {
    if (!kpiData) return;
    
    const csvContent = [
      'Métrica,Valor Actual,Valor Anterior,Cambio',
      `ADR,${formatCurrency(kpiData.adr, 'CLP')},${previousPeriodData ? formatCurrency(previousPeriodData.adr, 'CLP') : 'N/A'},${getChangePercentage(kpiData.adr, previousPeriodData?.adr || 0)}`,
      `RevPAR,${formatCurrency(kpiData.revpar, 'CLP')},${previousPeriodData ? formatCurrency(previousPeriodData.revpar, 'CLP') : 'N/A'},${getChangePercentage(kpiData.revpar, previousPeriodData?.revpar || 0)}`,
      `Ocupación,${kpiData.occupancy.toFixed(1)}%,${previousPeriodData ? previousPeriodData.occupancy.toFixed(1) + '%' : 'N/A'},${getChangePercentage(kpiData.occupancy, previousPeriodData?.occupancy || 0)}`,
      `Ingresos Totales,${formatCurrency(kpiData.totalRevenue, 'CLP')},${previousPeriodData ? formatCurrency(previousPeriodData.totalRevenue, 'CLP') : 'N/A'},${getChangePercentage(kpiData.totalRevenue, previousPeriodData?.totalRevenue || 0)}`,
      `Reservas,${kpiData.totalBookings},${previousPeriodData ? previousPeriodData.totalBookings : 'N/A'},${getChangePercentage(kpiData.totalBookings, previousPeriodData?.totalBookings || 0)}`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_avanzado_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4">Cargando reportes avanzados...</p>
        </div>
      
    );
  }

  return (
    
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">Reportes Avanzados</h1>
            <p className="text-gray4 font-body">KPIs críticos y análisis financiero</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportReport}
              variant="outline"
              className="border-blue8 text-blue8 hover:bg-blue15"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              onClick={loadAdvancedReports}
              variant="outline"
              className="border-blue8 text-blue8 hover:bg-blue15"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray1 mb-2">Período</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="365">Último año</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray1 mb-2">Granularidad</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
          </div>
        </div>

        {kpiData && (
          <>
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue15 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue8" />
                  </div>
                  {getChangeIndicator(kpiData.adr, previousPeriodData?.adr || 0)}
                </div>
                <h3 className="text-sm text-gray4 mb-1">ADR (Average Daily Rate)</h3>
                <p className="text-2xl font-bold text-blue1">{formatCurrency(kpiData.adr, 'CLP')}</p>
                <p className="text-sm text-gray4 mt-1">
                  {getChangePercentage(kpiData.adr, previousPeriodData?.adr || 0)} vs período anterior
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  {getChangeIndicator(kpiData.revpar, previousPeriodData?.revpar || 0)}
                </div>
                <h3 className="text-sm text-gray4 mb-1">RevPAR (Revenue Per Available Room)</h3>
                <p className="text-2xl font-bold text-blue1">{formatCurrency(kpiData.revpar, 'CLP')}</p>
                <p className="text-sm text-gray4 mt-1">
                  {getChangePercentage(kpiData.revpar, previousPeriodData?.revpar || 0)} vs período anterior
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Bed className="h-6 w-6 text-yellow-600" />
                  </div>
                  {getChangeIndicator(kpiData.occupancy, previousPeriodData?.occupancy || 0)}
                </div>
                <h3 className="text-sm text-gray4 mb-1">Tasa de Ocupación</h3>
                <p className="text-2xl font-bold text-blue1">{kpiData.occupancy.toFixed(1)}%</p>
                <p className="text-sm text-gray4 mt-1">
                  {getChangePercentage(kpiData.occupancy, previousPeriodData?.occupancy || 0)} vs período anterior
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                  {getChangeIndicator(kpiData.totalRevenue, previousPeriodData?.totalRevenue || 0)}
                </div>
                <h3 className="text-sm text-gray4 mb-1">Ingresos Totales</h3>
                <p className="text-2xl font-bold text-blue1">{formatCurrency(kpiData.totalRevenue, 'CLP')}</p>
                <p className="text-sm text-gray4 mt-1">
                  {getChangePercentage(kpiData.totalRevenue, previousPeriodData?.totalRevenue || 0)} vs período anterior
                </p>
              </div>
            </div>

            {/* KPIs Secundarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm text-gray4 mb-1">Reservas Totales</h3>
                <p className="text-xl font-bold text-blue1">{kpiData.totalBookings}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm text-gray4 mb-1">Estadía Promedio</h3>
                <p className="text-xl font-bold text-blue1">{kpiData.averageStay.toFixed(1)} noches</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm text-gray4 mb-1">Tasa de Cancelación</h3>
                <p className="text-xl font-bold text-blue1">{kpiData.cancellationRate.toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm text-gray4 mb-1">Tasa de Conversión</h3>
                <p className="text-xl font-bold text-blue1">{kpiData.conversionRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Rendimiento por Tipo de Habitación */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray8">
                <h2 className="text-xl font-semibold text-blue1">Rendimiento por Tipo de Habitación</h2>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Tipo</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Ingresos</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Reservas</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">ADR Promedio</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Ocupación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray8">
                      {roomPerformance.map((room) => (
                        <tr key={room.room_type}>
                          <td className="px-4 py-3 font-semibold">{room.room_type}</td>
                          <td className="px-4 py-3">{formatCurrency(room.total_revenue, 'CLP')}</td>
                          <td className="px-4 py-3">{room.total_bookings}</td>
                          <td className="px-4 py-3">{formatCurrency(room.average_adr, 'CLP')}</td>
                          <td className="px-4 py-3">{room.occupancy_rate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Rendimiento por Canal */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray8">
                <h2 className="text-xl font-semibold text-blue1">Rendimiento por Canal de Venta</h2>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Canal</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Reservas</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Ingresos</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">ADR Promedio</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Conversión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray8">
                      {channelPerformance.map((channel) => (
                        <tr key={channel.source}>
                          <td className="px-4 py-3 font-semibold">{channel.source}</td>
                          <td className="px-4 py-3">{channel.bookings}</td>
                          <td className="px-4 py-3">{formatCurrency(channel.revenue, 'CLP')}</td>
                          <td className="px-4 py-3">{formatCurrency(channel.average_adr, 'CLP')}</td>
                          <td className="px-4 py-3">{channel.conversion_rate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    
  );
}