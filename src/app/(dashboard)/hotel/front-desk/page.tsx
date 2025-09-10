"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
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
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { formatCLP } from "@/lib/currency";
import LoadingPage from "@/components/ui/loading-page";

interface RoomStatus {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  capacity: number;
  room_status: string;
  status: string;
  is_occupied: boolean;
  is_reserved: boolean;
  is_overdue?: boolean;
  is_checkin_overdue?: boolean;
  overdue_hours?: number;
  overdue_minutes?: number;
  guest_name?: string;
  guest_documents?: string[];
  check_in_date?: string;
  check_out_date?: string;
  reservation_id?: string;
  current_reservation_id?: string;
  current_guest?: string;
  current_guest_email?: string;
  payment_status?: string;
  current_guest_count?: number;
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
  check_in_time?: string;
  check_out_date: string;
  check_out_time?: string;
  status: string;
  number_of_guests: number;
  total_amount: number;
  payment_status?: string;
  payment_method?: string;
}

interface GuestCheckinStatus {
  reservation_id: string;
  passenger_id: string;
  guest_order: number;
  check_in_status: 'pending' | 'checked_in' | 'no_show';
  individual_check_in_time?: string;
  check_in_notes?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_document: string;
  room_number: string;
  room_type: string;
  floor: number;
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
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);
  const [roomMovements, setRoomMovements] = useState<any[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'rooms' | 'arrivals' | 'departures' | 'all' | 'all-reservations' | 'events'>('rooms');
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
  
  // Estados para check-in parcial
  const [guestCheckinStatus, setGuestCheckinStatus] = useState<GuestCheckinStatus[]>([]);
  const [showGuestCheckinModal, setShowGuestCheckinModal] = useState<{
    show: boolean;
    reservationId: string | null;
    guests: GuestCheckinStatus[];
  }>({
    show: false,
    reservationId: null,
    guests: []
  });

  const [checkoutNotesModal, setCheckoutNotesModal] = useState<{
    show: boolean;
    reservationId: string | null;
    overdueMessage: string;
    notes: string;
  }>({
    show: false,
    reservationId: null,
    overdueMessage: '',
    notes: ''
  });

  const [overdueCheckinModal, setOverdueCheckinModal] = useState<{
    show: boolean;
    reservationId: string | null;
    roomNumber: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    actionType: 'no_show' | 'late_arrival' | 'cancelled' | 'checkin';
    notes: string;
    guests: Array<{
      id: string;
      name: string;
      document: string;
      arrived: boolean;
    }>;
  }>({
    show: false,
    reservationId: null,
    roomNumber: '',
    guestName: '',
    checkInDate: '',
    checkOutDate: '',
    actionType: 'checkin',
    notes: '',
    guests: []
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
    
    // Usar toLocaleDateString para obtener la fecha en la zona horaria correcta
    const businessDate = now.toLocaleDateString('en-CA', { timeZone }); // 'en-CA' devuelve YYYY-MM-DD
    
    
    return businessDate;
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
        loadRoomStatus(businessData.id, businessData.country),
        loadTodayArrivals(businessData.id),
        loadTodayDepartures(businessData.id),
        loadAllReservations(businessData.id),
        loadRoomMovements(businessData.id)
      ]);

    } catch (error) {
      console.error('Error loading front desk data:', error);
      alert('Error al cargar datos de recepción');
    } finally {
      setLoading(false);
    }
  };

  const loadRoomStatus = async (businessId: string, country?: string) => {
    try {
      console.log('=== LOADING ROOM STATUS ===');
      console.log('Loading room status for businessId:', businessId);
      
      // Obtener todas las habitaciones activas
      const { data: roomsData, error: roomsError } = await supabase
        .from('hl_rooms')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('room_number');

      if (roomsError) {
        console.error('Error loading rooms:', roomsError);
        return;
      }

      console.log('Rooms data received:', roomsData);
      
      // Obtener TODAS las reservas activas - SIMPLE
      const today = getBusinessDate(country);
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('hl_reservations')
        .select(`
          *,
          hl_reservation_guests(
            hl_guests(
              name,
              document
            )
          )
        `)
        .eq('business_id', businessId)
        .in('status', ['confirmed', 'checked_in', 'pending']);

      if (reservationsError) {
        console.error('Error loading reservations:', reservationsError);
        return;
      }

      console.log('Reservations data received:', reservationsData);
      console.log('=== RESERVATION DATES DEBUG ===');
      console.log('TODAY DATE:', today);
      reservationsData?.forEach((res: any) => {
        console.log(`Reservation ${res.id}: check_in=${res.check_in_date}, check_out=${res.check_out_date}, status=${res.status}, room=${res.room_id}`);
      });
      
      // Combinar datos de habitaciones con estado de ocupación
      const roomsWithStatus = roomsData.map((room: any) => {
        console.log(`\n=== PROCESSING ROOM ${room.room_number} (ID: ${room.id}) ===`);
        
        // PRIORIZAR reservas con check-in hecho, luego las de hoy
        let reservation = reservationsData.find((r: any) => 
          r.room_id === room.id && r.status === 'checked_in'
        );
        
        // Si no hay ninguna con check-in, buscar las de hoy
        if (!reservation) {
          reservation = reservationsData.find((r: any) => 
            r.room_id === room.id && 
            r.check_in_date <= today && 
            r.check_out_date >= today
          );
        }
        
        console.log(`Found reservation for room ${room.room_number}:`, reservation ? {
          id: reservation.id,
          status: reservation.status,
          check_in: reservation.check_in_date,
          check_out: reservation.check_out_date
        } : 'NO RESERVATION FOUND');
        
        // Si hay una reserva con status 'checked_in', SIEMPRE está ocupada
        const is_occupied = reservation?.status === 'checked_in';
        const is_reserved = reservation?.status === 'confirmed' || reservation?.status === 'pending';
        
        // Verificar si hay check-out vencido - CON CÁLCULO DE HORAS
        let is_overdue = false;
        let overdueHours = 0;
        let overdueMinutes = 0;
        
        if (is_occupied && reservation?.check_out_date) {
          const checkoutTime = reservation.check_out_time || '11:00:00';
          // Extraer solo HH:MM (sin segundos)
          const timeOnly = checkoutTime.substring(0, 5);
          
          // Crear fecha límite de check-out - CORREGIDO
          const checkoutDate = new Date(reservation.check_out_date + 'T' + timeOnly + ':00');
          
          // Hora actual - SIMPLE SIN TIMEZONE
          const now = new Date();
          
          console.log(`🔍 HABITACIÓN ${room.room_number}: 
            check_out_date=${reservation.check_out_date}
            check_out_time=${checkoutTime}
            checkoutDate=${checkoutDate.toString()}
            checkoutDate.getTime()=${checkoutDate.getTime()}
            now=${now.toString()}
            now.getTime()=${now.getTime()}`);
          
          if (now > checkoutDate) {
            is_overdue = true;
            const diffMs = now.getTime() - checkoutDate.getTime();
            const totalMinutes = Math.floor(diffMs / (1000 * 60));
            overdueHours = Math.floor(totalMinutes / 60);
            overdueMinutes = totalMinutes % 60;
            
            console.log(`🚨 CÁLCULO DETALLADO:
              diffMs=${diffMs}
              totalMinutes=${totalMinutes}
              overdueHours=${overdueHours}
              overdueMinutes=${overdueMinutes}`);
          }
        }
        
        // Verificar si hay check-in vencido - CON HORA CORREGIDO
        let is_checkin_overdue = false;
        if (is_reserved && reservation?.check_in_date && reservation.check_in_date <= today) {
          const checkinTime = reservation.check_in_time || '15:00:00';
          // Extraer solo HH:MM (sin segundos)
          const timeOnly = checkinTime.substring(0, 5);
          
          // Crear fecha límite de check-in
          const checkinDate = new Date(reservation.check_in_date + 'T' + timeOnly + ':00');
          
          // Hora actual
          const now = new Date();
          
          console.log(`🔍 CHECK-IN HABITACIÓN ${room.room_number}: 
            check_in_date=${reservation.check_in_date}
            check_in_time=${timeOnly}
            checkinDate=${checkinDate.toString()}
            now=${now.toString()}
            is_overdue=${now > checkinDate}`);
          
          is_checkin_overdue = now > checkinDate;
        }
        
        console.log(`Room ${room.room_number}: reservation_id=${reservation?.id}, status=${reservation?.status}, check_out_date=${reservation?.check_out_date}, today=${today}, is_occupied=${is_occupied}, is_reserved=${is_reserved}, is_overdue=${is_overdue}, is_checkin_overdue=${is_checkin_overdue}`);
        
        // Mostrar TODOS los huéspedes de la reserva (separados por |)
        let guestNames = reservation?.primary_guest_name;
        let guestDocuments: string[] = [];
        if (reservation?.hl_reservation_guests && reservation.hl_reservation_guests.length > 0) {
          const allGuests = reservation.hl_reservation_guests
            .map((rg: any) => rg.hl_guests?.name)
            .filter(Boolean);
          if (allGuests.length > 0) {
            guestNames = allGuests.join(' | ');
          }
          
          // Recopilar todos los documentos de los huéspedes
          guestDocuments = reservation.hl_reservation_guests
            .map((rg: any) => rg.hl_guests?.document)
            .filter(Boolean);
        }
        
        return {
          ...room,
          is_occupied,
          is_reserved,
          is_overdue,
          is_checkin_overdue,
          overdue_hours: overdueHours,
          overdue_minutes: overdueMinutes,
          reservation_id: reservation?.id || null,
          guest_name: guestNames || null,
          guest_documents: guestDocuments,
          check_in_date: reservation?.check_in_date || null,
          check_out_date: reservation?.check_out_date || null,
          payment_status: reservation?.payment_status || 'pending'
        };
      });

      console.log('Rooms with status:', roomsWithStatus);
      console.log('Setting rooms state with:', roomsWithStatus?.length, 'rooms');
      setRooms(roomsWithStatus || []);
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
      
      // Consulta simple sin joins para evitar errores de esquema
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
          updated_at
        `)
        .eq('business_id', businessId);

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error loading arrivals:', error);
        return;
      }

      console.log('Raw reservations data:', data);
      console.log('Sample reservation with joins:', data?.[0]);

      console.log('All reservations before filter:', data);
      
      const arrivals = (data || []).filter((r: any) => {
        const hasValidStatus = ['pending', 'confirmed'].includes(r.status);
        // Normalizar fechas para comparación
        const normalizedCheckInDate = r.check_in_date?.split('T')[0] || r.check_in_date;
        const isArrivingToday = normalizedCheckInDate === today;
        console.log(`Reservation ${r.id}: check_in_date=${r.check_in_date}, normalized=${normalizedCheckInDate}, today=${today}, status=${r.status}, isArrivingToday=${isArrivingToday}, hasValidStatus=${hasValidStatus}`);
        return isArrivingToday && hasValidStatus;
      }).map((r: any) => ({
        reservation_id: r.id,
        guest_name: r.primary_guest_name || 'Sin nombre',
        guest_email: r.primary_guest_email || '',
        guest_phone: r.primary_guest_phone || '',
        room_number: '', // Se llenará después con consulta separada
        room_type: '', // Se llenará después con consulta separada
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
      
      // Obtener datos de habitaciones para las reservas filtradas
      if (arrivals.length > 0) {
        const roomIds = arrivals.map((r: any) => r.room_id).filter(Boolean);
        if (roomIds.length > 0) {
          const { data: roomData, error: roomError } = await supabase
            .from('hl_rooms')
            .select('id, room_number, room_type')
            .in('id', roomIds);

          if (!roomError && roomData) {
            const roomMap = roomData.reduce((acc, room) => {
              acc[room.id] = { room_number: room.room_number, room_type: room.room_type };
              return acc;
            }, {} as any);

            arrivals.forEach((arrival: any) => {
              const roomInfo = roomMap[arrival.room_id];
              if (roomInfo) {
                arrival.room_number = roomInfo.room_number;
                arrival.room_type = roomInfo.room_type;
              }
            });
          }
        }
      }
      
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
      console.log('Today date for departures:', today);
      
      // Consulta filtrada para obtener solo las salidas de hoy
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
          updated_at
        `)
        .eq('business_id', businessId)
        .eq('check_out_date', today)
        .eq('status', 'checked_in');

      console.log('Supabase response departures:', { data, error });

      if (error) {
        console.error('Error loading departures:', error);
        return;
      }

      console.log('Departures data (already filtered):', data);
      console.log('Today date for departures:', today);
      
      const departures = (data || []).map((r: any) => ({
        reservation_id: r.id,
        guest_name: r.primary_guest_name || 'Huésped',
        guest_email: r.primary_guest_email || '',
        guest_phone: r.primary_guest_phone || '',
        room_number: '', // Se llenará después con consulta separada
        room_type: 'Estándar', // Valor por defecto
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
      
      // Obtener datos de habitaciones para las reservas filtradas
      if (departures.length > 0) {
        const roomIds = departures.map((r: any) => r.room_id).filter(Boolean);
        if (roomIds.length > 0) {
          const { data: roomData, error: roomError } = await supabase
            .from('hl_rooms')
            .select('id, room_number, room_type')
            .in('id', roomIds);

          if (!roomError && roomData) {
            const roomMap = roomData.reduce((acc, room) => {
              acc[room.id] = { room_number: room.room_number, room_type: room.room_type };
              return acc;
            }, {} as any);

            departures.forEach((departure: any) => {
              const roomInfo = roomMap[departure.room_id];
              if (roomInfo) {
                departure.room_number = roomInfo.room_number;
                departure.room_type = roomInfo.room_type;
              }
            });
          }
        }
      }
      
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
      
      // Verificar información de la reserva
      const { data: reservationData, error: reservationError } = await supabase
        .from('hl_reservations')
        .select('guest_count, status')
        .eq('id', reservationId)
        .single();

      if (reservationError) {
        throw reservationError;
      }

      // Si hay múltiples huéspedes, mostrar modal de check-in parcial
      if (reservationData.guest_count > 1) {
        await showGuestCheckinModalHandler(reservationId);
        setProcessingAction('');
        return;
      }

      // Si es un solo huésped, proceder con check-in directo
      const { data, error } = await supabase
        .rpc('checkin_guest_simple', {
          p_reservation_id: reservationId,
          p_notes: notes || null
        });

      if (error) {
        // Si hay error de constraint, intentar actualizar manualmente el status
        if (error.code === '23514') {
          console.log('Constraint error detected, updating reservation status manually');
          const { error: updateError } = await supabase
            .from('hl_reservations')
            .update({ status: 'checked_in' })
            .eq('id', reservationId);
          
          if (updateError) {
            throw updateError;
          } else {
            alert(`Check-in realizado exitosamente\nReserva actualizada a estado 'checked_in'`);
            await loadFrontDeskData();
            return;
          }
        } else {
        throw error;
        }
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

  const handlePayment = async (reservationId: string) => {
    try {
      setProcessingAction(`payment_${reservationId}`);
      
      // Obtener información de la reservación
      const { data: reservationData, error: reservationError } = await supabase
        .from('hl_reservations')
        .select('total_amount, primary_guest_name, payment_status')
        .eq('id', reservationId)
        .single();

      if (reservationError) {
        throw reservationError;
      }

      // Verificar si ya está pagado
      if (reservationData.payment_status === 'paid') {
        alert('Esta reservación ya está pagada.');
        setProcessingAction('');
        return;
      }

      // Mostrar modal de pago
      setPaymentModal({
        show: true,
        reservationId,
        amount: reservationData.total_amount,
        guestName: reservationData.primary_guest_name || 'Huésped'
      });
      
    } catch (error) {
      console.error('Error during payment:', error);
      alert(`Error al procesar pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const handleCheckout = async (reservationId: string, notes?: string) => {
    try {
      setProcessingAction(`checkout_${reservationId}`);
      
      // Obtener los checkboxes marcados para esta reserva
      const checkedGuests: string[] = [];
      const checkboxes = document.querySelectorAll(`input[id^="departure-guest-${reservationId}-"]:checked`);
      checkboxes.forEach((checkbox) => {
        const id = checkbox.id;
        const guestId = id.split('-').pop();
        if (guestId) {
          checkedGuests.push(guestId);
        }
      });

      // Buscar la reserva completa para obtener datos de huéspedes
      const fullReservation = allReservations.find(r => r.id === reservationId);
      const allGuests = fullReservation?.hl_reservation_guests?.map((rg: any) => rg.hl_guests) || [];

      // Registrar salida de huéspedes marcados
      for (const guestId of checkedGuests) {
        const guest = allGuests.find((g: any) => g.id === guestId);
        if (guest) {
          try {
            const { error: departureError } = await supabase
              .from('hl_checkin_notifications')
              .insert([{
                reservation_id: reservationId,
                guest_id: guest.id,
                guest_name: guest.name,
                guest_document: guest.document,
                arrival_time: new Date().toISOString(),
                status: 'departed',
                notes: 'Check-out realizado desde front-desk'
              }]);

            if (departureError) {
              console.error('Error saving guest departure:', departureError);
            }
          } catch (error) {
            console.error('Error accessing hl_checkin_notifications table:', error);
          }
        }
      }
      
      // Primero, verificar si es un check-out vencido
      const { data: reservationData, error: reservationError } = await supabase
        .from('hl_reservations')
        .select('check_out_date, check_out_time')
        .eq('id', reservationId)
        .single();

      if (reservationError) {
        throw reservationError;
      }

      let finalNotes = notes || '';
      const now = getBusinessDateTime(businessCountry);
      const checkoutDate = new Date(reservationData.check_out_date);
      const checkoutTime = reservationData.check_out_time || '11:00';
      const [checkoutHour, checkoutMinute] = checkoutTime.split(':').map(Number);
      
      // Crear fecha de check-out límite - CORREGIDO
      const timeOnly = checkoutTime.substring(0, 5);
      const checkoutLimit = new Date(reservationData.check_out_date + 'T' + timeOnly + ':00');

      // Verificar si es check-out vencido
      if (now > checkoutLimit) {
        const diffMs = now.getTime() - checkoutLimit.getTime();
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const overdueHours = Math.floor(totalMinutes / 60);
        const overdueMinutes = totalMinutes % 60;
        
        const overdueMessage = `Check-out vencido por ${overdueHours}h ${overdueMinutes}m. `;
        
        console.log(`🔍 POPUP CHECK-OUT: 
          check_out_date=${reservationData.check_out_date}
          check_out_time=${timeOnly}
          checkoutLimit=${checkoutLimit.toString()}
          now=${now.toString()}
          diffMs=${diffMs}
          overdueHours=${overdueHours} overdueMinutes=${overdueMinutes}`);
        
        // Si no hay notas, mostrar modal para solicitar al usuario
        if (!finalNotes) {
          setCheckoutNotesModal({
            show: true,
            reservationId: reservationId,
            overdueMessage: overdueMessage,
            notes: ''
          });
          setProcessingAction('');
          return;
        } else {
          finalNotes = overdueMessage + finalNotes;
        }
      }

      const { data, error } = await supabase
        .rpc('checkout_guest_simple', {
          p_reservation_id: reservationId,
          p_notes: finalNotes
        });

      if (error) {
        throw error;
      }

      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      const departedCount = checkedGuests.length;
      const totalCount = allGuests.length;
      alert(`Check-out realizado exitosamente\n\nRegistro de salida: ${departedCount}/${totalCount} huéspedes salieron\n\n${result.message}`);
      await loadFrontDeskData();
      
    } catch (error) {
      console.error('Error during checkout:', error);
      alert(`Error en check-out: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const processCheckoutWithNotes = async () => {
    try {
      if (!checkoutNotesModal.reservationId) return;

      const finalNotes = checkoutNotesModal.overdueMessage + (checkoutNotesModal.notes || 'Sin notas adicionales');
      
      setCheckoutNotesModal({
        show: false,
        reservationId: null,
        overdueMessage: '',
        notes: ''
      });

      // Continuar con el check-out usando las notas
      await handleCheckout(checkoutNotesModal.reservationId, finalNotes);
      
    } catch (error) {
      console.error('Error processing checkout with notes:', error);
      alert(`Error al procesar check-out: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleOverdueCheckin = async (reservationId: string) => {
    const reservation = rooms.find(r => r.reservation_id === reservationId);
    if (!reservation) return;

    // Cargar huéspedes de la reserva
    const { data: guestsData, error } = await supabase
      .from('hl_reservations')
      .select(`
        hl_reservation_guests(
          hl_guests(
            id,
            name,
            document
          )
        )
      `)
      .eq('id', reservationId)
      .single();

    const guests = guestsData?.hl_reservation_guests?.map((rg: any) => ({
      id: rg.hl_guests.id,
      name: rg.hl_guests.name,
      document: rg.hl_guests.document,
      arrived: false // Inicialmente nadie ha llegado
    })) || [];

    setOverdueCheckinModal({
      show: true,
      reservationId,
      roomNumber: reservation.room_number,
      guestName: reservation.guest_name || '',
      checkInDate: reservation.check_in_date || '',
      checkOutDate: reservation.check_out_date || '',
      actionType: 'checkin',
      notes: '',
      guests
    });
  };

  const processOverdueCheckin = async () => {
    if (!overdueCheckinModal.reservationId) return;
    
    // Solo requerir notas si no es check-in
    if (overdueCheckinModal.actionType !== 'checkin' && !overdueCheckinModal.notes.trim()) {
      alert('Por favor ingrese una nota para esta acción.');
      return;
    }

    try {
      setProcessingAction(`overdue_checkin_${overdueCheckinModal.reservationId}`);

      // Si la acción es check-in, usar la función de check-in normal
      if (overdueCheckinModal.actionType === 'checkin') {
        // Marcar los huéspedes que llegaron como checkboxes en el DOM
        overdueCheckinModal.guests.forEach((guest, index) => {
          if (guest.arrived) {
            const checkbox = document.getElementById(`guest-${guest.id}`) as HTMLInputElement;
            if (checkbox) {
              checkbox.checked = true;
            }
          }
        });
        
        // Llamar a la función de check-in normal
        await handleCheckin(overdueCheckinModal.reservationId, overdueCheckinModal.notes || 'Check-in realizado desde modal de check-in vencido');
        
        // Cerrar el modal
        setOverdueCheckinModal({
          show: false,
          reservationId: null,
          roomNumber: '',
          guestName: '',
          checkInDate: '',
          checkOutDate: '',
          actionType: 'checkin',
          notes: '',
          guests: []
        });
        return;
      }

      // Para otras acciones (no_show, late_arrival, cancelled)
      // Guardar registro de llegada de huéspedes (no reversible)
      // TODO: Crear tabla hl_checkin_notifications en Supabase
      for (const guest of overdueCheckinModal.guests) {
        if (guest.arrived) {
          try {
            const { error: arrivalError } = await supabase
              .from('hl_checkin_notifications')
              .insert([{
                reservation_id: overdueCheckinModal.reservationId,
                guest_id: guest.id,
                guest_name: guest.name,
                guest_document: guest.document,
                arrival_time: new Date().toISOString(),
                status: 'arrived',
                notes: `Registro de llegada - ${overdueCheckinModal.actionType}`
              }]);

            if (arrivalError) {
              console.error('Error saving guest arrival:', arrivalError);
              // Continuar sin fallar si la tabla no existe aún
            }
          } catch (error) {
            console.error('Error accessing hl_checkin_notifications table:', error);
            // Continuar sin fallar si la tabla no existe aún
          }
        }
      }

      const { data, error } = await supabase.rpc('record_overdue_checkin_note', {
        p_reservation_id: overdueCheckinModal.reservationId,
        p_note: overdueCheckinModal.notes,
        p_action_type: overdueCheckinModal.actionType
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        const arrivedCount = overdueCheckinModal.guests.filter(g => g.arrived).length;
        const totalCount = overdueCheckinModal.guests.length;
        
        alert(`${data.message}\n\nRegistro de llegada: ${arrivedCount}/${totalCount} huéspedes llegaron`);
        await loadFrontDeskData();
        
        setOverdueCheckinModal({
          show: false,
          reservationId: null,
          roomNumber: '',
          guestName: '',
          checkInDate: '',
          checkOutDate: '',
          actionType: 'checkin',
          notes: '',
          guests: []
        });
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error processing overdue checkin:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  const loadAllReservations = async (businessId: string) => {
    try {
      console.log('Loading all reservations for businessId:', businessId);
      
      const { data, error } = await supabase
        .from('hl_reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          check_in_time,
          check_out_time,
          status,
          primary_guest_name,
          primary_guest_email,
          primary_guest_phone,
          guest_count,
          total_amount,
          payment_status,
          payment_method,
          special_requests,
          created_at,
          hl_rooms(room_number, room_type, floor),
          hl_reservation_guests(
            hl_guests(
              name,
              document
            )
          )
        `)
        .eq('business_id', businessId)
        .order('check_in_date', { ascending: false });

      if (error) {
        console.error('Error loading all reservations:', error);
        return;
      }

      console.log('All reservations loaded:', data?.length || 0);
      setAllReservations(data || []);
      setFilteredReservations(data || []);
      
    } catch (error) {
      console.error('Error in loadAllReservations:', error);
    }
  };

  const loadRoomMovements = async (businessId: string) => {
    try {
      console.log('Loading room movements for businessId:', businessId);
      
      const { data: movementsData, error: movementsError } = await supabase
        .from('hl_room_movements')
        .select(`
          *,
          hl_rooms(
            room_number,
            room_type
          ),
          hl_reservations(
            primary_guest_name,
            check_in_date,
            check_out_date
          )
        `)
        .eq('business_id', businessId)
        .order('movement_date', { ascending: false })
        .limit(100);

      if (movementsError) {
        console.error('Error loading room movements:', movementsError);
        return;
      }

      console.log('Room movements loaded:', movementsData?.length || 0);
      setRoomMovements(movementsData || []);
      setFilteredMovements(movementsData || []);
    } catch (error) {
      console.error('Error loading room movements:', error);
    }
  };

  // Función para cargar el estado de check-in de los huéspedes
  const loadGuestCheckinStatus = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from('hl_guest_checkin_status')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('guest_order');

      if (error) {
        console.error('Error loading guest checkin status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in loadGuestCheckinStatus:', error);
      return [];
    }
  };

  // Función para manejar check-in parcial de un huésped
  const handlePartialCheckin = async (guestId: string, reservationId: string, notes?: string) => {
    try {
      setProcessingAction(`checkin-${guestId}`);
      
      const { data, error } = await supabase.rpc('partial_checkin_guest', {
        p_reservation_id: reservationId,
        p_guest_id: guestId,
        p_notes: notes || null
      });

      if (error) {
        throw error;
      }

      // La función RPC devuelve un JSON directamente, no un array
      const result = data;
      if (!result || !result.success) {
        throw new Error(result?.message || 'Error desconocido en check-in');
      }

      alert(`Check-in realizado: ${result.message}`);
      
      // Recargar datos
      await loadFrontDeskData();
      
      // Recargar estado de huéspedes si el modal está abierto
      if (showGuestCheckinModal.show) {
        const updatedGuests = await loadGuestCheckinStatus(reservationId);
        setShowGuestCheckinModal(prev => ({
          ...prev,
          guests: updatedGuests
        }));
      }
      
    } catch (error) {
      console.error('Error during partial checkin:', error);
      alert(`Error en check-in: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingAction('');
    }
  };

  // Función para mostrar modal de check-in de huéspedes
  const showGuestCheckinModalHandler = async (reservationId: string) => {
    const guests = await loadGuestCheckinStatus(reservationId);
    setShowGuestCheckinModal({
      show: true,
      reservationId,
      guests
    });
  };

  // Función para ordenar columnas
  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });

    const sortedReservations = [...filteredReservations].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle nested values (like hl_rooms.room_number)
      if (column === 'room_number') {
        aVal = a.hl_rooms?.room_number;
        bVal = b.hl_rooms?.room_number;
      } else if (column === 'room_type') {
        aVal = a.hl_rooms?.room_type;
        bVal = b.hl_rooms?.room_type;
      }

      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Convert to string for comparison
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (direction === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    setFilteredReservations(sortedReservations);
  };

  // Función para filtrar reservas
  const applyFilters = () => {
    let filtered = [...allReservations];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reservation => {
        // Búsqueda en datos principales
        const matchesMain = 
          reservation.primary_guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reservation.primary_guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reservation.hl_rooms?.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reservation.id.toLowerCase().includes(searchTerm.toLowerCase());

        // Búsqueda en documentos de huéspedes
        const matchesDocument = reservation.hl_reservation_guests?.some((rg: any) => {
          const document = rg.hl_guests?.document;
          if (document) {
            return document.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });

        return matchesMain || matchesDocument;
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    setFilteredReservations(filtered);
  };

  // Apply filters when search term or status filter changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, allReservations]);

  // Función para obtener ícono de ordenamiento
  const getSortIcon = (column: string) => {
    if (!sortConfig || sortConfig.column !== column) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-blue-600" />
      : <ArrowDown className="h-3 w-3 text-blue-600" />;
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
      
      // Después del pago, hacer check-in automáticamente
      try {
        const { data: checkinData, error: checkinError } = await supabase
          .rpc('checkin_guest_simple', {
            p_reservation_id: paymentModal.reservationId,
            p_notes: `Check-in automático después de pago con ${paymentMethodText}`
          });

        if (checkinError) {
          console.error('Error during automatic checkin:', checkinError);
          // Si hay error de constraint, intentar actualizar manualmente el status
          if (checkinError.code === '23514') {
            const { error: updateError } = await supabase
              .from('hl_reservations')
              .update({ status: 'checked_in' })
              .eq('id', paymentModal.reservationId);
            
            if (updateError) {
              console.error('Error updating reservation status:', updateError);
              alert(`¡Pago registrado exitosamente!\n\nMétodo: ${paymentMethodText}\nMonto: ${formatCLP(paymentModal.amount)}\n\n${data.message}\n\nError en check-in automático. Puede proceder con el check-in manualmente.`);
            } else {
              alert(`¡Pago y Check-in completados exitosamente!\n\nMétodo: ${paymentMethodText}\nMonto: ${formatCLP(paymentModal.amount)}\n\n${data.message}\n\nCheck-in realizado correctamente.`);
            }
          } else {
            alert(`¡Pago registrado exitosamente!\n\nMétodo: ${paymentMethodText}\nMonto: ${formatCLP(paymentModal.amount)}\n\n${data.message}\n\nError en check-in automático: ${checkinError.message}\n\nPuede proceder con el check-in manualmente.`);
          }
        } else {
          const checkinResult = checkinData[0];
          if (checkinResult.success) {
            alert(`¡Pago y Check-in completados exitosamente!\n\nMétodo: ${paymentMethodText}\nMonto: ${formatCLP(paymentModal.amount)}\n\n${data.message}\n\n${checkinResult.message}`);
          } else {
            alert(`¡Pago registrado exitosamente!\n\nMétodo: ${paymentMethodText}\nMonto: ${formatCLP(paymentModal.amount)}\n\n${data.message}\n\nError en check-in: ${checkinResult.message}\n\nPuede proceder con el check-in manualmente.`);
          }
        }
      } catch (checkinError) {
        console.error('Unexpected error during checkin:', checkinError);
        alert(`¡Pago registrado exitosamente!\n\nMétodo: ${paymentMethodText}\nMonto: ${formatCLP(paymentModal.amount)}\n\n${data.message}\n\nError inesperado en check-in. Puede proceder con el check-in manualmente.`);
      }
      
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

      // Obtener los checkboxes marcados para esta reserva
      const checkedGuests: string[] = [];
      const checkboxes = document.querySelectorAll(`input[id^="guest-${reservationId}-"]:checked`);
      checkboxes.forEach((checkbox) => {
        const id = checkbox.id;
        const guestId = id.split('-').pop();
        if (guestId) {
          checkedGuests.push(guestId);
        }
      });

      // Buscar la reserva completa para obtener datos de huéspedes
      const fullReservation = allReservations.find(r => r.id === reservationId);
      const allGuests = fullReservation?.hl_reservation_guests?.map((rg: any) => rg.hl_guests) || [];

      // Registrar llegada de huéspedes marcados
      for (const guestId of checkedGuests) {
        const guest = allGuests.find((g: any) => g.id === guestId);
        if (guest) {
          try {
            const { error: arrivalError } = await supabase
              .from('hl_checkin_notifications')
              .insert([{
                reservation_id: reservationId,
                guest_id: guest.id,
                guest_name: guest.name,
                guest_document: guest.document,
                arrival_time: new Date().toISOString(),
                status: 'arrived',
                notes: 'Check-in realizado desde front-desk'
              }]);

            if (arrivalError) {
              console.error('Error saving guest arrival:', arrivalError);
            }
          } catch (error) {
            console.error('Error accessing hl_checkin_notifications table:', error);
          }
        }
      }

      // Usar la función RPC correcta para check-in
      const { data, error } = await supabase
        .rpc('checkin_guest_simple', {
          p_reservation_id: reservationId,
          p_notes: 'Check-in realizado desde front desk'
        });

      if (error) {
        // Si hay error de constraint, intentar actualizar manualmente el status
        if (error.code === '23514') {
          console.log('Constraint error detected, updating reservation status manually');
          const { error: updateError } = await supabase
            .from('hl_reservations')
            .update({ status: 'checked_in' })
            .eq('id', reservationId);
          
          if (updateError) {
            throw updateError;
          } else {
            // Continuar con el flujo normal pero con mensaje diferente
            const arrivedCount = checkedGuests.length;
            const totalCount = allGuests.length;
            alert(`¡Check-in completado exitosamente!\n\nReserva actualizada a estado 'checked_in'\n\nRegistro de llegada: ${arrivedCount}/${totalCount} huéspedes llegaron`);
            await loadFrontDeskData();
            return;
          }
        } else {
        throw error;
        }
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      const arrivedCount = checkedGuests.length;
      const totalCount = allGuests.length;
      alert(`¡Check-in completado exitosamente!\n\nHabitación: ${data.room_number}\nHuésped: ${data.guest_name}\n\nRegistro de llegada: ${arrivedCount}/${totalCount} huéspedes llegaron\n\n${data.message}`);
      
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
      case 'reserved': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <User className="h-4 w-4" />;
      case 'reserved': return <Calendar className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'maintenance': return 'Mantenimiento';
      case 'inactive': return 'Inactiva';
      case 'overdue': return 'Check-out Vencido';
      default: return status;
    }
  };

  const getRoomStatus = (room: any) => {
    if (room.is_overdue) return 'overdue';
    if (room.is_occupied) return 'occupied';
    if (room.is_reserved) return 'reserved';
    if (room.status === 'maintenance') return 'maintenance';
    if (room.status === 'inactive') return 'inactive';
    return 'available';
  };

  const filteredRooms = rooms.filter(room => {
    const roomStatus = getRoomStatus(room);
    
    // Búsqueda en número de habitación y nombre del huésped
    const matchesBasic = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (room.guest_name && room.guest_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Búsqueda en documentos de huéspedes
    const matchesDocument = room.guest_documents?.some((doc: string) => 
      doc.toLowerCase().includes(searchTerm.toLowerCase())
    ) || false;
    
    const matchesSearch = matchesBasic || matchesDocument;
    const matchesStatus = statusFilter === 'all' || roomStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  console.log('=== RENDER DEBUG ===');
  console.log('rooms.length:', rooms.length);
  console.log('filteredRooms.length:', filteredRooms.length);
  console.log('searchTerm:', searchTerm);
  console.log('statusFilter:', statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] w-full">
        <LoadingPage message="Cargando información de recepción..." fullScreen={false} />
      </div>
    );
  }

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
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
                <p className="text-2xl font-bold text-green-600">
                  {(() => {
                    console.log('Departures count:', todayDepartures.length, 'Departures data:', todayDepartures);
                    return todayDepartures.length;
                  })()}
                </p>
              </div>
              <LogOut className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Habitaciones Ocupadas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const occupiedCount = rooms.filter(r => r.is_occupied).length;
                    console.log('Occupied rooms count:', occupiedCount, 'Total rooms:', rooms.length);
                    console.log('Rooms with is_occupied=true:', rooms.filter(r => r.is_occupied).map(r => ({ room_number: r.room_number, is_occupied: r.is_occupied, status: r.status })));
                    return occupiedCount;
                  })()}
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
                  {rooms.filter(r => !r.is_occupied && !r.is_reserved).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Check-out Vencido</p>
                <p className="text-2xl font-bold text-red-600">
                  {rooms.filter(r => r.is_overdue).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
              <button
                onClick={() => setActiveTab('all-reservations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all-reservations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Todas las Reservas
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Eventos
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
                      placeholder="Buscar por habitación, huésped o documento..."
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
                    <option value="reserved">Reservada</option>
                    <option value="overdue">Check-out Vencido</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>

                {/* Room Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                  {filteredRooms.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">No hay habitaciones para mostrar</p>
                    </div>
                  ) : (
                    filteredRooms.map((room) => {
                    const roomStatus = getRoomStatus(room);
                    return (
                      <div
                        key={room.id}
                        className={`border-2 rounded-lg p-4 flex flex-col h-full ${room.is_overdue ? 'bg-red-100 border-red-500 border-4' : getStatusColor(roomStatus)}`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(roomStatus)}
                            <h3 className="font-bold text-lg">{room.room_number}</h3>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                            {getStatusLabel(roomStatus)}
                          </span>
                        </div>
                      
                        {/* Content - grows to fill space */}
                        <div className="flex-1 space-y-2 text-sm">
                        <div>{room.room_type} - Piso {room.floor}</div>
                        <div>Capacidad: {room.capacity} personas</div>
                        
                        {room.guest_name && (
                          <div className="space-y-1 pt-2 border-t border-white border-opacity-30">
                            <div className="font-medium">{room.guest_name}</div>
                              <div className="text-xs">{room.guest_name.split(' | ').length} huésped{room.guest_name.split(' | ').length > 1 ? 'es' : ''}</div>
                              <div className="text-xs">
                                {room.check_in_date && room.check_out_date ? (
                                  <>
                                    {room.check_in_date} - {room.check_out_date}
                                  </>
                                ) : (
                                  <div className="text-gray-500">Sin fechas</div>
                                )}
                                
                                {/* Alerta de check-out vencido - CON HORAS TRANSCURRIDAS */}
                                {room.is_overdue && (
                                  <div className="bg-red-600 text-white font-bold p-2 rounded mt-2 text-center animate-pulse">
                                    CHECK-OUT VENCIDO
                                    <div className="text-xs mt-1">
                                      Vencido por {room.overdue_hours || 0}h {room.overdue_minutes || 0}m
                                  </div>
                              </div>
                            )}
                              </div>
                          </div>
                        )}
                      </div>
                      
                        {/* Action Buttons - aligned to bottom */}
                      <div className="mt-4 space-y-2">
                        {room.is_occupied && room.reservation_id && (
                          room.payment_status === 'paid' ? (
                          <Button
                            size="sm"
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => room.reservation_id && handleCheckout(room.reservation_id)}
                            disabled={processingAction === `checkout_${room.reservation_id}`}
                          >
                            {processingAction === `checkout_${room.reservation_id}` ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <LogOut className="h-4 w-4 mr-1" />
                                Check-out
                              </>
                            )}
                          </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => room.reservation_id && handlePayment(room.reservation_id)}
                              disabled={processingAction === `payment_${room.reservation_id}`}
                            >
                              {processingAction === `payment_${room.reservation_id}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Procesar Pago
                                </>
                              )}
                            </Button>
                          )
                        )}
                        
                        {room.is_reserved && room.reservation_id && (
                          room.is_checkin_overdue ? (
                            <div className="space-y-2">
                            <Button
                              size="sm"
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => room.reservation_id && handleOverdueCheckin(room.reservation_id)}
                              disabled={processingAction === `overdue_checkin_${room.reservation_id}`}
                            >
                              {processingAction === `overdue_checkin_${room.reservation_id}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Check-in Vencido
                                </>
                              )}
                            </Button>
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => room.reservation_id && handlePayment(room.reservation_id)}
                                disabled={processingAction === `payment_${room.reservation_id}`}
                              >
                                {processingAction === `payment_${room.reservation_id}` ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <>
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Procesar Pago
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                            <Button
                              size="sm"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => room.reservation_id && handleCheckin(room.reservation_id)}
                              disabled={processingAction === `checkin_${room.reservation_id}`}
                            >
                              {processingAction === `checkin_${room.reservation_id}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <LogIn className="h-4 w-4 mr-1" />
                                  Check-in
                                </>
                              )}
                            </Button>
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => room.reservation_id && handlePayment(room.reservation_id)}
                                disabled={processingAction === `payment_${room.reservation_id}`}
                              >
                                {processingAction === `payment_${room.reservation_id}` ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <>
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Procesar Pago
                                  </>
                                )}
                              </Button>
                            </div>
                          )
                        )}
                        
                        {room.status === 'maintenance' && (
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
                  );
                  })
                  )}
                </div>
              </div>
            )}

            {/* Arrivals Tab */}
            {activeTab === 'arrivals' && (
              <div>
                {todayArrivals.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay llegadas programadas para hoy</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Habitación</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Huéspedes</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {todayArrivals.map((arrival) => {
                            const fullReservation = allReservations.find(r => r.id === arrival.reservation_id);
                            const allGuests = fullReservation?.hl_reservation_guests?.map((rg: any) => rg.hl_guests) || [];
                            const actualGuestCount = allGuests.length || arrival.number_of_guests;
                            
                            return (
                              <tr key={arrival.reservation_id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                      {arrival.room_number || fullReservation?.hl_rooms?.room_number || 'N/A'}
                        </div>
                                    <div className="text-sm text-gray-600">
                                      {arrival.room_type || fullReservation?.hl_rooms?.room_type || 'Tipo N/A'}
                                    </div>
                                    {fullReservation?.hl_rooms?.floor && (
                                      <div className="text-xs text-gray-500">
                                        Piso {fullReservation.hl_rooms.floor}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-900">
                                    {allGuests.length > 0 ? (
                                      <div className="space-y-2">
                                        {allGuests.map((guest: any, index: number) => (
                                          <div key={guest?.id || index} className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              id={`guest-${arrival.reservation_id}-${guest?.id || index}`}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                              defaultChecked={index === 0} // Huésped principal marcado por defecto
                                            />
                                            <label htmlFor={`guest-${arrival.reservation_id}-${guest?.id || index}`} className="flex-1">
                                              <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                <span className="text-sm">{guest?.name || 'Sin nombre'}</span>
                                                <span className="text-xs text-gray-500">({guest?.document || 'Sin doc'})</span>
                                                {index === 0 && (
                                                  <span className="text-xs text-blue-600 font-medium">Principal</span>
                                                )}
                                              </div>
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500">
                                        {actualGuestCount} huésped{actualGuestCount > 1 ? 'es' : ''}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{arrival.check_in_date}</div>
                                  <div className="text-sm text-gray-500">{(arrival as any).check_in_time?.substring(0, 5)}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{formatCLP(arrival.total_amount)}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    arrival.payment_status === 'paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {arrival.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {arrival.payment_status !== 'paid' ? (
                            <Button
                                      size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => handleCheckin(arrival.reservation_id)}
                              disabled={processingAction === `checkin_${arrival.reservation_id}`}
                            >
                              {processingAction === `checkin_${arrival.reservation_id}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                          <DollarSign className="h-4 w-4 mr-1" />
                                  Cobrar
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                                      size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => processCheckin(arrival.reservation_id)}
                              disabled={processingAction === `checkin_${arrival.reservation_id}`}
                            >
                              {processingAction === `checkin_${arrival.reservation_id}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                          <LogIn className="h-4 w-4 mr-1" />
                                  Check-in
                                </>
                              )}
                            </Button>
                          )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                        </div>
                      </div>
                )}
              </div>
            )}

            {/* Departures Tab */}
            {activeTab === 'departures' && (
              <div>
                {todayDepartures.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay salidas programadas para hoy</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Habitación</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Huéspedes</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {todayDepartures.map((departure) => {
                            const fullReservation = allReservations.find(r => r.id === departure.reservation_id);
                            const allGuests = fullReservation?.hl_reservation_guests?.map((rg: any) => rg.hl_guests) || [];
                            const actualGuestCount = allGuests.length || departure.number_of_guests;
                            
                            return (
                              <tr key={departure.reservation_id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                      {departure.room_number || fullReservation?.hl_rooms?.room_number || 'N/A'}
                        </div>
                                    <div className="text-sm text-gray-600">
                                      {departure.room_type || fullReservation?.hl_rooms?.room_type || 'Tipo N/A'}
                                    </div>
                                    {fullReservation?.hl_rooms?.floor && (
                                      <div className="text-xs text-gray-500">
                                        Piso {fullReservation.hl_rooms.floor}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-900">
                                    {allGuests.length > 0 ? (
                                      <div className="space-y-2">
                                        {allGuests.map((guest: any, index: number) => (
                                          <div key={guest?.id || index} className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              id={`departure-guest-${departure.reservation_id}-${guest?.id || index}`}
                                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                              defaultChecked={true} // Todos marcados por defecto para check-out
                                            />
                                            <label htmlFor={`departure-guest-${departure.reservation_id}-${guest?.id || index}`} className="flex-1">
                                              <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                <span className="text-sm">{guest?.name || 'Sin nombre'}</span>
                                                <span className="text-xs text-gray-500">({guest?.document || 'Sin doc'})</span>
                                                {index === 0 && (
                                                  <span className="text-xs text-green-600 font-medium">Principal</span>
                                                )}
                                              </div>
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500">
                                        {actualGuestCount} huésped{actualGuestCount > 1 ? 'es' : ''}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{departure.check_out_date}</div>
                                  <div className="text-sm text-gray-500">{(departure as any).check_out_time?.substring(0, 5)}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{formatCLP(departure.total_amount)}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Check-in
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                                    size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleCheckout(departure.reservation_id)}
                          disabled={processingAction === `checkout_${departure.reservation_id}`}
                        >
                          {processingAction === `checkout_${departure.reservation_id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                                        <LogOut className="h-4 w-4 mr-1" />
                              Check-out
                            </>
                          )}
                        </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                )}
              </div>
            )}

            {/* All Reservations Tab */}
            {activeTab === 'all-reservations' && (
              <div className="space-y-6">
                {/* Header con filtros */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Todas las Reservas</h2>
                    <div className="text-sm text-gray-500 mt-1">
                      Mostrando {filteredReservations.length} de {allReservations.length} reservas
                    </div>
                  </div>
                  
                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por huésped, email, habitación, documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                      />
                    </div>
                    
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="checked_in">Check-in</option>
                        <option value="checked_out">Check-out</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="pending">Pendiente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {allReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay reservas registradas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('id')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Reserva ID</span>
                              {getSortIcon('id')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('room_number')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Habitación</span>
                              {getSortIcon('room_number')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('primary_guest_name')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Huésped</span>
                              {getSortIcon('primary_guest_name')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('check_in_date')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Check-in</span>
                              {getSortIcon('check_in_date')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('check_out_date')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Check-out</span>
                              {getSortIcon('check_out_date')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Estado</span>
                              {getSortIcon('status')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('guest_count')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Huéspedes</span>
                              {getSortIcon('guest_count')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('total_amount')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Total</span>
                              {getSortIcon('total_amount')}
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('payment_status')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Pago</span>
                              {getSortIcon('payment_status')}
                            </div>
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th 
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort('created_at')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Creada</span>
                              {getSortIcon('created_at')}
                            </div>
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredReservations.map((reservation) => {
                          const today = getBusinessDate(businessCountry);
                          const now = getBusinessDateTime(businessCountry);
                          
                          // Check-out vencido: validar fecha Y hora (11:00) - CORREGIDO
                          let isOverdueCheckout = false;
                          let overdueHours = 0;
                          let overdueMinutes = 0;
                          if (reservation.status === 'checked_in') {
                            const checkoutTime = reservation.check_out_time || '11:00:00';
                            const timeOnly = checkoutTime.substring(0, 5);
                            
                            // Crear fecha límite de check-out correctamente
                            const checkoutLimit = new Date(reservation.check_out_date + 'T' + timeOnly + ':00');
                            
                            isOverdueCheckout = now > checkoutLimit;
                            if (isOverdueCheckout) {
                              const diffMs = now.getTime() - checkoutLimit.getTime();
                              const totalMinutes = Math.floor(diffMs / (1000 * 60));
                              overdueHours = Math.floor(totalMinutes / 60);
                              overdueMinutes = totalMinutes % 60;
                            }
                            
                            console.log(`🔍 TABLA CHECK-OUT ${reservation.room_number}: 
                              check_out_date=${reservation.check_out_date}
                              check_out_time=${timeOnly}
                              checkoutLimit=${checkoutLimit.toString()}
                              now=${now.toString()}
                              is_overdue=${isOverdueCheckout}
                              hours=${overdueHours} minutes=${overdueMinutes}`);
                          }
                          
                          // Check-in vencido: validar fecha Y hora (15:00) - CORREGIDO
                          let isOverdueCheckin = false;
                          if (reservation.status === 'confirmed' && reservation.check_in_date <= today) {
                            const checkinTime = reservation.check_in_time || '15:00:00';
                            const timeOnly = checkinTime.substring(0, 5);
                            
                            // Crear fecha límite de check-in correctamente
                            const checkinLimit = new Date(reservation.check_in_date + 'T' + timeOnly + ':00');
                            
                            isOverdueCheckin = now > checkinLimit;
                            
                            console.log(`🔍 TABLA CHECK-IN ${reservation.room_number}: 
                              check_in_date=${reservation.check_in_date}
                              check_in_time=${timeOnly}
                              checkinLimit=${checkinLimit.toString()}
                              now=${now.toString()}
                              is_overdue=${isOverdueCheckin}`);
                          }
                          
                          return (
                          <tr key={reservation.id} className={`hover:bg-gray-50 transition-colors ${
                            isOverdueCheckout ? 'bg-red-50 border-l-4 border-red-400' :
                            isOverdueCheckin ? 'bg-orange-50 border-l-4 border-orange-400' : ''
                          }`}>
                            <td className="px-2 py-2 text-xs text-gray-900 font-mono">
                              <div className="flex items-center space-x-2">
                                <span>{reservation.id.slice(-8)}</span>
                                {(isOverdueCheckout || isOverdueCheckin) && (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <div className="font-medium text-gray-900">
                                {reservation.hl_rooms?.room_number}
                              </div>
                              <div className="text-xs text-gray-500">
                                {reservation.hl_rooms?.room_type} • Piso {reservation.hl_rooms?.floor}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <div className="font-medium text-gray-900 whitespace-pre-line">
                                {(() => {
                                  // Mostrar TODOS los huéspedes de la reserva (uno debajo del otro)
                                  let guestNames = reservation.primary_guest_name;
                                  if (reservation.hl_reservation_guests && reservation.hl_reservation_guests.length > 0) {
                                    const allGuests = reservation.hl_reservation_guests
                                      .map((rg: any) => rg.hl_guests?.name)
                                      .filter(Boolean);
                                    if (allGuests.length > 0) {
                                      guestNames = allGuests.join('\n');
                                    }
                                  }
                                  return guestNames;
                                })()}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <div className={`${isOverdueCheckin ? 'text-orange-700 font-bold' : 'text-gray-900'}`}>
                                {reservation.check_in_date}
                              </div>
                              <div className="text-xs text-gray-500">{reservation.check_in_time}</div>
                              {isOverdueCheckin && (
                                <div className="text-xs text-orange-600 font-medium mt-1">
                                  ⚠️ Check-in vencido
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <div className={`${isOverdueCheckout ? 'text-red-700 font-bold' : 'text-gray-900'}`}>
                                {reservation.check_out_date}
                              </div>
                              <div className="text-xs text-gray-500">{reservation.check_out_time}</div>
                              {isOverdueCheckout && (
                                <div className="text-xs text-red-600 font-medium mt-1">
                                  🔴 Check-out vencido por {overdueHours}h {overdueMinutes}m
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                reservation.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                                reservation.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
                                reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {reservation.status === 'confirmed' ? 'Confirmada' :
                                 reservation.status === 'checked_in' ? 'Check-in' :
                                 reservation.status === 'checked_out' ? 'Check-out' :
                                 reservation.status === 'cancelled' ? 'Cancelada' :
                                 reservation.status}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-sm text-gray-900 text-center">
                              {reservation.guest_count}
                            </td>
                            <td className="px-2 py-2 text-sm font-medium text-gray-900">
                              {formatCLP(reservation.total_amount)}
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                reservation.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                reservation.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {reservation.payment_status === 'paid' ? 'Pagado' :
                                 reservation.payment_status === 'pending' ? 'Pendiente' :
                                 'Sin pagar'}
                              </span>
                              {reservation.payment_method && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {reservation.payment_method === 'cash' ? 'Efectivo' :
                                   reservation.payment_method === 'card' ? 'Tarjeta' :
                                   reservation.payment_method}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <div className="text-gray-900">{reservation.primary_guest_email}</div>
                              <div className="text-xs text-gray-500">{reservation.primary_guest_phone}</div>
                            </td>
                            <td className="px-2 py-2 text-xs text-gray-500">
                              {reservation.created_at.split('T')[0]}
                            </td>
                            <td className="px-2 py-2 text-sm">
                              <div className="flex flex-col space-y-1">
                                {isOverdueCheckout && (
                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2"
                                    onClick={() => handleCheckout(reservation.id)}
                                    disabled={processingAction === `checkout_${reservation.id}`}
                                  >
                                    {processingAction === `checkout_${reservation.id}` ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <LogOut className="h-3 w-3 mr-1" />
                                        Check-out
                                      </>
                                    )}
                                  </Button>
                                )}
                                {isOverdueCheckin && (
                                  <Button
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 px-2"
                                    onClick={() => handleOverdueCheckin(reservation.id)}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    Gestionar
                                  </Button>
                                )}
                                {!isOverdueCheckout && !isOverdueCheckin && reservation.status === 'confirmed' && (
                                  <span className="text-xs text-gray-500">Sin acciones</span>
                                )}
                                {reservation.status === 'checked_in' && !isOverdueCheckout && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2"
                                    onClick={() => handleCheckout(reservation.id)}
                                    disabled={processingAction === `checkout_${reservation.id}`}
                                  >
                                    <LogOut className="h-3 w-3 mr-1" />
                                    Check-out
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Eventos de Habitaciones</h2>
                    <div className="text-sm text-gray-500 mt-1">
                      Mostrando {filteredMovements.length} eventos (últimos 100)
                    </div>
                  </div>
                </div>

                {/* Events Table */}
                {filteredMovements.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay eventos registrados</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha/Hora
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Habitación
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Evento
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Huésped
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notas
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredMovements.map((movement) => (
                            <tr key={movement.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="text-gray-900">
                                  {formatBusinessDate(movement.movement_date?.split('T')[0] || '', businessCountry)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {movement.movement_date ? new Date(movement.movement_date).toLocaleTimeString('es-CL', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) : ''}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="text-gray-900 font-medium">
                                  {movement.hl_rooms?.room_number || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {movement.hl_rooms?.room_type || ''}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  movement.movement_type === 'checkin' 
                                    ? 'bg-green-100 text-green-800' 
                                    : movement.movement_type === 'checkout' 
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {movement.movement_type === 'checkin' && '📥 Check-in'}
                                  {movement.movement_type === 'checkout' && '📤 Check-out'}
                                  {movement.movement_type !== 'checkin' && movement.movement_type !== 'checkout' && movement.movement_type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="text-gray-900">
                                  {movement.hl_reservations?.primary_guest_name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {movement.hl_reservations?.check_in_date && movement.hl_reservations?.check_out_date && 
                                    `${formatBusinessDate(movement.hl_reservations.check_in_date, businessCountry)} - ${formatBusinessDate(movement.hl_reservations.check_out_date, businessCountry)}`
                                  }
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                                <div className="truncate" title={movement.notes || ''}>
                                  {movement.notes || 'Sin notas'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
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

      {/* Modal de Notas para Check-out Vencido */}
      {checkoutNotesModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4">
              ⚠️ Check-out Vencido
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-red-600 mb-2">
                {checkoutNotesModal.overdueMessage}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Por favor, ingrese una nota explicando el motivo del retraso:
              </p>
            </div>

            <textarea
              value={checkoutNotesModal.notes}
              onChange={(e) => setCheckoutNotesModal(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ej: Huésped solicitó extensión por emergencia familiar..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />

            <div className="flex space-x-3 mt-6">
              <button
                onClick={processCheckoutWithNotes}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Confirmar Check-out
              </button>
              <button
                onClick={() => setCheckoutNotesModal({
                  show: false,
                  reservationId: null,
                  overdueMessage: '',
                  notes: ''
                })}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check-in Vencido */}
      {overdueCheckinModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">
              ⚠️ Check-in Vencido
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-orange-600 mb-2">
                Habitación {overdueCheckinModal.roomNumber}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Reserva: {overdueCheckinModal.checkInDate} al {overdueCheckinModal.checkOutDate}
              </p>
              {overdueCheckinModal.guestName && (
                <p className="text-sm text-gray-700 mb-2 font-medium">
                  Huésped: {overdueCheckinModal.guestName}
                </p>
              )}
              
              {/* Lista de huéspedes con checkboxes */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Registro de llegada de huéspedes:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {overdueCheckinModal.guests.map((guest, index) => (
                    <div key={guest.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`guest-${guest.id}`}
                        checked={guest.arrived}
                        onChange={(e) => {
                          const newGuests = [...overdueCheckinModal.guests];
                          newGuests[index].arrived = e.target.checked;
                          setOverdueCheckinModal(prev => ({ ...prev, guests: newGuests }));
                        }}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`guest-${guest.id}`} className="text-sm text-gray-700 flex-1">
                        <div className="font-medium">{guest.name}</div>
                        <div className="text-xs text-gray-500">{guest.document}</div>
                      </label>
                      {guest.arrived && (
                        <span className="text-xs text-green-600 font-medium">✓ Llegó</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Indicador de huéspedes faltantes */}
                {overdueCheckinModal.guests.some(g => !g.arrived) && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="text-xs text-yellow-700">
                        Faltan {overdueCheckinModal.guests.filter(g => !g.arrived).length} huésped{overdueCheckinModal.guests.filter(g => !g.arrived).length > 1 ? 'es' : ''} por llegar
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Por favor, seleccione la acción y ingrese una nota:
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Acción:</label>
              <select 
                value={overdueCheckinModal.actionType || 'no_show'} 
                onChange={(e) => setOverdueCheckinModal(prev => ({ ...prev, actionType: e.target.value as 'no_show' | 'late_arrival' | 'cancelled' | 'checkin' }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="checkin">Realizar Check-in</option>
                <option value="late_arrival">Confirmar llegada tardía</option>
                <option value="no_show">No se presentó</option>
                <option value="cancelled">Cancelar reserva</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nota:</label>
              <textarea
                value={overdueCheckinModal.notes || ''}
                onChange={(e) => setOverdueCheckinModal(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ej: Cliente no se presentó, sin comunicación previa..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={processOverdueCheckin}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Confirmar
              </button>
              <button
                onClick={() => setOverdueCheckinModal({
                  show: false,
                  reservationId: null,
                  roomNumber: '',
                  guestName: '',
                  checkInDate: '',
                  checkOutDate: '',
                  actionType: 'checkin',
                  notes: '',
                  guests: []
                })}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check-in de Huéspedes */}
      {showGuestCheckinModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-blue-900">
                🏨 Check-in de Huéspedes
              </h3>
              <button
                onClick={() => setShowGuestCheckinModal({ show: false, reservationId: null, guests: [] })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona los huéspedes que han llegado. Puedes hacer check-in individual o de todos a la vez.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {showGuestCheckinModal.guests.map((guest, index) => (
                <div 
                  key={guest.passenger_id} 
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    guest.check_in_status === 'checked_in' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          guest.check_in_status === 'checked_in' ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {guest.guest_name}
                            {guest.guest_order === 1 && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Principal
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {guest.guest_email} • {guest.guest_phone}
                          </p>
                          <p className="text-xs text-gray-500">
                            Documento: {guest.guest_document}
                          </p>
                          {guest.check_in_status === 'checked_in' && guest.individual_check_in_time && (
                            <p className="text-xs text-green-600 mt-1">
                              ✅ Check-in: {new Date(guest.individual_check_in_time).toLocaleString('es-ES')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {guest.check_in_status === 'pending' && (
                        <button
                          onClick={() => handlePartialCheckin(guest.passenger_id, guest.reservation_id)}
                          disabled={processingAction === `checkin-${guest.passenger_id}`}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                        >
                          {processingAction === `checkin-${guest.passenger_id}` ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Procesando...
                            </div>
                          ) : (
                            'Check-in'
                          )}
                        </button>
                      )}
                      
                      {guest.check_in_status === 'checked_in' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-lg">
                          ✅ Ingresado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowGuestCheckinModal({ show: false, reservationId: null, guests: [] })}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={async () => {
                  // Check-in de todos los huéspedes pendientes
                  const pendingGuests = showGuestCheckinModal.guests.filter(g => g.check_in_status === 'pending');
                  for (const guest of pendingGuests) {
                    await handlePartialCheckin(guest.passenger_id, guest.reservation_id);
                  }
                }}
                disabled={showGuestCheckinModal.guests.every(g => g.check_in_status === 'checked_in')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Check-in Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}