"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
import { Button } from "@/components/ui/button";
import { 
  LogIn, 
  LogOut, 
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Bed,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  Sparkles,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface RoomStatus {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  capacity: number;
  room_status: string;
  current_reservation_id?: string;
  current_guest?: string;
  current_guest_email?: string;
  current_guest_count?: number;
  check_in_date?: string;
  check_out_date?: string;
  reservation_status?: string;
  last_movement_type?: string;
  last_movement_date?: string;
  last_movement_notes?: string;
  last_movement_by?: string;
}

interface Reservation {
  reservation_id: string;
  guest_name: string;
  guest_email: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  number_of_guests: number;
  total_amount: number;
  payment_status?: string;
  payment_method?: string;
}

export default function FrontDeskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>('');
  const [businessCountry, setBusinessCountry] = useState<string>('chile');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [todayArrivals, setTodayArrivals] = useState<Reservation[]>([]);
  const [todayDepartures, setTodayDepartures] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('rooms');
  const [processingAction, setProcessingAction] = useState<string>('');
  const [paymentModal, setPaymentModal] = useState<{
    show: boolean;
    reservationId: string | null;
    amount: number;
    guestName: string;
  }>({
    show: false,
    reservationId: null,
    amount: 0,
    guestName: ''
  });

  // Función para obtener la fecha actual en zona horaria del negocio
  const getBusinessDate = (country?: string) => {
    const now = new Date();
    let timeZone = "America/Santiago"; // Default para Chile
    
    // Mapear países a zonas horarias
    switch (country?.toLowerCase()) {
      case 'chile':
        timeZone = "America/Santiago";
        break;
      case 'argentina':
        timeZone = "America/Argentina/Buenos_Aires";
        break;
      case 'peru':
        timeZone = "America/Lima";
        break;
      case 'colombia':
        timeZone = "America/Bogota";
        break;
      case 'mexico':
        timeZone = "America/Mexico_City";
        break;
      case 'spain':
      case 'españa':
        timeZone = "Europe/Madrid";
        break;
      default:
        timeZone = "America/Santiago"; // Default para Chile
    }
    
    const businessTime = new Date(now.toLocaleString("en-US", {timeZone}));
    return businessTime.toISOString().split('T')[0];
  };

  // Función para obtener la fecha y hora actual en zona horaria del negocio
  const getBusinessDateTime = (country?: string) => {
    const now = new Date();
    let timeZone = "America/Santiago"; // Default para Chile
    
    // Mapear países a zonas horarias
    switch (country?.toLowerCase()) {
      case 'chile':
        timeZone = "America/Santiago";
        break;
      case 'argentina':
        timeZone = "America/Argentina/Buenos_Aires";
        break;
      case 'peru':
        timeZone = "America/Lima";
        break;
      case 'colombia':
        timeZone = "America/Bogota";
        break;
      case 'mexico':
        timeZone = "America/Mexico_City";
        break;
      case 'spain':
      case 'españa':
        timeZone = "Europe/Madrid";
        break;
      default:
        timeZone = "America/Santiago"; // Default para Chile
    }
    
    const businessTime = new Date(now.toLocaleString("en-US", {timeZone}));
    return businessTime;
  };

  // Función para formatear fechas en la zona horaria del negocio
  const formatBusinessDate = (dateString: string, country?: string) => {
    let timeZone = "America/Santiago"; // Default para Chile
    
    // Mapear países a zonas horarias
    switch (country?.toLowerCase()) {
      case 'chile':
        timeZone = "America/Santiago";
        break;
      case 'argentina':
        timeZone = "America/Argentina/Buenos_Aires";
        break;
      case 'peru':
        timeZone = "America/Lima";
        break;
      case 'colombia':
        timeZone = "America/Bogota";
        break;
      case 'mexico':
        timeZone = "America/Mexico_City";
        break;
      case 'spain':
      case 'españa':
        timeZone = "Europe/Madrid";
        break;
      default:
        timeZone = "America/Santiago"; // Default para Chile
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { 
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Función para verificar si una reserva es válida para el día actual (hasta 23:59)
  const isReservationValidForToday = (checkInDate: string, checkInTime: string, country?: string) => {
    const today = getBusinessDate(country);
    const currentDateTime = getBusinessDateTime(country);
    
    // Si la fecha de check-in es hoy, verificar la hora
    if (checkInDate === today) {
      const [hours, minutes] = checkInTime.split(':').map(Number);
      const reservationTime = new Date(currentDateTime);
      reservationTime.setHours(hours, minutes, 0, 0);
      
      // La reserva es válida si la hora actual es menor o igual a la hora de check-in
      // O si es antes de las 23:59 del día actual
      const currentTime = currentDateTime.getHours() * 60 + currentDateTime.getMinutes();
      const reservationTimeMinutes = hours * 60 + minutes;
      const endOfDayMinutes = 23 * 60 + 59; // 23:59
      
      return currentTime <= endOfDayMinutes;
    }
    
    // Si la fecha de check-in es futura, es válida
    return checkInDate > today;
  };

  useEffect(() => {
    loadFrontDeskData();
  }, []);

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  const loadFrontDeskData = async () => {
    try {
      setLoading(true);

      // Get current user and business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id, country')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) {
        console.error('Error getting business:', businessError);
        alert('Error al obtener información del negocio');
        return;
      }

      setBusinessId(businessData.id);
      setBusinessCountry(businessData.country || 'chile');

      await Promise.all([
        loadRoomStatus(businessData.id),
        loadTodayArrivals(businessData.id),
        loadTodayDepartures(businessData.id)
      ]);

    } catch (error) {
      console.error('Error loading front desk data:', error);
      alert('Error al cargar datos de recepción');
    } finally {
      setLoading(false);
    }
  };

  const loadRoomStatus = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('hl_room_status_simple')
        .select('*')
        .eq('business_id', businessId)
        .order('room_number');

      if (error) {
        console.error('Error loading room status:', error);
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error('Error loading room status:', error);
    }
  };

  const loadTodayArrivals = async (businessId: string) => {
    try {
      console.log('=== LOADING ARRIVALS START ===');
      console.log('Loading arrivals for businessId:', businessId);
      console.log('businessCountry:', businessCountry);
      const today = getBusinessDate(businessCountry);
      console.log('Today date:', today);
      
      // Usar consulta con joins opcionales para obtener datos de huéspedes y habitaciones
      const { data, error } = await supabase
        .from('hl_reservations')
        .select(`
          id,
          check_in_date,
          check_in_time,
          check_out_date,
          check_out_time,
          status,
          total_amount,
          payment_status,
          payment_method,
          primary_guest_id,
          room_id,
          primary_guest_name,
          primary_guest_email,
          primary_guest_phone,
          created_at,
          updated_at,
          hl_guests(
            id,
            name,
            email,
            phone
          ),
          hl_rooms(
            id,
            room_number,
            room_type,
            floor
          )
        `)
        .eq('business_id', businessId);

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error loading arrivals:', error);
        return;
      }

      console.log('Raw reservations data:', data);

      const arrivals = (data || []).filter((r: any) => 
        isReservationValidForToday(r.check_in_date, r.check_in_time || '15:00', businessCountry) && 
        ['pending', 'confirmed'].includes(r.status)
      ).map((r: any) => ({
        reservation_id: r.id,
        guest_name: r.hl_guests?.name || r.primary_guest_name || 'Sin nombre',
        guest_email: r.hl_guests?.email || r.primary_guest_email || '',
        guest_phone: r.hl_guests?.phone || r.primary_guest_phone || '',
        room_number: r.hl_rooms?.room_number || '',
        room_type: r.hl_rooms?.room_type || '',
        check_in_date: r.check_in_date,
        check_in_time: r.check_in_time,
        check_out_date: r.check_out_date,
        check_out_time: r.check_out_time,
        status: r.status,
        total_amount: r.total_amount,
        payment_status: r.payment_status,
        payment_method: r.payment_method,
        number_of_guests: 1, // Valor por defecto
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
      
      // Obtener payment_status para las reservas filtradas
      if (arrivals.length > 0) {
        const reservationIds = arrivals.map((r: any) => r.reservation_id);
        const { data: paymentData, error: paymentError } = await supabase
          .from('hl_reservations')
          .select('id, payment_status, payment_method')
          .in('id', reservationIds);

        if (!paymentError && paymentData) {
          const paymentMap = paymentData.reduce((acc, item) => {
            acc[item.id] = { payment_status: item.payment_status, payment_method: item.payment_method };
            return acc;
          }, {} as any);

          const arrivalsWithPayment = arrivals.map((arrival: any) => ({
            ...arrival,
            payment_status: paymentMap[arrival.reservation_id]?.payment_status || 'pending',
            payment_method: paymentMap[arrival.reservation_id]?.payment_method || null
          }));

          console.log('Arrivals with payment status:', arrivalsWithPayment);
          setTodayArrivals(arrivalsWithPayment);
        } else {
          console.log('Filtered arrivals (no payment data):', arrivals);
          setTodayArrivals(arrivals);
        }
      } else {
        console.log('Filtered arrivals:', arrivals);
        setTodayArrivals(arrivals);
      }
    } catch (error) {
      console.error('=== CATCH ERROR IN LOADING ARRIVALS ===');
      console.error('Error loading arrivals:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'No message');
    }
  };

  const loadTodayDepartures = async (businessId: string) => {
    try {
      console.log('Loading departures for businessId:', businessId);
      const today = getBusinessDate(businessCountry);
      
      // Usar consulta con joins opcionales para obtener datos de huéspedes y habitaciones
      const { data, error } = await supabase
        .from('hl_reservations')
        .select(`
          id,
          check_in_date,
          check_in_time,
          check_out_date,
          check_out_time,
          status,
          total_amount,
          payment_status,
          payment_method,
          primary_guest_id,
          room_id,
          primary_guest_name,
          primary_guest_email,
          primary_guest_phone,
          created_at,
          updated_at,
          hl_guests(
            id,
            name,
            email,
            phone
          ),
          hl_rooms(
            id,
            room_number,
            room_type,
            floor
          )
        `)
        .eq('business_id', businessId);

      console.log('Supabase response departures:', { data, error });

      if (error) {
        console.error('Error loading departures:', error);
        return;
      }

      const departures = (data || []).filter((r: any) => 
        isReservationValidForToday(r.check_out_date, r.check_out_time || '11:00', businessCountry) && 
        r.status === 'checked_in'
      ).map((r: any) => ({
        reservation_id: r.id,
        guest_name: r.hl_guests?.name || r.primary_guest_name || 'Huésped',
        guest_email: r.hl_guests?.email || r.primary_guest_email || '',
        guest_phone: r.hl_guests?.phone || r.primary_guest_phone || '',
        room_number: r.hl_rooms?.room_number || '',
        room_type: r.hl_rooms?.room_type || 'Estándar',
        check_in_date: r.check_in_date,
        check_in_time: r.check_in_time,
        check_out_date: r.check_out_date,
        check_out_time: r.check_out_time,
        status: r.status,
        total_amount: r.total_amount,
        payment_status: r.payment_status,
        payment_method: r.payment_method,
        number_of_guests: 1, // Valor por defecto
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
      
      // Obtener payment_status para las reservas filtradas
      if (departures.length > 0) {
        const reservationIds = departures.map((r: any) => r.reservation_id);
        const { data: paymentData, error: paymentError } = await supabase
          .from('hl_reservations')
          .select('id, payment_status, payment_method')
          .in('id', reservationIds);

        if (!paymentError && paymentData) {
          const paymentMap = paymentData.reduce((acc, item) => {
            acc[item.id] = { payment_status: item.payment_status, payment_method: item.payment_method };
            return acc;
          }, {} as any);

          const departuresWithPayment = departures.map((departure: any) => ({
            ...departure,
            payment_status: paymentMap[departure.reservation_id]?.payment_status || 'pending',
            payment_method: paymentMap[departure.reservation_id]?.payment_method || null
          }));

          setTodayDepartures(departuresWithPayment);
        } else {
          setTodayDepartures(departures);
        }
      } else {
        setTodayDepartures(departures);
      }
    } catch (error) {
      console.error('Error loading departures:', error);
    }
  };

  const handleCheckin = async (reservationId: string, notes?: string) => {
    try {
      setProcessingAction(`checkin_${reservationId}`);
      
      // Verificar si la reserva necesita pago (versión temporal)
      const { data: reservationData, error: reservationError } = await supabase
        .from('hl_reservations')
        .select('total_amount')
        .eq('id', reservationId)
        .single();

      if (reservationError) {
        throw reservationError;
      }

      // Si hay monto, mostrar modal de pago (asumir que no está pagado)
      if (reservationData.total_amount > 0) {
        setPaymentModal({
          show: true,
          reservationId,
          amount: reservationData.total_amount,
          guestName: 'Huésped'
        });
        setProcessingAction('');
        return;
      }

      // Si no necesita pago, proceder con check-in
      const { data, error } = await supabase
        .rpc('checkin_guest_simple', {
          p_reservation_id: reservationId,
          p_notes: notes || null
        });

      if (error) {
        throw error;
      }

      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      alert(`Check-in realizado exitosamente\n${result.message}`);
      await loadFrontDeskData();
      
    } catch (error) {
      console.error('Error during checkin:', error);
      alert(`Error en check-in: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const handleCheckout = async (reservationId: string, notes?: string) => {
    try {
      setProcessingAction(`checkout_${reservationId}`);
      
      const { data, error } = await supabase
        .rpc('checkout_guest_simple', {
          p_reservation_id: reservationId,
          p_notes: notes || null
        });

      if (error) {
        throw error;
      }

      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      alert(`Check-out realizado exitosamente\n${result.message}`);
      await loadFrontDeskData();
      
    } catch (error) {
      console.error('Error during checkout:', error);
      alert(`Error en check-out: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const processPayment = async (paymentMethod: 'cash' | 'card') => {
    try {
      if (!paymentModal.reservationId) return;

      // Usar la función RPC temporal para procesar el pago sin movimientos
      const { data, error } = await supabase
        .rpc('process_reservation_payment_no_movements', {
          p_reservation_id: paymentModal.reservationId,
          p_payment_method: paymentMethod,
          p_notes: `Pago registrado: ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}`
        });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      const paymentMethodText = paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta';
      alert(`¡Pago registrado exitosamente!\n\nMétodo: ${paymentMethodText}\nMonto: ${formatCLP(paymentModal.amount)}\n\n${data.message}\n\nAhora puede proceder con el check-in cuando el huésped llegue.`);
      
      setPaymentModal({
        show: false,
        reservationId: null,
        amount: 0,
        guestName: ''
      });
      
      await loadFrontDeskData();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(`Error al procesar el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const processCheckin = async (reservationId: string) => {
    try {
      setProcessingAction(`checkin_${reservationId}`);

      // Usar la función RPC separada para check-in
      const { data, error } = await supabase
        .rpc('process_checkin', {
          p_reservation_id: reservationId,
          p_notes: 'Check-in realizado desde front desk'
        });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      alert(`¡Check-in completado exitosamente!\n\nHabitación: ${data.room_number}\nHuésped: ${data.guest_name}\n\n${data.message}`);
      
      await loadFrontDeskData();
    } catch (error) {
      console.error('Error processing checkin:', error);
      alert(`Error al realizar check-in: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const handleMarkRoomReady = async (roomId: string, notes?: string) => {
    try {
      setProcessingAction(`ready_${roomId}`);
      
      const { data, error } = await supabase
        .rpc('set_room_ready_simple', {
          p_room_id: roomId,
          p_notes: notes || 'Habitación lista para ocupar'
        });

      if (error) {
        throw error;
      }

      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      alert(`Habitación marcada como disponible\n${result.message}`);
      await loadRoomStatus(businessId);
      
    } catch (error) {
      console.error('Error marking room ready:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <User className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'maintenance': return 'Mantenimiento';
      case 'inactive': return 'Inactiva';
      default: return status;
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.current_guest && room.current_guest.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || room.room_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <HotelLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
            <p className="text-gray4">Cargando información de recepción...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">
              Recepción - Front Desk
            </h1>
            <p className="text-gray4">
              Gestión de check-in, check-out y estado de habitaciones
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Zona horaria: {businessCountry === 'chile' ? 'Chile (CLT/CLST)' : 
                           businessCountry === 'argentina' ? 'Argentina (ART)' :
                           businessCountry === 'peru' ? 'Perú (PET)' :
                           businessCountry === 'colombia' ? 'Colombia (COT)' :
                           businessCountry === 'mexico' ? 'México (CST/CDT)' :
                           businessCountry === 'spain' || businessCountry === 'españa' ? 'España (CET/CEST)' :
                           'Chile (CLT/CLST)'} • {getBusinessDate(businessCountry)} • {getBusinessDateTime(businessCountry).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} • Registro hasta 23:59
            </p>
          </div>
          <Button
            onClick={loadFrontDeskData}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Llegadas Hoy</p>
                <p className="text-2xl font-bold text-blue-600">{todayArrivals.length}</p>
              </div>
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Salidas Hoy</p>
                <p className="text-2xl font-bold text-green-600">{todayDepartures.length}</p>
              </div>
              <LogOut className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Habitaciones Ocupadas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {rooms.filter(r => r.room_status === 'occupied').length}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">
                  {rooms.filter(r => r.room_status === 'available').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rooms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bed className="h-4 w-4 inline mr-2" />
                Estado de Habitaciones
              </button>
              <button
                onClick={() => setActiveTab('arrivals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'arrivals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LogIn className="h-4 w-4 inline mr-2" />
                Llegadas Hoy ({todayArrivals.length})
              </button>
              <button
                onClick={() => setActiveTab('departures')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'departures'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LogOut className="h-4 w-4 inline mr-2" />
                Salidas Hoy ({todayDepartures.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Room Status Tab */}
            {activeTab === 'rooms' && (
              <div>
                {/* Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por habitación o huésped..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="available">Disponible</option>
                    <option value="occupied">Ocupada</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>

                {/* Room Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`border-2 rounded-lg p-4 ${getStatusColor(room.room_status)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(room.room_status)}
                          <h3 className="font-bold text-lg">{room.room_number}</h3>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {getStatusLabel(room.room_status)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>{room.room_type} - Piso {room.floor}</div>
                        <div>Capacidad: {room.capacity} personas</div>
                        
                        {room.current_guest && (
                          <div className="space-y-1 pt-2 border-t border-white border-opacity-30">
                            <div className="font-medium">{room.current_guest}</div>
                            <div className="text-xs">{room.current_guest_count} huéspedes</div>
                            {room.check_in_date && room.check_out_date && (
                              <div className="text-xs">
                                {new Date(room.check_in_date).toLocaleDateString()} - {new Date(room.check_out_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-4 space-y-2">
                        {room.room_status === 'maintenance' && (
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleMarkRoomReady(room.id)}
                            disabled={processingAction === `ready_${room.id}`}
                          >
                            {processingAction === `ready_${room.id}` ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-1" />
                                Marcar Lista
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Arrivals Tab */}
            {activeTab === 'arrivals' && (
              <div className="space-y-4">
                {todayArrivals.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay llegadas programadas para hoy</p>
                  </div>
                ) : (
                  todayArrivals.map((arrival) => (
                    <div key={arrival.reservation_id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">{arrival.guest_name}</h3>
                          <p className="text-blue-700">
                            Habitación {arrival.room_number} ({arrival.room_type})
                          </p>
                          <p className="text-sm text-blue-600">
                            {arrival.number_of_guests} huéspedes • {formatCLP(arrival.total_amount)}
                          </p>
                          <p className="text-xs text-blue-500">{arrival.guest_email}</p>
                        </div>
                        <div className="flex space-x-2">
                          {arrival.payment_status !== 'paid' ? (
                            <Button
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => handleCheckin(arrival.reservation_id)}
                              disabled={processingAction === `checkin_${arrival.reservation_id}`}
                            >
                              {processingAction === `checkin_${arrival.reservation_id}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Cobrar
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => processCheckin(arrival.reservation_id)}
                              disabled={processingAction === `checkin_${arrival.reservation_id}`}
                            >
                              {processingAction === `checkin_${arrival.reservation_id}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <LogIn className="h-4 w-4 mr-2" />
                                  Check-in
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Departures Tab */}
            {activeTab === 'departures' && (
              <div className="space-y-4">
                {todayDepartures.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay salidas programadas para hoy</p>
                  </div>
                ) : (
                  todayDepartures.map((departure) => (
                    <div key={departure.reservation_id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900">{departure.guest_name}</h3>
                          <p className="text-green-700">
                            Habitación {departure.room_number} ({departure.room_type})
                          </p>
                          <p className="text-sm text-green-600">
                            {departure.number_of_guests} huéspedes • {formatCLP(departure.total_amount)}
                          </p>
                          <p className="text-xs text-green-500">{departure.guest_email}</p>
                        </div>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleCheckout(departure.reservation_id)}
                          disabled={processingAction === `checkout_${departure.reservation_id}`}
                        >
                          {processingAction === `checkout_${departure.reservation_id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-2" />
                              Check-out
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {paymentModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💳 Cobro al Check-in
            </h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Huésped:</strong> {paymentModal.guestName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Monto a cobrar:</strong> {formatCLP(paymentModal.amount)}
              </p>
              <p className="text-xs text-gray-500">
                Selecciona el método de pago que utilizó el cliente:
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => processPayment('cash')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <span className="text-2xl mr-3">💵</span>
                <div className="text-left">
                  <div className="font-medium">Efectivo</div>
                  <div className="text-sm opacity-90">Pago en efectivo</div>
                </div>
              </button>
              
              <button
                onClick={() => processPayment('card')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <span className="text-2xl mr-3">💳</span>
                <div className="text-left">
                  <div className="font-medium">Tarjeta</div>
                  <div className="text-sm opacity-90">Débito/Crédito del cliente</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setPaymentModal({ show: false, reservationId: null, amount: 0, guestName: '' })}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </HotelLayout>
  );
}
