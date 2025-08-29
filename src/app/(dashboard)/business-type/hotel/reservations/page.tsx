"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Send,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Bed,
  CreditCard,
  Phone,
  Mail,
  AlertTriangle,
  FileText,
  Receipt
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface Reservation {
  reservation_id: string;
  room_id: string;
  room_number: string;
  room_type: string;
  floor: number;
  primary_guest_id: string;
  primary_guest_name: string;
  primary_guest_email: string;
  primary_guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  guest_count: number;
  room_price_per_night: number;
  total_amount: number;
  special_requests?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked-in' | 'checked-out' | 'completed';
  created_at: string;
  all_guests: any[];
}

interface RoomWithReservations {
  room_id: string;
  room_number: string;
  room_type: string;
  floor: number;
  room_capacity: number;
  room_price: number;
  room_status: string;
  reservations_count: number;
  current_reservation?: any;
  upcoming_reservations?: any[];
  past_reservations?: any[];
}

interface ReservationStats {
  total_reservations: number;
  today_checkins: number;
  today_checkouts: number;
  pending_reservations: number;
  confirmed_reservations: number;
  total_revenue: number;
  occupancy_rate: number;
  average_stay: number;
}

const reservationStatuses = [
  { value: 'confirmed', label: 'Confirmada', color: 'bg-green-100 text-green-800' },
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  { value: 'checked-in', label: 'Check-in', color: 'bg-blue-100 text-blue-800' },
  { value: 'checked-out', label: 'Check-out', color: 'bg-gray-100 text-gray-800' }
];

