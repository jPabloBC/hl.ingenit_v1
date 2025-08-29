"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
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
  Activity
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface KPIData {
  period_start: string;
  period_end: string;
  total_rooms: number;
  available_room_nights: number;
  occupied_room_nights: number;
  occupancy_rate: number;
  total_revenue: number;
  adr: number;
  revpar: number;
  total_reservations: number;
  avg_length_of_stay: number;
  cancellation_rate: number;
}

interface MonthlyKPI {
  year: number;
  month: number;
  month_name: string;
  total_rooms: number;
  available_room_nights: number;
  occupied_room_nights: number;
  occupancy_rate: number;
  total_revenue: number;
  adr: number;
  revpar: number;
  total_reservations: number;
  avg_length_of_stay: number;
}

interface RoomTypePerformance {
  room_type: string;
  total_rooms: number;
  reservations: number;
  occupancy_rate: number;
  average_rate: number;
  total_revenue: number;
  revpar: number;
}

interface ForecastData {
  forecast_date: string;
  projected_occupancy_rate: number;
  projected_revenue: number;
  confidence_level: string;
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
  const [currentKPIs, setCurrentKPIs] = useState<KPIData | null>(null);
  const [monthlyKPIs, setMonthlyKPIs] = useState<MonthlyKPI[]>([]);
  const [roomTypePerformance, setRoomTypePerformance] = useState<RoomTypePerformance[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  useEffect(() => {
    if (businessId && dateRange.start && dateRange.end) {
      loadCurrentKPIs();
      loadRoomTypePerformance();
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

      // Load initial data
      await Promise.all([
        loadMonthlyKPIs(businessData.id),
        loadForecast(businessData.id)
      ]);

    } catch (error) {
      console.error('Error loading reports data:', error);
      alert('Error al cargar datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentKPIs = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_hotel_kpis', {
          p_business_id: businessId,
          p_start_date: dateRange.start,
          p_end_date: dateRange.end
        });

      if (error) {
        console.error('Error loading current KPIs:', error);
        return;
      }

      if (data && data.length > 0) {
        setCurrentKPIs(data[0]);
      }
    } catch (error) {
      console.error('Error loading current KPIs:', error);
    }
  };

  const loadMonthlyKPIs = async (businessId: string) => {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .rpc('get_monthly_kpis', {
          p_business_id: businessId,
          p_year: currentYear,
          p_months: 12
        });

      if (error) {
        console.error('Error loading monthly KPIs:', error);
        return;
      }

      setMonthlyKPIs(data || []);
    } catch (error) {
      console.error('Error loading monthly KPIs:', error);
    }
  };

  const loadRoomTypePerformance = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_room_type_performance', {
          p_business_id: businessId,
          p_start_date: dateRange.start,
          p_end_date: dateRange.end
        });

      if (error) {
        console.error('Error loading room type performance:', error);
        return;
      }

      setRoomTypePerformance(data || []);
    } catch (error) {
      console.error('Error loading room type performance:', error);
    }
  };

  const loadForecast = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_hotel_forecast', {
          p_business_id: businessId,
          p_forecast_days: 30
        });

      if (error) {
        console.error('Error loading forecast:', error);
        return;
      }

      setForecastData(data || []);
    } catch (error) {
      console.error('Error loading forecast:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      loadCurrentKPIs(),
      loadMonthlyKPIs(businessId),
      loadRoomTypePerformance(),
      loadForecast(businessId)
    ]);
    setLoading(false);
  };



  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <HotelLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
            <p className="text-gray4">Cargando reportes...</p>
          </div>
        </div>
      </HotelLayout>
    );
  }

  return (
    <HotelLayout>
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
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {/* Current KPIs Cards */}
        {currentKPIs && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ocupación</p>
                  <p className="text-2xl font-bold text-blue-600">{currentKPIs.occupancy_rate}%</p>
                </div>
                <Bed className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {currentKPIs.occupied_room_nights} de {currentKPIs.available_room_nights} noches disponibles
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ADR (Tarifa Promedio)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCLP(currentKPIs.adr)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Por habitación ocupada
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">RevPAR</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCLP(currentKPIs.revpar)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ingresos por habitación disponible
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estadía Promedio</p>
                  <p className="text-2xl font-bold text-orange-600">{currentKPIs.avg_length_of_stay}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Noches por reserva
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Tendencias
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rooms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PieChartIcon className="h-4 w-4 inline mr-2" />
                Por Tipo de Habitación
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'forecast'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="h-4 w-4 inline mr-2" />
                Proyecciones
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tendencias Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ocupación y Ingresos Mensuales</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyKPIs}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month_name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'occupancy_rate' ? `${value}%` : formatCLP(Number(value)),
                            name === 'occupancy_rate' ? 'Ocupación' : 'Ingresos'
                          ]}
                        />
                        <Legend />
                        <Bar yAxisId="right" dataKey="total_revenue" fill="#10B981" name="Ingresos" />
                        <Line yAxisId="left" type="monotone" dataKey="occupancy_rate" stroke="#3B82F6" strokeWidth={3} name="Ocupación %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">ADR y RevPAR Mensuales</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyKPIs}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month_name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCLP(Number(value)), 'Valor']} />
                        <Legend />
                        <Bar dataKey="adr" fill="#8884D8" name="ADR" />
                        <Bar dataKey="revpar" fill="#82CA9D" name="RevPAR" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Room Types Tab */}
            {activeTab === 'rooms' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance por Tipo de Habitación</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Distribución de Ingresos</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={roomTypePerformance}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ room_type, percent }) => `${room_type} ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="total_revenue"
                            >
                              {roomTypePerformance.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [formatCLP(Number(value)), 'Ingresos']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Ocupación por Tipo</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={roomTypePerformance} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="room_type" type="category" />
                            <Tooltip formatter={(value) => [`${value}%`, 'Ocupación']} />
                            <Bar dataKey="occupancy_rate" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Tabla Detallada</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo de Habitación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Habitaciones
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ocupación %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tarifa Promedio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            RevPAR
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingresos Totales
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roomTypePerformance.map((roomType, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {roomType.room_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {roomType.total_rooms}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {roomType.occupancy_rate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCLP(roomType.average_rate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCLP(roomType.revpar)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCLP(roomType.total_revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Forecast Tab */}
            {activeTab === 'forecast' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Proyección de Ocupación (Próximos 30 días)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData.slice(0, 30)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="forecast_date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
                          formatter={(value, name) => [
                            name === 'projected_occupancy_rate' ? `${value}%` : formatCLP(Number(value)),
                            name === 'projected_occupancy_rate' ? 'Ocupación Proyectada' : 'Ingresos Proyectados'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="projected_occupancy_rate" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Ocupación %" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <Activity className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Nota sobre las Proyecciones
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Las proyecciones se basan en tendencias históricas de los últimos 90 días. 
                        La confianza decrece con el tiempo: Alta (7 días), Media (14 días), Baja (30+ días).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </HotelLayout>
  );
}
