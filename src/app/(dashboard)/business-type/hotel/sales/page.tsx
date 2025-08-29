"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
import { Button } from "@/components/ui/button";
import { formatCLP } from "@/lib/currency";
import { 
  Bed, 
  User, 
  Calendar, 
  Clock, 
  CreditCard, 

  Users,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
  price: number;
  capacity: number;
  description?: string;
}

interface Guest {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
}

interface GuestData {
  guests: Guest[];
  primaryGuestIndex: number; // Index of the primary guest (first one)
}

interface Reservation {
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  guests: number;
  selectedRoom: Room | null;
  totalAmount: number;
  netAmount: number;
  ivaAmount: number;
  specialRequests: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomCalendar, setRoomCalendar] = useState<{[key: string]: any[]}>({});
  const [occupiedDates, setOccupiedDates] = useState<{[key: string]: string[]}>({});
  const [roomOccupancy, setRoomOccupancy] = useState<{[key: string]: {
    today: boolean, 
    tomorrow: boolean,
    todayStatus: string,
    tomorrowStatus: string,
    todayGuestName: string,
    tomorrowGuestName: string
  }}>({});
  const [calendarMonth, setCalendarMonth] = useState<{year: number, month: number}>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  
  // No external animation hooks needed
  
  // Form states
  const [guestData, setGuestData] = useState<GuestData>({
    guests: [{
      name: '',
      email: '',
      phone: '',
      document: '',
      address: ''
    }],
    primaryGuestIndex: 0
  });
  // Phone UI states for all guests
  const [guestPhoneStates, setGuestPhoneStates] = useState<{[key: number]: {countryCode: string, localPhone: string}}>({
    0: { countryCode: "+56", localPhone: "" }
  });

  // Country codes with flags
  const countryOptions = [
    { code: "+56", flag: "🇨🇱", name: "Chile" },
    { code: "+57", flag: "🇨🇴", name: "Colombia" },
    { code: "+51", flag: "🇵🇪", name: "Perú" },
    { code: "+54", flag: "🇦🇷", name: "Argentina" },
    { code: "+55", flag: "🇧🇷", name: "Brasil" },
    { code: "+598", flag: "🇺🇾", name: "Uruguay" },
    { code: "+593", flag: "🇪🇨", name: "Ecuador" },
    { code: "+58", flag: "🇻🇪", name: "Venezuela" },
    { code: "+595", flag: "🇵🇾", name: "Paraguay" },
    { code: "+591", flag: "🇧🇴", name: "Bolivia" },
    { code: "+1", flag: "🇺🇸", name: "Estados Unidos" },
    { code: "+52", flag: "🇲🇽", name: "México" },
    { code: "+34", flag: "🇪🇸", name: "España" },
    { code: "+33", flag: "🇫🇷", name: "Francia" },
    { code: "+49", flag: "🇩🇪", name: "Alemania" },
    { code: "+44", flag: "🇬🇧", name: "Reino Unido" },
    { code: "+39", flag: "🇮🇹", name: "Italia" },
    { code: "+81", flag: "🇯🇵", name: "Japón" },
    { code: "+86", flag: "🇨🇳", name: "China" },
    { code: "+91", flag: "🇮🇳", name: "India" }
  ];
  
  const [reservation, setReservation] = useState<Reservation>({
    checkIn: '',
    checkOut: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    guests: 1,
    selectedRoom: null,
    totalAmount: 0,
    netAmount: 0,
    ivaAmount: 0,
    specialRequests: ''
  });

  // SII Configuration state
  const [siiConfig, setSiiConfig] = useState<{
    iva_incluido: boolean;
  }>({
    iva_incluido: true
  });

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadRooms();
    loadRoomOccupancy();
    loadSIIConfig();
  }, []);

  // Reload rooms when dates change
  useEffect(() => {
    if (reservation.checkIn && reservation.checkOut) {
      loadRooms(reservation.checkIn, reservation.checkOut);
    }
  }, [reservation.checkIn, reservation.checkOut]);

  // Load calendar when room is selected or month changes
  useEffect(() => {
    if (reservation.selectedRoom) {
      loadRoomCalendar(reservation.selectedRoom.id, calendarMonth);
    }
  }, [reservation.selectedRoom, calendarMonth]);

  useEffect(() => {
    if (reservation.selectedRoom && reservation.checkIn && reservation.checkOut) {
      calculateTotal();
    }
  }, [reservation.selectedRoom, reservation.checkIn, reservation.checkOut, reservation.guests, siiConfig.iva_incluido]);

  // Update step based on form completion
  useEffect(() => {
    if (reservation.selectedRoom) {
      setStep(2);
    }
    if (reservation.selectedRoom && reservation.checkIn && reservation.checkOut) {
      setStep(3);
    }
  }, [reservation.selectedRoom, reservation.checkIn, reservation.checkOut]);

  // Sync guest count with room capacity and adjust guestData accordingly
  useEffect(() => {
    if (reservation.selectedRoom) {
      const capacity = reservation.selectedRoom.capacity;
      
      // Only set initial guest count if this is the first time selecting a room
      if (!reservation.selectedRoom) {
        setReservation(prev => ({ ...prev, guests: capacity }));
      }
      
      // Adjust guestData to match current guest count (not necessarily capacity)
      const currentGuestCount = guestData.guests.length;
      const targetGuestCount = reservation.guests;
      
      if (currentGuestCount < targetGuestCount) {
        // Add more guest slots
        const newGuests = Array(targetGuestCount - currentGuestCount).fill(null).map(() => ({
          name: '',
          email: '',
          phone: '',
          document: '',
          address: ''
        }));
        setGuestData(prev => ({
          ...prev,
          guests: [...prev.guests, ...newGuests]
        }));
        
        // Initialize phone states for new guests
        setGuestPhoneStates(prev => {
          const newStates = { ...prev };
          for (let i = currentGuestCount; i < targetGuestCount; i++) {
            newStates[i] = { countryCode: "+56", localPhone: "" };
          }
          return newStates;
        });
      } else if (currentGuestCount > targetGuestCount) {
        // Remove excess guest slots, but keep at least one
        const newGuests = guestData.guests.slice(0, Math.max(1, targetGuestCount));
        setGuestData(prev => ({
          ...prev,
          guests: newGuests,
          primaryGuestIndex: Math.min(prev.primaryGuestIndex, newGuests.length - 1)
        }));
        
        // Clean up phone states for removed guests
        setGuestPhoneStates(prev => {
          const newStates = { ...prev };
          for (let i = targetGuestCount; i < currentGuestCount; i++) {
            delete newStates[i];
          }
          return newStates;
        });
      }
    }
  }, [reservation.selectedRoom, reservation.guests]);

  // ---------- Helper: Name capitalization ----------
  const capitalizeFullName = (value: string): string => {
    return value
      .toLowerCase()
      .split(/\s+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  // ---------- Helpers: RUT (Chile) ----------
  const cleanRut = (rut: string): string => rut.replace(/\./g, '').replace(/-/g, '').replace(/\s/g, '').toLowerCase();
  const computeRutDv = (rutDigits: string): string => {
    let sum = 0;
    let multiplier = 2;
    for (let i = rutDigits.length - 1; i >= 0; i--) {
      sum += parseInt(rutDigits[i], 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'k';
    return String(remainder);
  };
  const isValidRut = (value: string): boolean => {
    const cleaned = cleanRut(value);
    if (!/^\d{7,8}[0-9k]$/.test(cleaned)) return false;
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return computeRutDv(body) === dv;
  };
  const formatRut = (value: string): string => {
    const cleaned = cleanRut(value);
    if (cleaned.length < 2) return value;
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    // Add dots and hyphen
    const reversed = body.split('').reverse().join('');
    const chunks = reversed.match(/.{1,3}/g) || [];
    const withDots = chunks.join('.').split('').reverse().join('');
    return `${withDots}-${dv}`.toUpperCase();
  };
  
  // Smart document formatting - only format if it's a valid RUT
  const formatDocument = (value: string): string => {
    // If it looks like a RUT and is valid, format it
    if (isValidRut(value)) {
      return formatRut(value);
    }
    // Otherwise, return as-is (no formatting)
    return value;
  };

  // ---------- Helpers: Phone ----------
  const normalizePhone = (code: string, local: string): string => {
    const onlyDigits = local.replace(/\D/g, '');
    return `${code}${onlyDigits ? onlyDigits : ''}`;
  };
  const parsePhone = (full: string): { code: string; local: string } => {
    if (!full) return { code: "+56", local: '' };
    
    // Casos específicos para códigos de país comunes
    if (full.startsWith('+56')) {
      // Chile: +56 seguido del número local
      const local = full.substring(3).replace(/\D/g, '');
      return { code: '+56', local };
    } else if (full.startsWith('+1')) {
      // USA/Canada: +1 seguido del número local
      const local = full.substring(2).replace(/\D/g, '');
      return { code: '+1', local };
    } else if (full.startsWith('+')) {
      // Otros códigos: intentar separar correctamente
      // Para códigos de 2 dígitos como +54, +52, etc.
      const match = full.match(/^(\+\d{2})(.+)$/);
      if (match) {
        const code = match[1];
        const local = (match[2] || '').replace(/\D/g, '');
        return { code, local };
      }
      // Para códigos de 3 dígitos como +234, +351, etc.
      const match3 = full.match(/^(\+\d{3})(.+)$/);
      if (match3) {
        const code = match3[1];
        const local = (match3[2] || '').replace(/\D/g, '');
        return { code, local };
      }
    }
    
    // Si no tiene código de país, asumir +56 y usar todo como número local
    const localNumber = full.replace(/\D/g, '');
    return { code: "+56", local: localNumber };
  };

  // Keep all guest phones synced with UI phone pieces
  useEffect(() => {
    setGuestData(prev => ({
      ...prev,
      guests: prev.guests.map((g, i) => {
        const phoneState = guestPhoneStates[i];
        if (phoneState) {
          const normalizedPhone = normalizePhone(phoneState.countryCode, phoneState.localPhone);
          return { ...g, phone: normalizedPhone };
        }
        return g;
      })
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestPhoneStates]);

  // ---------- Autocomplete from passengers ----------
  let autocompleteTimer: ReturnType<typeof setTimeout> | undefined;
  // Estados para el modal de autocompletado
  const [autocompleteModal, setAutocompleteModal] = useState<{
    show: boolean;
    guestIndex: number;
    foundData: any;
    currentData: any;
  }>({
    show: false,
    guestIndex: 0,
    foundData: null,
    currentData: null
  });



  const triggerAutocomplete = (document: string, guestIndex: number = 0) => {
    if (autocompleteTimer) clearTimeout(autocompleteTimer);
    autocompleteTimer = setTimeout(async () => {
      try {
        // Limpiar documento para búsqueda (sin formato)
        const cleanedDocument = cleanRut(document);
        
        // Solo autocompletar si hay documento limpio y tiene al menos 8 caracteres
        if (!cleanedDocument || cleanedDocument.length < 8) return;
        
        const formattedDocument = formatDocument(cleanedDocument);
        
        // Obtener datos actuales del huésped
        const currentGuest = guestData.guests[guestIndex];
        const hasCurrentData = currentGuest.name || currentGuest.email || currentGuest.phone || currentGuest.address;
        
        // Buscar tanto con formato como sin formato
        const { data, error } = await supabase
          .from('hl_guests')
          .select('name,email,phone,document,address')
          .or(`document.eq.${cleanedDocument},document.eq.${formattedDocument}`)
          .limit(1)
          .maybeSingle();
        
        if (!error && data) {
          // Si hay datos actuales, mostrar modal de confirmación
          if (hasCurrentData) {
            setAutocompleteModal({
              show: true,
              guestIndex,
              foundData: data,
              currentData: currentGuest
            });
          } else {
            // Si no hay datos actuales, aplicar directamente
            applyAutocompleteData(data, guestIndex);
          }
        }
      } catch (error) {
        console.error('Error en autocompletado:', error);
      }
    }, 800); // Mayor delay para documento
  };

  const applyAutocompleteData = (data: any, guestIndex: number) => {
    const parsed = parsePhone(data.phone || '');
    
    // Update phone UI for the specific guest
    setGuestPhoneStates(prev => ({
      ...prev,
      [guestIndex]: {
        countryCode: parsed.code || '+56',
        localPhone: parsed.local || ''
      }
    }));
    
    setGuestData(prev => ({
      ...prev,
      guests: prev.guests.map((g, i) => 
        i === guestIndex ? {
          ...g,
          name: capitalizeFullName(data.name || ''),
          email: (data.email || '').toLowerCase(),
          phone: data.phone || g.phone,
          document: data.document ? formatDocument(data.document) : g.document, // Mostrar con formato
          address: data.address || ''
        } : g
      )
    }));
  };

  const handleAutocompleteConfirm = (useFoundData: boolean) => {
    if (useFoundData && autocompleteModal.foundData) {
      applyAutocompleteData(autocompleteModal.foundData, autocompleteModal.guestIndex);
    }
    setAutocompleteModal({ show: false, guestIndex: 0, foundData: null, currentData: null });
  };



  const loadRoomCalendar = async (roomId: string, targetMonth?: {year: number, month: number}) => {
    try {
      console.log('Loading calendar for room:', roomId);
      
      // Use target month or current calendar month
      const monthToLoad = targetMonth || calendarMonth;
      const startDate = new Date(monthToLoad.year, monthToLoad.month, 1).toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('get_room_availability_calendar', {
        p_room_id: roomId,
        p_start_date: startDate
      });

      if (error) {
        console.error('Error loading room calendar:', error);
        return;
      }

      console.log('Calendar data received:', data);
      
      // Verificar si hay error en la respuesta
      if (data && data.error) {
        console.error('Error from calendar function:', data.error);
        return;
      }
      
      // Asegurar que data sea un array
      const calendarArray = Array.isArray(data) ? data : [];
      
      setRoomCalendar(prev => ({
        ...prev,
        [roomId]: calendarArray
      }));

      // Extract occupied dates for date input blocking
      const occupied = calendarArray
        .filter((day: any) => !day.is_available)
        .map((day: any) => day.date_value);
      
      setOccupiedDates(prev => ({
        ...prev,
        [roomId]: occupied
      }));
    } catch (error) {
      console.error('Error in loadRoomCalendar:', error);
    }
  };

  // Navigation functions for calendar
  const goToPreviousMonth = () => {
    const newMonth = new Date(calendarMonth.year, calendarMonth.month - 1, 1);
    const newCalendarMonth = {
      year: newMonth.getFullYear(),
      month: newMonth.getMonth()
    };
    setCalendarMonth(newCalendarMonth);
    
    // Reload calendar for the selected room
    if (reservation.selectedRoom) {
      loadRoomCalendar(reservation.selectedRoom.id, newCalendarMonth);
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 1);
    const newCalendarMonth = {
      year: newMonth.getFullYear(),
      month: newMonth.getMonth()
    };
    setCalendarMonth(newCalendarMonth);
    
    // Reload calendar for the selected room
    if (reservation.selectedRoom) {
      loadRoomCalendar(reservation.selectedRoom.id, newCalendarMonth);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    const currentMonth = {
      year: now.getFullYear(),
      month: now.getMonth()
    };
    setCalendarMonth(currentMonth);
    
    // Reload calendar for the selected room
    if (reservation.selectedRoom) {
      loadRoomCalendar(reservation.selectedRoom.id, currentMonth);
    }
  };

  const loadRooms = async (checkInDate?: string, checkOutDate?: string) => {
    try {
      setLoading(true);
      
      // Get current user's business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        setLoading(false);
        return;
      }

      // Get business info
      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id, business_name')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) {
        console.error('Error fetching business:', businessError);
        setLoading(false);
        return;
      }

      let roomsData;
      let roomsError;

      // If dates are provided, get only available rooms for those dates
      if (checkInDate && checkOutDate) {
        const { data, error } = await supabase.rpc('get_available_rooms', {
          p_business_id: businessData.id,
          p_check_in_date: checkInDate,
          p_check_out_date: checkOutDate
        });
        roomsData = data;
        roomsError = error;
      } else {
        // Load all active rooms (for initial load without dates)
        const { data, error } = await supabase
          .from('hl_rooms')
          .select('*')
          .eq('business_id', businessData.id)
          .eq('status', 'active')
          .order('room_number');
        roomsData = data;
        roomsError = error;
      }

      if (roomsError) {
        console.error('Error loading rooms:', roomsError);
        setLoading(false);
        return;
      }

      const transformedRooms: Room[] = (roomsData || []).map((room: any) => ({
        id: room.room_id || room.id,
        number: room.room_number,
        type: room.room_type,
        floor: room.floor,
        price: room.price,
        capacity: room.capacity,
        description: room.description || '',
        status: 'available' // All returned rooms are available for the selected dates
      }));

      setRooms(transformedRooms);
      setAvailableRooms(transformedRooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setLoading(false);
    }
  };

  // Function to get minimum date in business timezone (Chile)
  const getMinDate = () => {
    const now = new Date();
    
    // Get current date in Chile timezone using Intl.DateTimeFormat
    const chileDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    
    // Check if we can sell for today (until 23:59 Chile time)
    const chileTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Santiago"}));
    const chileHour = chileTime.getHours();
    const isBeforeEndOfDay = chileHour < 23 || (chileHour === 23 && chileTime.getMinutes() <= 59);
    
    // If we can still sell for today, use today's date. Otherwise, use tomorrow.
    let minDate = chileDate;
    if (!isBeforeEndOfDay) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      minDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(tomorrow);
    }
    
    console.log('Min date calculation (final):', {
      nowUTC: now.toISOString(),
      chileDate,
      chileHour,
      isBeforeEndOfDay,
      minDate,
      chileTimeString: now.toLocaleString("en-US", {timeZone: "America/Santiago"})
    });
    
    return minDate;
  };

  // Function to check if current time allows sales for today (until 23:59 Chile time)
  const canSellForToday = () => {
    const now = new Date();
    const chileTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Santiago"}));
    const chileHour = chileTime.getHours();
    const chileMinute = chileTime.getMinutes();
    
    // Allow sales until 23:59 Chile time
    const isBeforeEndOfDay = chileHour < 23 || (chileHour === 23 && chileMinute <= 59);
    
    console.log('Can sell for today check:', {
      chileHour,
      chileMinute,
      isBeforeEndOfDay,
      chileTimeString: chileTime.toString()
    });
    
    return isBeforeEndOfDay;
  };

  // Function to check if a room is available for a specific date range
  const isRoomAvailableForDates = async (roomId: string, checkInDate: string, checkOutDate: string) => {
    try {
      const { data: conflictingReservations } = await supabase
        .from('hl_reservations')
        .select('id, check_in_date, check_out_date, status')
        .eq('room_id', roomId)
        .not('status', 'in', '(cancelled,completed)')
        .or(`check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate}`);

      return !conflictingReservations || conflictingReservations.length === 0;
    } catch (error) {
      console.error('Error checking room availability:', error);
      return false;
    }
  };

  const loadRoomOccupancy = async () => {
    try {
      // Get current user's business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get business info
      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id, country')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) return;

      // Get today and tomorrow dates in business timezone
      const getBusinessDate = (country?: string) => {
        const now = new Date();
        let timeZone = "America/Santiago"; // Default para Chile
        
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
            timeZone = "America/Santiago";
        }
        
        // Corregido: usar directamente la fecha en la zona horaria del negocio
        const businessDate = new Date(now.toLocaleString("en-US", {timeZone}));
        const year = businessDate.getFullYear();
        const month = String(businessDate.getMonth() + 1).padStart(2, '0');
        const day = String(businessDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const today = getBusinessDate(businessData.country);
      
      // Calculate tomorrow in business timezone
      const getTomorrowDate = (country?: string) => {
        const now = new Date();
        let timeZone = "America/Santiago"; // Default para Chile
        
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
            timeZone = "America/Santiago";
        }
        
        // Corregido: calcular mañana en la zona horaria del negocio
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowBusinessDate = new Date(tomorrow.toLocaleString("en-US", {timeZone}));
        const year = tomorrowBusinessDate.getFullYear();
        const month = String(tomorrowBusinessDate.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrowBusinessDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const tomorrowStr = getTomorrowDate(businessData.country);

      console.log('Room occupancy dates:', { 
        today, 
        tomorrow: tomorrowStr, 
        country: businessData.country,
        currentTime: new Date().toISOString(),
        currentTimeChile: new Date().toLocaleString("en-US", {timeZone: "America/Santiago"})
      });

      // Use the new RPC function to get occupancy status
      const { data: occupancyData, error: occupancyError } = await supabase
        .rpc('get_room_occupancy_status', {
          p_business_id: businessData.id,
          p_date: today
        });

      if (occupancyError) {
        console.error('Error loading room occupancy:', occupancyError);
        return;
      }

      console.log('Occupancy data received:', occupancyData);

      // Transform the data to match the expected format
      const occupancyStatus: {[key: string]: {
        today: boolean, 
        tomorrow: boolean,
        todayStatus: string,
        tomorrowStatus: string,
        todayGuestName: string,
        tomorrowGuestName: string
      }} = {};

      if (occupancyData) {
        occupancyData.forEach((room: any) => {
          occupancyStatus[room.room_id] = {
            today: room.today_status !== 'available',
            tomorrow: room.tomorrow_status !== 'available',
            todayStatus: room.today_status,
            tomorrowStatus: room.tomorrow_status,
            todayGuestName: room.today_guest_name,
            tomorrowGuestName: room.tomorrow_guest_name
          };
        });
      }

      setRoomOccupancy(occupancyStatus);
    } catch (error) {
      console.error('Error loading room occupancy:', error);
    }
  };

  const loadSIIConfig = async () => {
    try {
      // Get current user and business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuario no autenticado');
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError || !businessData) {
        console.warn('No se pudo obtener la información del negocio');
        return;
      }

      // Load SII configuration
      const { data: siiData, error: siiError } = await supabase
        .from('hl_sii_config')
        .select('iva_incluido')
        .eq('business_id', businessData.id)
        .single();

      if (siiError && siiError.code !== 'PGRST116') { // Not found is OK
        console.warn('Error loading SII config:', siiError);
        return;
      }

      if (siiData) {
        setSiiConfig(siiData);
      }
    } catch (error) {
      console.error('Error loading SII config:', error);
    }
  };

  const calculateTotal = () => {
    if (!reservation.selectedRoom || !reservation.checkIn || !reservation.checkOut) {
      setReservation(prev => ({ 
        ...prev, 
        totalAmount: 0, 
        netAmount: 0, 
        ivaAmount: 0 
      }));
      return;
    }

    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    
    // Validate dates
    if (checkOut <= checkIn) {
      console.warn('Check-out date must be after check-in date');
      setReservation(prev => ({ 
        ...prev, 
        totalAmount: 0, 
        netAmount: 0, 
        ivaAmount: 0 
      }));
      return;
    }
    
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      console.warn('Invalid number of nights:', nights);
      setReservation(prev => ({ 
        ...prev, 
        totalAmount: 0, 
        netAmount: 0, 
        ivaAmount: 0 
      }));
      return;
    }
    
    const baseAmount = reservation.selectedRoom.price * nights;
    const ivaRate = 0.19; // 19% IVA en Chile
    
    let netAmount, ivaAmount, totalAmount;
    
    if (siiConfig.iva_incluido) {
      // El precio ya incluye IVA
      totalAmount = baseAmount;
      netAmount = totalAmount / (1 + ivaRate);
      ivaAmount = totalAmount - netAmount;
    } else {
      // El precio es neto, agregar IVA
      netAmount = baseAmount;
      ivaAmount = netAmount * ivaRate;
      totalAmount = netAmount + ivaAmount;
    }
    
    console.log('Calculating total with IVA:', { 
      checkIn: reservation.checkIn, 
      checkOut: reservation.checkOut, 
      nights, 
      price: reservation.selectedRoom.price, 
      baseAmount,
      netAmount,
      ivaAmount,
      totalAmount,
      ivaIncluido: siiConfig.iva_incluido
    });
    
    setReservation(prev => ({ 
      ...prev, 
      totalAmount: Math.round(totalAmount),
      netAmount: Math.round(netAmount),
      ivaAmount: Math.round(ivaAmount)
    }));
  };

  const validateStep = (currentStep: number) => {
    const newErrors: {[key: string]: string} = {};

    if (currentStep === 1) {
      if (!reservation.selectedRoom) newErrors.room = 'Debe seleccionar una habitación';
    }

    if (currentStep === 2) {
      if (!reservation.checkIn) newErrors.checkIn = 'La fecha de check-in es requerida';
      if (!reservation.checkOut) newErrors.checkOut = 'La fecha de check-out es requerida';
      if (reservation.checkIn && reservation.checkOut) {
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        if (checkOut <= checkIn) {
          newErrors.checkOut = 'La fecha de check-out debe ser posterior al check-in';
        }
      }
      if (reservation.guests < 1) newErrors.guests = 'Debe haber al menos 1 huésped';
    }

    if (currentStep === 3) {
      // Validate all guests
      guestData.guests.forEach((guest, index) => {
        if (!guest.name.trim()) newErrors[`name_${index}`] = 'El nombre es requerido';
        if (!guest.email.trim()) newErrors[`email_${index}`] = 'El email es requerido';
        if (!guest.phone.trim()) newErrors[`phone_${index}`] = 'El teléfono es requerido';
        if (!guest.document.trim()) newErrors[`document_${index}`] = 'El documento es requerido';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveReservation = async () => {
    if (!validateStep(step)) return;

    setSaving(true);
    try {
      // Get current user and business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError || !businessData) {
        throw new Error('No se pudo obtener la información del negocio');
      }

      // Prepare guests data for the function
      const guestsForReservation = guestData.guests.slice(0, reservation.guests).map(guest => ({
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        document: cleanRut(guest.document), // Guardar sin formato (sin puntos ni guión)
        address: guest.address
      }));

      // Validate dates before sending
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      
      if (checkOut <= checkIn) {
        throw new Error('La fecha de check-out debe ser posterior a la fecha de check-in');
      }

      const requestData = {
        p_business_id: businessData.id,
        p_room_id: reservation.selectedRoom?.id,
        p_check_in_date: reservation.checkIn,
        p_check_in_time: reservation.checkInTime,
        p_check_out_date: reservation.checkOut,
        p_check_out_time: reservation.checkOutTime,
        p_guest_count: reservation.guests,
        p_guests: guestsForReservation,
        p_total_amount: reservation.totalAmount,
        p_net_amount: reservation.netAmount,
        p_iva_amount: reservation.ivaAmount,
        p_special_requests: reservation.specialRequests || null
      };

      console.log('Sending reservation data:', requestData);
      console.log('💾 Guest documents (cleaned for DB):', guestsForReservation.map(g => ({ 
        name: g.name, 
        document: g.document,
        original: guestData.guests.find(og => og.name === g.name)?.document 
      })));

      // Call the PostgreSQL function to create reservation with guests
      const { data, error } = await supabase.rpc('create_reservation_with_guests', requestData);

      if (error) {
        console.error('Error calling create_reservation_with_guests:', error);
        throw new Error(`Error al crear la reserva: ${error.message}`);
      }

      console.log('Reservation created successfully:', data);
      
      // Verificar si la reserva se creó exitosamente
      if (!data || !data.success) {
        throw new Error(data?.error || 'Error desconocido al crear la reserva');
      }
      
      // Determinar si es venta directa o reserva futura
      const checkInDate = new Date(reservation.checkIn);
      const today = new Date();
      const isToday = checkInDate.toDateString() === today.toDateString();
      const isTomorrow = checkInDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
      
      // Crear reserva sin procesar pago automáticamente
      // El pago se procesará en recepción al momento del check-in
      if (reservation.totalAmount > 0) {
        const checkInFormatted = checkInDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        alert(`¡Reserva creada exitosamente!\n\nID: ${data.reservation_id}\nCheck-in: ${checkInFormatted}\n\n💳 El pago se procesará en recepción al momento del check-in.`);
        resetForm();
      } else {
        // Reserva gratuita
        alert('¡Reserva creada exitosamente! ID: ' + data.reservation_id);
        resetForm();
      }
      
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert(`Error al crear la reserva: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };



  const resetForm = () => {
    setGuestData({
      guests: [{
        name: '',
        email: '',
        phone: '',
        document: '',
        address: ''
      }],
      primaryGuestIndex: 0
    });
    setReservation({
      checkIn: '',
      checkOut: '',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      guests: 1,
      selectedRoom: null,
      totalAmount: 0,
      netAmount: 0,
      ivaAmount: 0,
      specialRequests: ''
    });
    setStep(1);
    setGuestPhoneStates({
      0: { countryCode: "+56", localPhone: "" }
    });
  };

  const getRoomTypeLabel = (type: string) => {
    const types: {[key: string]: string} = {
      'single': 'Individual',
      'double': 'Doble',
      'triple': 'Triple',
      'quad': 'Cuádruple',
      'suite': 'Suite',
      'family': 'Familiar'
    };
    return types[type] || type;
  };

  // Function to get disabled dates for date inputs
  const getDisabledDates = (roomId: string): string => {
    if (!occupiedDates[roomId]) return '';
    
    // Convert occupied dates to a format that can be used to disable date inputs
    return occupiedDates[roomId].join(',');
  };

  // Function to check if a date is occupied
  const isDateOccupied = (roomId: string, date: string): boolean => {
    if (!occupiedDates[roomId]) return false;
    return occupiedDates[roomId].includes(date);
  };

  const groupRoomsByFloor = (rooms: Room[]) => {
    const grouped = rooms.reduce((acc, room) => {
      if (!acc[room.floor]) {
        acc[room.floor] = [];
      }
      acc[room.floor].push(room);
      return acc;
    }, {} as { [key: number]: Room[] });
    
    // Sort floors and rooms within each floor
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .reduce((acc, floor) => {
        acc[floor] = grouped[floor].sort((a, b) => 
          parseInt(a.number) - parseInt(b.number)
        );
        return acc;
      }, {} as { [key: number]: Room[] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray9 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <HotelLayout>
      <div className="w-full h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">

            <div>
              <h1 className="text-3xl font-bold text-blue1 font-title">
                Venta de Habitaciones
              </h1>
              <p className="text-gray4">
                Crear nueva reserva de habitación
              </p>
            </div>
          </div>
        </div>



        {/* Progress Steps */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue8' : 'text-gray4'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                step >= 1 ? 'bg-blue8 text-white scale-110' : 'bg-gray8 text-gray4'
              }`}>
                {step >= 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="font-medium">Selección de Habitación</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 transition-all duration-500 ${step >= 2 ? 'bg-blue8' : 'bg-gray8'}`}></div>
            
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue8' : 'text-gray4'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                step >= 2 ? 'bg-blue8 text-white scale-110' : 'bg-gray8 text-gray4'
              }`}>
                {step >= 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="font-medium">Fechas y Huéspedes</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 transition-all duration-500 ${step >= 3 ? 'bg-blue8' : 'bg-gray8'}`}></div>
            
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue8' : 'text-gray4'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                step >= 3 ? 'bg-blue8 text-white scale-110' : 'bg-gray8 text-gray4'
              }`}>
                {step >= 3 ? <CheckCircle className="h-4 w-4" /> : '3'}
              </div>
              <span className="font-medium">Datos del Huésped</span>
            </div>
          </div>
        </div>

        {/* Dynamic Layout with Pure CSS Transitions */}
        <div 
          className={`grid gap-4 transition-all duration-700 ease-out ${
            !reservation.selectedRoom 
              ? 'grid-cols-1' 
              : reservation.checkIn && reservation.checkOut 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          
          {/* Column 1: Room Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6 transition-all duration-500 ease-out hover:shadow-lg hover:scale-[1.02]">
            {!reservation.selectedRoom ? (
              // Full width room selection
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-blue1 flex items-center">
                    <Bed className="h-5 w-5 mr-2" />
                    Selecciona una Habitación
                  </h2>
                  {reservation.checkIn && reservation.checkOut && (
                    <p className="text-sm text-green-600 mt-2 flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Mostrando solo habitaciones disponibles del {new Date(reservation.checkIn).toLocaleDateString('es-ES')} al {new Date(reservation.checkOut).toLocaleDateString('es-ES')}
                    </p>
                  )}
                  
                  {/* Occupancy Legend */}
                  <div className="border border-gray8 rounded-lg px-4 py-3 mt-4">
                    <div className="flex items-center justify-center space-x-6 flex-wrap">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Disponible</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Reservado hoy</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Reservado hoy y otras fechas</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Ocupado hoy</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Ocupado hoy y otras fechas</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {availableRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                    <p className="text-gray4">
                      {reservation.checkIn && reservation.checkOut 
                        ? `No hay habitaciones disponibles para las fechas seleccionadas (${new Date(reservation.checkIn).toLocaleDateString('es-ES')} - ${new Date(reservation.checkOut).toLocaleDateString('es-ES')})`
                        : 'No hay habitaciones disponibles'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupRoomsByFloor(availableRooms)).map(([floor, floorRooms]) => (
                      <div key={floor} className="space-y-4">
                        {/* Floor Header */}
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-bold text-blue1">Piso {floor}</h3>
                          <div className="flex-1 h-px bg-gray8"></div>
                        </div>
                        
                        {/* Rooms Grid for this floor */}
                        <div 
                          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
                        >
                          {floorRooms.map((room) => {
                            const occupancy = roomOccupancy[room.id] || { 
                              today: false, 
                              tomorrow: false,
                              todayStatus: 'available',
                              tomorrowStatus: 'available',
                              todayGuestName: '',
                              tomorrowGuestName: ''
                            };
                            const hasOccupancy = occupancy.today || occupancy.tomorrow;
                            
                            // Determine border color based on status
                            const getBorderColor = () => {
                              return 'border-gray8 hover:border-blue8';
                            };
                            
                            return (
                              <div
                                key={room.id}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-400 ease-out hover:shadow-xl hover:scale-102 hover:-translate-y-2 relative ${getBorderColor()}`}
                                onClick={() => setReservation({...reservation, selectedRoom: room})}
                              >
                                {/* Occupancy indicators */}
                                <div className="absolute top-2 right-2">
                                  {(() => {
                                    // Lógica para determinar el estado único de la habitación
                                    if (occupancy.todayStatus === 'occupied') {
                                      // Ocupado hoy
                                      if (occupancy.tomorrowStatus === 'reserved') {
                                        return <div className="w-4 h-4 bg-blue-500 rounded-full"></div>; // Ocupado hoy y otras fechas
                                      } else {
                                        return <div className="w-4 h-4 bg-red-500 rounded-full"></div>; // Ocupado hoy, disponible otras fechas
                                      }
                                    } else if (occupancy.todayStatus === 'reserved') {
                                      // Reservado hoy
                                      if (occupancy.tomorrowStatus === 'reserved') {
                                        return <div className="w-4 h-4 bg-purple-500 rounded-full"></div>; // Reservado hoy y otras fechas
                                      } else {
                                        return <div className="w-4 h-4 bg-orange-500 rounded-full"></div>; // Reservado hoy, disponible otras fechas
                                      }
                                    } else {
                                      // Sin reservas hoy
                                      return <div className="w-4 h-4 bg-green-500 rounded-full"></div>; // Disponible
                                    }
                                  })()}
                                </div>
                                
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-bold text-blue1">Habitación {room.number}</h3>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm text-gray4">{getRoomTypeLabel(room.type)}</p>
                                  <span className="text-sm text-gray4">Piso {room.floor}</span>
                                </div>
                                <p className="text-sm text-gray4 mb-2">Capacidad: {room.capacity} personas</p>
                                
                                <p className="text-lg font-bold text-green-600 mb-2">{formatCLP(room.price)}/noche</p>
                                
                                {/* Occupancy warning */}
                                {hasOccupancy && (
                                  <div className={`rounded-lg p-2 mb-2 ${
                                    occupancy.todayStatus === 'occupied' || occupancy.tomorrowStatus === 'occupied'
                                      ? 'bg-red-100 border border-red-300'
                                      : 'bg-white border border-orange-600'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
                                        occupancy.todayStatus === 'occupied' || occupancy.tomorrowStatus === 'occupied'
                                          ? 'text-red-600'
                                          : 'text-orange-600'
                                      }`} />
                                      <span className={`text-xs font-medium truncate ${
                                        occupancy.todayStatus === 'occupied' || occupancy.tomorrowStatus === 'occupied'
                                          ? 'text-red-700'
                                          : 'text-orange-700'
                                      }`}>
                                        {occupancy.todayStatus === 'occupied' ? 'Ocupada físicamente' :
                                         occupancy.todayStatus === 'reserved' ? 'Reservada' :
                                         occupancy.tomorrowStatus === 'occupied' ? 'Ocupada mañana' :
                                         occupancy.tomorrowStatus === 'reserved' ? 'Reservada mañana' : 'No disponible'}
                                        {occupancy.todayGuestName && ` - ${occupancy.todayGuestName}`}
                                        {occupancy.tomorrowGuestName && ` - ${occupancy.tomorrowGuestName}`}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                

                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Selected room summary (compact)
              <div>
                <h2 className="text-lg font-bold text-blue1 mb-4 flex items-center">
                  <Bed className="h-4 w-4 mr-2" />
                  Habitación Seleccionada
                </h2>
                
                <div className="bg-white border-2 border-blue8 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-blue1">Habitación {reservation.selectedRoom.number}</h3>
                    <span className="text-sm bg-blue8 text-white px-2 py-1 rounded-full">
                      Piso {reservation.selectedRoom.floor}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray4">Tipo:</p>
                      <p className="font-medium text-blue1">{getRoomTypeLabel(reservation.selectedRoom.type)}</p>
                    </div>
                    <div>
                      <p className="text-gray4">Capacidad:</p>
                      <p className="font-medium text-blue1">{reservation.selectedRoom.capacity} personas</p>
                    </div>
                    <div>
                      <p className="text-gray4">Precio:</p>
                      <p className="font-bold text-green-600">{formatCLP(reservation.selectedRoom.price)}/noche</p>
                    </div>
                    <div>
                      <p className="text-gray4">Estado:</p>
                      <p className="font-medium text-green-600">Disponible</p>
                    </div>
                  </div>
                </div>
                
                <button
                  className="mt-3 w-full text-blue8 border-blue8 hover:bg-blue8 hover:text-white transition-all duration-400 ease-out px-4 py-2 border rounded-lg hover:scale-105 hover:-translate-y-1 hover:shadow-md"
                  onClick={() => setReservation({...reservation, selectedRoom: null})}
                >
                  Cambiar Habitación
                </button>

                {/* Room Availability Calendar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-blue1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Disponibilidad de la Habitación
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPreviousMonth}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Mes anterior"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={goToCurrentMonth}
                        className="px-2 py-1 text-xs bg-blue8 text-white rounded hover:bg-blue6 transition-colors"
                        title="Ir a mes actual"
                      >
                        Hoy
                      </button>
                      <button
                        onClick={goToNextMonth}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Mes siguiente"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-center mb-3">
                    <h4 className="text-md font-semibold text-blue1">
                      {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('es-ES', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </h4>
                  </div>
                  {!roomCalendar[reservation.selectedRoom.id] ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Cargando calendario...</p>
                    </div>
                  ) : roomCalendar[reservation.selectedRoom.id].length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">No hay datos de calendario disponibles</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const today = new Date();
                          const startDate = new Date(calendarMonth.year, calendarMonth.month, 1);
                          const endDate = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
                          const startDay = startDate.getDay();
                          const daysInMonth = endDate.getDate();
                          const calendarData = roomCalendar[reservation.selectedRoom.id] || [];
                          
                          const cells = [];
                          
                          // Empty cells for days before month starts
                          for (let i = 0; i < startDay; i++) {
                            cells.push(
                              <div key={`empty-${i}`} className="p-2"></div>
                            );
                          }
                          
                          // Days of the month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const currentDate = new Date(calendarMonth.year, calendarMonth.month, day);
                            const dateString = currentDate.toISOString().split('T')[0];
                            const dayData = Array.isArray(calendarData) ? calendarData.find(d => d.date_value === dateString) : null;
                            
                            const isToday = currentDate.toDateString() === today.toDateString();
                            const isAvailable = !dayData || dayData.is_available;
                            const isReserved = dayData && dayData.status_type === 'reserved';
                            const isOccupied = dayData && dayData.status_type === 'occupied';
                            const isSelected = reservation.checkIn && reservation.checkOut && 
                              dateString >= reservation.checkIn && dateString < reservation.checkOut;
                            
                            cells.push(
                              <div 
                                key={day}
                                className={`
                                  p-2 text-center text-xs rounded border transition-all duration-200 font-medium
                                  ${isToday ? 'font-bold ring-2 ring-blue-400' : ''}
                                  ${isSelected ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 
                                    isAvailable ? 'bg-green-500 text-white border-green-600 hover:bg-green-600 shadow-sm' : 
                                    isReserved ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600 shadow-sm' :
                                    isOccupied ? 'bg-red-500 text-white border-red-600 shadow-sm' :
                                    'bg-gray-500 text-white border-gray-600 shadow-sm'
                                  }
                                `}
                                title={dayData && !dayData.is_available ? 
                                  isReserved ? `Reservado: ${dayData.guest_name} (${dayData.guest_count} huéspedes)` :
                                  isOccupied ? `Ocupado: ${dayData.guest_name} (${dayData.guest_count} huéspedes)` :
                                  `No disponible: ${dayData.guest_count} huéspedes` : 
                                  'Disponible'
                                }
                              >
                                {day}
                              </div>
                            );
                          }
                          
                          return cells;
                        })()}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center space-x-4 mt-4 text-xs">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 border border-green-600 rounded mr-1"></div>
                          <span className="text-gray-600 font-medium">Disponible</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-orange-500 border border-orange-600 rounded mr-1"></div>
                          <span className="text-gray-600 font-medium">Reservado</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 border border-red-600 rounded mr-1"></div>
                          <span className="text-gray-600 font-medium">Ocupado (con check-in)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-600 border border-blue-700 rounded mr-1"></div>
                          <span className="text-gray-600 font-medium">Seleccionado</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {errors.room && (
              <p className="text-red-500 text-sm mt-4">
                {errors.room}
              </p>
            )}
          </div>

          {/* Column 2: Dates and Guests */}
          {reservation.selectedRoom && (
            <div className="bg-white rounded-lg shadow-sm p-6 transition-all duration-500 ease-out hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-right-8 duration-500">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-blue1 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Fechas y Huéspedes
                </h2>
                {canSellForToday() ? (
                  <p className="text-sm text-green-600 mt-1">
                    ✅ Puedes registrar reservas para hoy hasta las 23:59 (hora de Chile)
                  </p>
                ) : (
                  <p className="text-sm text-orange-600 mt-1">
                    ⏰ Horario de ventas para hoy finalizado. Las ventas son hasta las 23:59.
                  </p>
                )}
              </div>
              
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Fecha de Check-in *</label>
                  <input
                    type="date"
                    value={reservation.checkIn}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      // Check if the selected date is occupied
                      if (reservation.selectedRoom && isDateOccupied(reservation.selectedRoom.id, selectedDate)) {
                        alert('Esta fecha no está disponible. Por favor selecciona otra fecha.');
                        return;
                      }
                      setReservation({...reservation, checkIn: selectedDate});
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-400 ease-out hover:border-blue8 hover:shadow-sm ${
                      errors.checkIn ? 'border-red-500' : 'border-gray8'
                    }`}
                    min={getMinDate()}
                  />
                  {errors.checkIn && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.checkIn}
                    </p>
                  )}
                  {reservation.selectedRoom && occupiedDates[reservation.selectedRoom.id] && occupiedDates[reservation.selectedRoom.id].length > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Algunas fechas no están disponibles. Consulta el calendario abajo.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Fecha de Check-out *</label>
                  <input
                    type="date"
                    value={reservation.checkOut}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      
                      // Check if any date in the range is occupied
                      if (reservation.selectedRoom && reservation.checkIn) {
                        const checkIn = new Date(reservation.checkIn);
                        const checkOut = new Date(selectedDate);
                        const occupiedInRange = [];
                        
                        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
                          const dateStr = d.toISOString().split('T')[0];
                          if (isDateOccupied(reservation.selectedRoom.id, dateStr)) {
                            occupiedInRange.push(dateStr);
                          }
                        }
                        
                        if (occupiedInRange.length > 0) {
                          alert(`No se puede realizar la reserva. Las siguientes fechas están ocupadas: ${occupiedInRange.join(', ')}`);
                          return;
                        }
                      }
                      
                      setReservation({...reservation, checkOut: selectedDate});
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-400 ease-out hover:border-blue8 hover:shadow-sm ${
                      errors.checkOut ? 'border-red-500' : 'border-gray8'
                    }`}
                    min={reservation.checkIn || getMinDate()}
                  />
                  {errors.checkOut && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.checkOut}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Hora de Check-in</label>
                  <input
                    type="time"
                    value={reservation.checkInTime}
                    onChange={(e) => setReservation({...reservation, checkInTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-400 ease-out hover:border-blue8 hover:shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Hora de Check-out</label>
                  <input
                    type="time"
                    value={reservation.checkOutTime}
                    onChange={(e) => setReservation({...reservation, checkOutTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-400 ease-out hover:border-blue8 hover:shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Número de Huéspedes *</label>
                  <input
                    type="number"
                    value={reservation.guests}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      const maxCapacity = reservation.selectedRoom?.capacity || 10;
                      
                      // Allow values from 1 to room capacity
                      if (newValue >= 1 && newValue <= maxCapacity) {
                        setReservation({...reservation, guests: newValue});
                      } else if (newValue > maxCapacity) {
                        // Alert user and set to maximum
                        alert(`No se puede exceder la capacidad de la habitación. Máximo permitido: ${maxCapacity} personas.`);
                        setReservation({...reservation, guests: maxCapacity});
                      } else if (newValue < 1) {
                        // Alert user and set to minimum
                        alert(`El número mínimo de huéspedes es 1.`);
                        setReservation({...reservation, guests: 1});
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-400 ease-out hover:border-blue8 hover:shadow-sm ${
                      errors.guests ? 'border-red-500' : 'border-gray8'
                    }`}
                    min="1"
                    step="1"
                  />
                  {errors.guests && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.guests}
                    </p>
                  )}
                  {reservation.selectedRoom && (
                    <p className="text-xs text-gray4 mt-1">
                      Rango permitido: 1 a {reservation.selectedRoom.capacity} personas (capacidad de la habitación)
                    </p>
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray4 mb-2">Solicitudes Especiales</label>
                  <textarea
                    value={reservation.specialRequests}
                    onChange={(e) => setReservation({...reservation, specialRequests: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-400 ease-out hover:border-blue8 hover:shadow-sm"
                    rows={3}
                    placeholder="Solicitudes especiales, preferencias, etc."
                  />
                </div>
              </div>
              
              {/* Price Preview */}
              {reservation.selectedRoom && reservation.checkIn && reservation.checkOut && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-green-800">Resumen de Precios</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      siiConfig.iva_incluido 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {siiConfig.iva_incluido ? 'IVA Incluido' : 'IVA + Precio'}
                    </div>
                  </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3 mt-6 text-white shadow-lg">
                  <h3 className="font-bold mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Vista Previa del Precio
                  </h3>
                  <div className="grid grid-cols-3 gap-1 text-sm">
                    <div>
                      <p className="text-green-100">Noches:</p>
                      <p className="font-bold text-lg">
                        {Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-100">Por noche:</p>
                      <p className="font-medium">{formatCLP(reservation.selectedRoom.price)}</p>
                    </div>
                    {reservation.totalAmount > 0 && (
                      <>
                        <div className="border-t border-green-200 pt-2">
                          <p className="text-green-100 text-sm">Desglose:</p>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Precio neto:</span>
                              <span>{formatCLP(reservation.netAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>IVA (19%):</span>
                              <span>{formatCLP(reservation.ivaAmount)}</span>
                            </div>
                            <div className="border-t border-green-200 pt-1 flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>{formatCLP(reservation.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-green-200">
                          {siiConfig.iva_incluido ? 'Precio incluye IVA' : 'Precio + IVA'}
                        </div>
                      </>
                    )}
                  </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Column 3: Guest Data */}
          {reservation.selectedRoom && reservation.checkIn && reservation.checkOut && (
            <div className="bg-white rounded-lg shadow-sm p-6 transition-all duration-500 ease-out hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl font-bold text-blue1 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Datos del Huésped
              </h2>
              
              <div className="space-y-6">
                {/* Guest Management Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue1">
                    Datos de Huéspedes ({guestData.guests.length} de {reservation.guests})
                  </h3>
                  <div className="flex gap-2">
                    {guestData.guests.length < reservation.guests && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newGuestIndex = guestData.guests.length;
                          setGuestData(prev => ({
                            ...prev,
                            guests: [...prev.guests, {
                              name: '',
                              email: '',
                              phone: '',
                              document: '',
                              address: ''
                            }]
                          }));
                          setGuestPhoneStates(prev => ({
                            ...prev,
                            [newGuestIndex]: { countryCode: "+56", localPhone: "" }
                          }));
                        }}
                        className="text-blue8 border-blue8 hover:bg-blue8 hover:text-white"
                      >
                        + Agregar Huésped
                      </Button>
                    )}
                    {guestData.guests.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newGuestCount = guestData.guests.length - 1;
                          setGuestData(prev => ({
                            ...prev,
                            guests: prev.guests.slice(0, -1)
                          }));
                          setGuestPhoneStates(prev => {
                            const newStates = { ...prev };
                            delete newStates[newGuestCount];
                            return newStates;
                          });
                        }}
                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        - Remover Huésped
                      </Button>
                    )}
                  </div>
                </div>

                {/* Guest Forms */}
                {guestData.guests.map((guest, guestIndex) => {
                  const isPrimaryGuest = guestIndex === guestData.primaryGuestIndex;
                  const guestPhone = parsePhone(guest.phone);
                  
                  return (
                    <div key={guestIndex} className="bg-gray15 rounded-lg p-4 border-2 border-gray8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-blue1">
                          {isPrimaryGuest ? 'Huésped Principal' : `Huésped ${guestIndex + 1}`}
                        </h4>
                        <div className="flex gap-2">
                          {guestIndex > 0 && (
                            <div className="relative">
                              {guestIndex === 1 ? (
                                // For second guest, simple copy from first
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const sourceGuest = guestData.guests[0];
                                    const sourcePhoneState = guestPhoneStates[0];
                                    
                                    // Copy data from first guest
                                    setGuestData(prev => ({
                                      ...prev,
                                      guests: prev.guests.map((g, i) => 
                                        i === guestIndex 
                                          ? {
                                              ...g,
                                              email: sourceGuest.email,
                                              phone: sourceGuest.phone,
                                              address: sourceGuest.address
                                              // Don't copy name or document as they should be unique
                                            }
                                          : g
                                      )
                                    }));
                                    
                                    // Copy phone state
                                    if (sourcePhoneState) {
                                      setGuestPhoneStates(prev => ({
                                        ...prev,
                                        [guestIndex]: {
                                          countryCode: sourcePhoneState.countryCode,
                                          localPhone: sourcePhoneState.localPhone
                                        }
                                      }));
                                    }
                                  }}
                                  className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                                >
                                  Copiar datos
                                </Button>
                              ) : (
                                // For third guest and beyond, show dropdown to select source
                                <div className="relative">
                                  <select
                                    onChange={(e) => {
                                      const sourceIndex = parseInt(e.target.value);
                                      if (sourceIndex >= 0) {
                                        const sourceGuest = guestData.guests[sourceIndex];
                                        const sourcePhoneState = guestPhoneStates[sourceIndex];
                                        
                                        // Copy data from selected guest
                                        setGuestData(prev => ({
                                          ...prev,
                                          guests: prev.guests.map((g, i) => 
                                            i === guestIndex 
                                              ? {
                                                  ...g,
                                                  email: sourceGuest.email,
                                                  phone: sourceGuest.phone,
                                                  address: sourceGuest.address
                                                  // Don't copy name or document as they should be unique
                                                }
                                              : g
                                          )
                                        }));
                                        
                                        // Copy phone state
                                        if (sourcePhoneState) {
                                          setGuestPhoneStates(prev => ({
                                            ...prev,
                                            [guestIndex]: {
                                              countryCode: sourcePhoneState.countryCode,
                                              localPhone: sourcePhoneState.localPhone
                                            }
                                          }));
                                        }
                                        
                                        // Reset select
                                        e.target.value = "";
                                      }
                                    }}
                                    className="px-2 py-2 text-sm border border-green-600 text-green-600 rounded-lg bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 w-28"
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Copiar de...</option>
                                    {Array.from({ length: guestIndex }, (_, i) => {
                                      const sourceGuest = guestData.guests[i];
                                      const hasData = sourceGuest.name || sourceGuest.email;
                                      return (
                                        <option key={i} value={i} disabled={!hasData}>
                                          {i === 0 ? 'Huésped Principal' : `Huésped ${i + 1}`}
                                          {hasData ? ` (${sourceGuest.name || sourceGuest.email || 'Con datos'})` : ' (Sin datos)'}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                          {guestIndex > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setGuestData(prev => ({
                                  ...prev,
                                  primaryGuestIndex: guestIndex
                                }));
                              }}
                              className="text-blue8 hover:bg-blue15"
                            >
                              Hacer Principal
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray4 mb-2">
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            value={guest.name}
                            onChange={(e) => {
                              setGuestData(prev => ({
                                ...prev,
                                guests: prev.guests.map((g, i) => 
                                  i === guestIndex 
                                    ? { ...g, name: capitalizeFullName(e.target.value) }
                                    : g
                                )
                              }));
                            }}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-300 ${
                              errors[`name_${guestIndex}`] ? 'border-red-500' : 'border-gray8'
                            }`}
                            placeholder="Juan Pérez"
                          />
                          {errors[`name_${guestIndex}`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`name_${guestIndex}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray4 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={guest.email}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase();
                              setGuestData(prev => ({
                                ...prev,
                                guests: prev.guests.map((g, i) => 
                                  i === guestIndex 
                                    ? { ...g, email: value }
                                    : g
                                )
                              }));
                            }}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-300 ${
                              errors[`email_${guestIndex}`] ? 'border-red-500' : 'border-gray8'
                            }`}
                            placeholder="juan@email.com"
                          />
                          {errors[`email_${guestIndex}`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`email_${guestIndex}`]}
                            </p>
                          )}
                        </div>

                                                                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray4 mb-2">
                            Teléfono y Documento *
                          </label>
                          <div className="flex gap-1 sm:gap-2">
                            <select
                              value={guestPhoneStates[guestIndex]?.countryCode || "+56"}
                              onChange={(e) => {
                                setGuestPhoneStates(prev => ({
                                  ...prev,
                                  [guestIndex]: {
                                    ...prev[guestIndex],
                                    countryCode: e.target.value
                                  }
                                }));
                              }}
                              className={`w-16 sm:w-20 px-1 sm:px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-300 text-xs sm:text-sm ${
                                errors[`phone_${guestIndex}`] ? 'border-red-500' : 'border-gray8'
                              }`}
                            >
                              {countryOptions.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.flag} {country.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              value={guestPhoneStates[guestIndex]?.localPhone || ""}
                              onChange={(e) => {
                                const newLocal = e.target.value.replace(/\D/g, '');
                                setGuestPhoneStates(prev => ({
                                  ...prev,
                                  [guestIndex]: {
                                    ...prev[guestIndex],
                                    localPhone: newLocal
                                  }
                                }));
                              }}
                              className={`w-24 sm:w-28 px-2 sm:px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-300 text-xs sm:text-sm ${
                                errors[`phone_${guestIndex}`] ? 'border-red-500' : 'border-gray8'
                              }`}
                              placeholder="912345678"
                            />
                            <input
                              type="text"
                              value={guest.document}
                              onChange={(e) => {
                                const v = e.target.value;
                                
                                // PRIMERO: Intentar autocompletado con valor sin formato
                                triggerAutocomplete(v, guestIndex);
                                
                                // SEGUNDO: Aplicar formato para mostrar en UI
                                const formatted = formatDocument(v);
                                setGuestData(prev => ({
                                  ...prev,
                                  guests: prev.guests.map((g, i) => 
                                    i === guestIndex 
                                      ? { ...g, document: formatted }
                                      : g
                                  )
                                }));
                              }}
                              className={`flex-1 min-w-0 px-2 sm:px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-300 text-xs sm:text-sm ${
                                errors[`document_${guestIndex}`] ? 'border-red-500' : 'border-gray8'
                              }`}
                              placeholder="12345678-9"
                            />
                          </div>
                          <div className="flex gap-4 mt-1">
                            {errors[`phone_${guestIndex}`] && (
                              <p className="text-red-500 text-xs">
                                {errors[`phone_${guestIndex}`]}
                              </p>
                            )}
                            {errors[`document_${guestIndex}`] && (
                              <p className="text-red-500 text-xs">
                                {errors[`document_${guestIndex}`]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray4 mb-2">
                            Dirección
                          </label>
                          <input
                            type="text"
                            value={guest.address}
                            onChange={(e) => {
                              setGuestData(prev => ({
                                ...prev,
                                guests: prev.guests.map((g, i) => 
                                  i === guestIndex 
                                    ? { ...g, address: e.target.value }
                                    : g
                                )
                              }));
                            }}
                            className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 transition-all duration-300"
                            placeholder="Av. Principal 123, Ciudad"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Final Action Button */}
              <div className="mt-6 pt-6 border-t border-gray8">
                <button
                  onClick={handleSaveReservation}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-medium shadow-lg rounded-lg transition-all duration-500 ease-out hover:scale-110 hover:shadow-2xl hover:-translate-y-2"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creando Reserva...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Crear Reserva - {formatCLP(reservation.totalAmount)}
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal de Confirmación de Autocompletado */}
      {autocompleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔍 Datos Encontrados
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Se encontraron datos previos para este documento. ¿Deseas usar esta información?
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Datos Actuales:</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                  <div><strong>Nombre:</strong> {autocompleteModal.currentData?.name || 'Sin datos'}</div>
                  <div><strong>Email:</strong> {autocompleteModal.currentData?.email || 'Sin datos'}</div>
                  <div><strong>Teléfono:</strong> {autocompleteModal.currentData?.phone || 'Sin datos'}</div>
                  <div><strong>Dirección:</strong> {autocompleteModal.currentData?.address || 'Sin datos'}</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">Datos Encontrados:</h4>
                <div className="bg-green-50 p-3 rounded-lg text-xs space-y-1">
                  <div><strong>Nombre:</strong> {autocompleteModal.foundData?.name || 'Sin datos'}</div>
                  <div><strong>Email:</strong> {autocompleteModal.foundData?.email || 'Sin datos'}</div>
                  <div><strong>Teléfono:</strong> {autocompleteModal.foundData?.phone || 'Sin datos'}</div>
                  <div><strong>Dirección:</strong> {autocompleteModal.foundData?.address || 'Sin datos'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => handleAutocompleteConfirm(false)}
                className="flex-1"
              >
                Mantener Actuales
              </Button>
              <Button
                onClick={() => handleAutocompleteConfirm(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Usar Encontrados
              </Button>
            </div>
          </div>
        </div>
      )}


    </HotelLayout>
  );
}