export default function ReservationsManagement() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomsWithReservations, setRoomsWithReservations] = useState<RoomWithReservations[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'rooms'>('rooms'); // Nueva vista por habitaciones
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [creatingDocument, setCreatingDocument] = useState<string | null>(null);
  const [sendingCheckin, setSendingCheckin] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    totalAmount: 0,
    specialRequests: ''
  });

  useEffect(() => {
    loadUserAndReservations();
  }, []);

  useEffect(() => {
    if (businessId) {
      loadReservations();
      loadRoomsWithReservations();
      loadStats();
    }
  }, [businessId, filterStatus, filterDate]);

  const loadUserAndReservations = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
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
        console.log('User ID:', user.id);
        console.log('Business data:', businessData);
        alert('No se encontró información del hotel para este usuario. Verifica que tengas un hotel registrado.');
        router.push('/business-type/hotel');
        return;
      }

      setBusinessId(businessData.id);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_hotel_reservations_v2', {
          p_business_id: businessId,
          p_status_filter: filterStatus,
          p_date_filter: filterDate
        });

      if (error) {
        console.error('Error loading reservations:', error);
        return;
      }

      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const loadRoomsWithReservations = async () => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_reservations_by_room_v2', {
          p_business_id: businessId,
          p_status_filter: filterStatus,
          p_date_filter: filterDate
        });

      if (error) {
        console.error('Error loading rooms with reservations:', error);
        return;
      }

      setRoomsWithReservations(data || []);
    } catch (error) {
      console.error('Error loading rooms with reservations:', error);
    }
  };

  const loadStats = async () => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_reservations_stats_v2', {
          p_business_id: businessId
        });

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      setStats(data?.[0] || null);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  const handleAddReservation = () => {
    setFormData({
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      roomNumber: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      totalAmount: 0,
      specialRequests: ''
    });
    setShowAddModal(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      guestName: reservation.primary_guest_name,
      guestEmail: reservation.primary_guest_email,
      guestPhone: reservation.primary_guest_phone,
      roomNumber: reservation.room_number,
      checkIn: reservation.check_in_date,
      checkOut: reservation.check_out_date,
      guests: reservation.guest_count,
      totalAmount: reservation.total_amount,
      specialRequests: reservation.special_requests || ''
    });
    setShowEditModal(true);
  };

  const handleSaveReservation = async () => {
    try {
      if (showAddModal) {
        const newReservation: Reservation = {
          reservation_id: Date.now().toString(),
          room_id: '',
          room_number: formData.roomNumber,
          room_type: '',
          floor: 0,
          primary_guest_id: '',
          primary_guest_name: formData.guestName,
          primary_guest_email: formData.guestEmail,
          primary_guest_phone: formData.guestPhone,
          check_in_date: formData.checkIn,
          check_out_date: formData.checkOut,
          check_in_time: '15:00',
          check_out_time: '11:00',
          guest_count: formData.guests,
          room_price_per_night: 0,
          total_amount: formData.totalAmount,
          special_requests: formData.specialRequests,
          status: 'pending',
          created_at: new Date().toISOString(),
          all_guests: []
        };
        setReservations([...reservations, newReservation]);
      } else if (showEditModal && selectedReservation) {
        const updatedReservations = reservations.map(reservation => 
          reservation.reservation_id === selectedReservation.reservation_id 
            ? { ...reservation, 
                primary_guest_name: formData.guestName,
                primary_guest_email: formData.guestEmail,
                primary_guest_phone: formData.guestPhone,
                room_number: formData.roomNumber,
                check_in_date: formData.checkIn,
                check_out_date: formData.checkOut,
                guest_count: formData.guests,
                total_amount: formData.totalAmount,
                special_requests: formData.specialRequests
              }
            : reservation
        );
        setReservations(updatedReservations);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error saving reservation:', error);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      setReservations(reservations.filter(reservation => reservation.reservation_id !== reservationId));
    }
  };

  const createBoleta = async (reservationId: string) => {
    try {
      setCreatingDocument(reservationId);
      
      const response = await fetch('/api/sii/create-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationId,
          documentType: 39, // Boleta Electrónica
          businessId: businessId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear boleta');
      }

      // Download PDF
      const link = document.createElement('a');
      link.href = result.pdf;
      link.download = `boleta_${result.document.folio}.pdf`;
      link.click();

      alert(result.message);
      
      // Refresh data
      await loadReservations();

    } catch (error) {
      console.error('Error creating boleta:', error);
      alert(`Error al crear boleta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setCreatingDocument(null);
    }
  };

  const createFactura = async (reservationId: string) => {
    try {
      // Get RUT from user (in a real implementation, this would be a modal)
      const rutReceptor = prompt('Ingrese RUT del receptor para la factura:');
      if (!rutReceptor) return;

      const razonSocial = prompt('Ingrese razón social del receptor:');
      if (!razonSocial) return;

      setCreatingDocument(reservationId);
      
      const response = await fetch('/api/sii/create-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationId,
          documentType: 33, // Factura Electrónica
          businessId: businessId,
          receptorData: {
            rut: rutReceptor,
            razonSocial: razonSocial
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear factura');
      }

      // Download PDF
      const link = document.createElement('a');
      link.href = result.pdf;
      link.download = `factura_${result.document.folio}.pdf`;
      link.click();

      alert(result.message);
      
      // Refresh data
      await loadReservations();

    } catch (error) {
      console.error('Error creating factura:', error);
      alert(`Error al crear factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setCreatingDocument(null);
    }
  };

  const sendCheckinLink = async (reservationId: string) => {
    try {
      setSendingCheckin(reservationId);
      
      const response = await fetch('/api/checkin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          hours_valid: 72
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar link de check-in');
      }

      alert('Link de check-in digital enviado exitosamente al huésped');
      
    } catch (error) {
      console.error('Error sending check-in link:', error);
      alert(`Error al enviar link de check-in: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSendingCheckin(null);
    }
  };

  const processPendingPayment = async (reservationId: string) => {
    try {
      setProcessingPayment(reservationId);
      
      const response = await fetch('/api/payments/process-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar pago pendiente');
      }

      // Redirigir a Webpay
      if (result.paymentUrl) {
        window.open(result.paymentUrl, '_blank');
      } else {
        alert('Pago procesado exitosamente');
      }
      
    } catch (error) {
      console.error('Error processing pending payment:', error);
      alert(`Error al procesar pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleStatusChange = (reservationId: string, newStatus: string) => {
    setReservations(reservations.map(reservation => 
      reservation.reservation_id === reservationId 
        ? { ...reservation, status: newStatus as any }
        : reservation
    ));
  };

  const getStatusColor = (status: string) => {
    const statusObj = reservationStatuses.find(s => s.value === status);
    return statusObj?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusObj = reservationStatuses.find(s => s.value === status);
    return statusObj?.label || status;
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.primary_guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.primary_guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
    
    let matchesDate = true;
    if (filterDate === 'today') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = reservation.check_in_date === today;
    } else if (filterDate === 'week') {
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const checkInDate = new Date(reservation.check_in_date);
      matchesDate = checkInDate >= today && checkInDate <= weekFromNow;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredRooms = roomsWithReservations.filter(room => {
    if (!searchTerm) return true;
    return room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
           room.room_type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Agrupar habitaciones por piso
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    const floor = room.floor;
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, RoomWithReservations[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray9 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4">Cargando reservas...</p>
        </div>
      </div>
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
                Gestión de Reservas
              </h1>
              <p className="text-gray4">
                Administra las reservas de tu hotel
              </p>
            </div>
          </div>
          <Button 
            onClick={handleAddReservation}
            className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Reserva</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Total Reservas</p>
                <p className="text-xl font-bold text-blue1">{stats?.total_reservations || 0}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue8" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Check-ins Hoy</p>
                <p className="text-xl font-bold text-green-600">{stats?.today_checkins || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Check-outs Hoy</p>
                <p className="text-xl font-bold text-orange-600">{stats?.today_checkouts || 0}</p>
              </div>
              <XCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Pendientes</p>
                <p className="text-xl font-bold text-yellow-600">{stats?.pending_reservations || 0}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Confirmadas</p>
                <p className="text-xl font-bold text-blue-600">{stats?.confirmed_reservations || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Ingresos (30d)</p>
                <p className="text-xl font-bold text-purple-600">{formatCLP(stats?.total_revenue || 0)}</p>
              </div>
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Ocupación</p>
                <p className="text-xl font-bold text-indigo-600">{(stats?.occupancy_rate || 0)}%</p>
              </div>
              <Bed className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Estadía Prom.</p>
                <p className="text-xl font-bold text-pink-600">{(stats?.average_stay || 0).toFixed(1)} días</p>
              </div>
              <Calendar className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-gray10 rounded-lg p-1">
            <button
              onClick={() => setView('rooms')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'rooms'
                  ? 'bg-white text-blue8 shadow-sm'
                  : 'text-gray4 hover:text-gray2'
              }`}
            >
              <Bed className="h-4 w-4 inline mr-2" />
              Por Habitación
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-white text-blue8 shadow-sm'
                  : 'text-gray4 hover:text-gray2'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Lista Completa
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="Huésped, email o habitación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
              >
                <option value="all">Todos los estados</option>
                {reservationStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Fecha</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterDate('all');
                }}
              >
                <Filter className="h-4 w-4" />
                <span>Limpiar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content based on view */}
        {view === 'rooms' ? (
          /* Vista por habitaciones */
          <div className="space-y-6">
            {Object.keys(roomsByFloor).sort((a, b) => parseInt(a) - parseInt(b)).map(floor => (
              <div key={floor} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-blue8 text-white px-6 py-3">
                  <h3 className="text-lg font-semibold">Piso {floor}</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roomsByFloor[parseInt(floor)].map((room) => (
                      <div key={room.room_id} className="border border-gray8 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Bed className="h-5 w-5 text-blue8" />
                            <span className="font-semibold text-blue1">Habitación {room.room_number}</span>
                          </div>
                          <span className="text-sm text-gray4">{room.room_type}</span>
                        </div>
                        
                        <div className="text-sm text-gray4 mb-3">
                          <div>Capacidad: {room.room_capacity} personas</div>
                          <div>Precio: {formatCLP(room.room_price)}/noche</div>
                        </div>

                        {/* Reserva actual */}
                        {room.current_reservation ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-800">Ocupada</span>
                            </div>
                            <div className="text-sm text-red-700">
                              <div className="font-medium">{room.current_reservation.guest_name}</div>
                              <div>{room.current_reservation.guest_email}</div>
                              <div>
                                {new Date(room.current_reservation.check_in_date).toLocaleDateString()} - 
                                {new Date(room.current_reservation.check_out_date).toLocaleDateString()}
                              </div>
                              <div className="mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(room.current_reservation.status)}`}>
                                  {getStatusLabel(room.current_reservation.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800">Disponible</span>
                            </div>
                          </div>
                        )}

                        {/* Próximas reservas */}
                        {room.upcoming_reservations && room.upcoming_reservations.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="text-sm font-medium text-blue-800 mb-2">
                              Próximas reservas ({room.upcoming_reservations.length})
                            </div>
                            <div className="space-y-1">
                              {room.upcoming_reservations.slice(0, 2).map((reservation: any, idx: number) => (
                                <div key={idx} className="text-xs text-blue-700">
                                  <div className="font-medium">{reservation.guest_name}</div>
                                  <div>
                                    {new Date(reservation.check_in_date).toLocaleDateString()} - 
                                    {new Date(reservation.check_out_date).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                              {room.upcoming_reservations.length > 2 && (
                                <div className="text-xs text-blue-600">
                                  +{room.upcoming_reservations.length - 2} más...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray4">
                            {room.reservations_count} reservas activas
                          </span>
                          <Button size="sm" variant="outline" className="text-xs">
                            Ver detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {Object.keys(roomsByFloor).length === 0 && (
              <div className="text-center py-12">
                <Bed className="h-12 w-12 text-gray4 mx-auto mb-4" />
                <p className="text-gray4">No se encontraron habitaciones</p>
              </div>
            )}
          </div>
        ) : (
          /* Vista de lista completa */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                      Huésped
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                      Habitación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray8">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.reservation_id} className="hover:bg-gray10">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-blue1">{reservation.primary_guest_name}</div>
                          <div className="text-sm text-gray4">{reservation.primary_guest_email}</div>
                          <div className="text-sm text-gray4">{reservation.primary_guest_phone}</div>
                        </div>
                        {reservation.all_guests && reservation.all_guests.length > 1 && (
                          <div className="text-xs text-blue-600 mt-1">
                            +{reservation.all_guests.length - 1} huésped(es) más
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 text-gray4 mr-2" />
                          <div>
                            <div className="text-sm text-blue1 font-medium">
                              {reservation.room_number} ({reservation.room_type})
                            </div>
                            <div className="text-sm text-gray4">Piso {reservation.floor}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray4">{reservation.guest_count} huéspedes</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue1">
                          <div>Check-in: {new Date(reservation.check_in_date).toLocaleDateString()}</div>
                          <div>Check-out: {new Date(reservation.check_out_date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-xs text-gray4">
                          {reservation.check_in_time} - {reservation.check_out_time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <select
                            value={reservation.status}
                            onChange={(e) => handleStatusChange(reservation.reservation_id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)} border-0`}
                          >
                            {reservationStatuses.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                          {/* Indicador de pago pendiente */}
                          {reservation.status === 'pending' && reservation.total_amount > 0 && (
                            <div className="flex items-center text-xs text-yellow-600">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>Pago pendiente</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue1">
                          {formatCLP(reservation.total_amount)}
                        </div>
                        <div className="text-xs text-gray4">
                          {formatCLP(reservation.room_price_per_night)}/noche
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          {/* Check-in Digital */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => sendCheckinLink(reservation.reservation_id)}
                            disabled={sendingCheckin === reservation.reservation_id}
                            className="text-blue-600 hover:text-blue-700"
                            title="Enviar Check-in Digital"
                          >
                            {sendingCheckin === reservation.reservation_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {/* Procesar Pago Pendiente - Solo mostrar si está pendiente y tiene monto > 0 */}
                          {reservation.status === 'pending' && reservation.total_amount > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => processPendingPayment(reservation.reservation_id)}
                              disabled={processingPayment === reservation.reservation_id}
                              className="text-yellow-600 hover:text-yellow-700"
                              title="Procesar Pago Pendiente"
                            >
                              {processingPayment === reservation.reservation_id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                              ) : (
                                <DollarSign className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          
                          {/* SII Documents */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => createBoleta(reservation.reservation_id)}
                            disabled={creatingDocument === reservation.reservation_id}
                            className="text-green-600 hover:text-green-700"
                            title="Crear Boleta"
                          >
                            {creatingDocument === reservation.reservation_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => createFactura(reservation.reservation_id)}
                            disabled={creatingDocument === reservation.reservation_id}
                            className="text-purple-600 hover:text-purple-700"
                            title="Crear Factura"
                          >
                            {creatingDocument === reservation.reservation_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            ) : (
                              <Receipt className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {/* Edit/Delete */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditReservation(reservation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteReservation(reservation.reservation_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReservations.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray4 mx-auto mb-4" />
                <p className="text-gray4">No se encontraron reservas</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-blue1 mb-4">
              {showAddModal ? 'Nueva Reserva' : 'Editar Reserva'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray4 mb-2">Nombre del Huésped</label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  placeholder="Juan Pérez"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({...formData, guestEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="juan@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({...formData, guestPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="+56912345678"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Habitación</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Huéspedes</label>
                  <input
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Check-in</label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Check-out</label>
                  <input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray4 mb-2">Total</label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray4 mb-2">Solicitudes Especiales</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                  className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  rows={3}
                  placeholder="Solicitudes especiales..."
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button 
                onClick={handleSaveReservation}
                className="bg-blue8 hover:bg-blue6 text-white flex-1"
              >
                {showAddModal ? 'Crear' : 'Guardar'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedReservation(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
              )}
    </HotelLayout>
  );
}
