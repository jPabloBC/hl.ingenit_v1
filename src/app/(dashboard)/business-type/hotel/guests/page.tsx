"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Search,
  Filter,

  Mail,
  Phone,
  MapPin,
  Calendar,
  Bed,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  History,
  AlertTriangle
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  created_at: string;
  updated_at: string;
  total_reservations: number;
  total_spent: number;
  last_reservation_date: string;
  reservation_history: ReservationHistory[];
}

interface ReservationHistory {
  reservation_id: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  status: string;
  created_at: string;
}

interface GuestStats {
  total_guests: number;
  new_guests_this_month: number;
  returning_guests: number;
  average_reservations_per_guest: number;
}

export default function GuestsManagement() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, frequent, new, inactive
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndGuests();
  }, []);

  useEffect(() => {
    if (businessId) {
      loadGuests();
      loadStats();
    }
  }, [businessId]);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm, filterType]);

  const loadUserAndGuests = async () => {
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
        alert('No se encontró información del hotel para este usuario.');
        router.push('/business-type/hotel');
        return;
      }

      setBusinessId(businessData.id);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadGuests = async () => {
    if (!businessId) return;
    
    try {
      // Cargar huéspedes directamente de la tabla
      const { data, error } = await supabase
        .from('hl_guests')
        .select(`
          *,
          reservation_history:hl_reservation_guests(
            reservation:hl_reservations(
              id,
              room:hl_rooms(room_number, room_type),
              check_in_date,
              check_out_date,
              guest_count,
              total_amount,
              status,
              created_at
            ),
            is_primary_guest,
            guest_order
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading guests:', error);
        return;
      }

      // Transformar datos para que coincidan con la interfaz
      const transformedGuests = (data || []).map((guest: any) => ({
        id: guest.id,
        name: guest.name || 'Sin nombre',
        email: guest.email || '',
        phone: guest.phone || '',
        document: guest.document || '',
        address: guest.address || '',
        created_at: guest.created_at,
        updated_at: guest.updated_at,
        total_reservations: guest.reservation_history?.length || 0,
        total_spent: guest.reservation_history?.reduce((sum: number, rh: any) => 
          sum + (rh.reservation?.total_amount || 0), 0) || 0,
        last_reservation_date: guest.reservation_history?.[0]?.reservation?.created_at || null,
        reservation_history: guest.reservation_history?.map((rh: any) => ({
          reservation_id: rh.reservation?.id,
          room_number: rh.reservation?.room?.room_number,
          room_type: rh.reservation?.room?.room_type,
          check_in_date: rh.reservation?.check_in_date,
          check_out_date: rh.reservation?.check_out_date,
          guest_count: rh.reservation?.guest_count,
          total_amount: rh.reservation?.total_amount,
          status: rh.reservation?.status,
          created_at: rh.reservation?.created_at
        })).filter((rh: any) => rh.reservation_id) || []
      }));

      setGuests(transformedGuests);
      setLoading(false);
    } catch (error) {
      console.error('Error loading guests:', error);
      setLoading(false);
    }
  };



  const loadStats = async () => {
    if (!businessId) return;
    
    try {
      // Calcular estadísticas directamente desde los datos de huéspedes
      const { data: guests, error } = await supabase
        .from('hl_guests')
        .select('created_at');

      if (error) {
        console.error('Error loading guest stats:', error);
        return;
      }

      const totalGuests = guests?.length || 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newGuestsThisMonth = guests?.filter(g => 
        new Date(g.created_at) >= thirtyDaysAgo
      ).length || 0;

      setStats({
        total_guests: totalGuests,
        new_guests_this_month: newGuestsThisMonth,
        returning_guests: 0, // Por ahora
        average_reservations_per_guest: 0 // Por ahora
      });
    } catch (error) {
      console.error('Error loading guest stats:', error);
    }
  };

  const filterGuests = () => {
    let filtered = guests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(guest =>
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone.includes(searchTerm) ||
        guest.document.includes(searchTerm)
      );
    }

    // Type filter
    switch (filterType) {
      case 'frequent':
        filtered = filtered.filter(guest => guest.total_reservations >= 3);
        break;
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(guest => 
          new Date(guest.created_at) >= thirtyDaysAgo
        );
        break;
      case 'inactive':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        filtered = filtered.filter(guest => 
          !guest.last_reservation_date || 
          new Date(guest.last_reservation_date) < sixMonthsAgo
        );
        break;
      default:
        break;
    }

    setFilteredGuests(filtered);
  };

  const handleViewGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowGuestModal(true);
  };

  const getGuestTypeLabel = (guest: Guest) => {
    if (guest.total_reservations >= 5) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (guest.total_reservations >= 3) return { label: 'Frecuente', color: 'bg-blue-100 text-blue-800' };
    if (guest.total_reservations >= 1) return { label: 'Regular', color: 'bg-green-100 text-green-800' };
    return { label: 'Nuevo', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray9 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4">Cargando huéspedes...</p>
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
                Gestión de Huéspedes
              </h1>
              <p className="text-gray4">
                Administra la información de tus huéspedes
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/business-type/hotel/sales')}
            className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Nueva Reserva</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4">Total Huéspedes</p>
                <p className="text-2xl font-bold text-blue1">{guests.length}</p>
              </div>
              <User className="h-8 w-8 text-blue8" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4">Nuevos (30 días)</p>
                <p className="text-2xl font-bold text-green-600">
                  {guests.filter(g => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return new Date(g.created_at) >= thirtyDaysAgo;
                  }).length}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4">Frecuentes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {guests.filter(g => g.total_reservations >= 3).length}
                </p>
              </div>
              <History className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4">Ingresos Totales</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${guests.reduce((sum, g) => sum + g.total_spent, 0).toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Buscar Huésped</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="Nombre, email, teléfono o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Tipo de Huésped</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
              >
                <option value="all">Todos los huéspedes</option>
                <option value="frequent">Frecuentes (3+ reservas)</option>
                <option value="new">Nuevos (últimos 30 días)</option>
                <option value="inactive">Inactivos (6+ meses)</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                <Filter className="h-4 w-4" />
                <span>Limpiar Filtros</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Huésped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Reservas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Total Gastado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Última Reserva
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray8">
                {filteredGuests.map((guest) => {
                  const guestType = getGuestTypeLabel(guest);
                  return (
                    <tr key={guest.id} className="hover:bg-gray10">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-blue1">{guest.name}</div>
                          <div className="text-sm text-gray4">{guest.document}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center text-gray4 mb-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {guest.email}
                          </div>
                          <div className="flex items-center text-gray4 mb-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {guest.phone}
                          </div>
                          {guest.address && (
                            <div className="flex items-center text-gray4">
                              <MapPin className="h-3 w-3 mr-1" />
                              {guest.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${guestType.color}`}>
                          {guestType.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue1">
                          {guest.total_reservations} reservas
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ${guest.total_spent.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray4">
                          {guest.last_reservation_date 
                            ? new Date(guest.last_reservation_date).toLocaleDateString()
                            : 'Nunca'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewGuest(guest)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray4 mx-auto mb-4" />
            <p className="text-gray4">
              {searchTerm || filterType !== 'all' 
                ? 'No se encontraron huéspedes con los filtros aplicados'
                : 'No hay huéspedes registrados'
              }
            </p>
          </div>
        )}
      </div>

      {/* Guest Detail Modal */}
      {showGuestModal && selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue1">
                Detalles del Huésped
              </h2>
              <Button 
                variant="outline"
                onClick={() => setShowGuestModal(false)}
              >
                Cerrar
              </Button>
            </div>
            
            {/* Guest Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray15 rounded-lg p-4">
                <h3 className="font-semibold text-blue1 mb-4">Información Personal</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray4">Nombre Completo</p>
                    <p className="font-medium">{selectedGuest.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray4">Email</p>
                    <p className="font-medium">{selectedGuest.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray4">Teléfono</p>
                    <p className="font-medium">{selectedGuest.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray4">Documento</p>
                    <p className="font-medium">{selectedGuest.document}</p>
                  </div>
                  {selectedGuest.address && (
                    <div>
                      <p className="text-sm text-gray4">Dirección</p>
                      <p className="font-medium">{selectedGuest.address}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray15 rounded-lg p-4">
                <h3 className="font-semibold text-blue1 mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray4">Total de Reservas</p>
                    <p className="text-2xl font-bold text-blue8">{selectedGuest.total_reservations}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray4">Total Gastado</p>
                    <p className="text-2xl font-bold text-green-600">${selectedGuest.total_spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray4">Fecha de Registro</p>
                    <p className="font-medium">{new Date(selectedGuest.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray4">Última Reserva</p>
                    <p className="font-medium">
                      {selectedGuest.last_reservation_date 
                        ? new Date(selectedGuest.last_reservation_date).toLocaleDateString()
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reservation History */}
            <div>
              <h3 className="font-semibold text-blue1 mb-4 flex items-center">
                <History className="h-5 w-5 mr-2" />
                Historial de Reservas ({selectedGuest.reservation_history.length})
              </h3>
              
              {selectedGuest.reservation_history.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray4 mx-auto mb-4" />
                  <p className="text-gray4">Este huésped no tiene reservas registradas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedGuest.reservation_history.map((reservation, index) => (
                    <div key={reservation.reservation_id || index} className="border border-gray8 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray4">Habitación</p>
                          <p className="font-medium flex items-center">
                            <Bed className="h-4 w-4 mr-1" />
                            {reservation.room_number} ({reservation.room_type})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray4">Fechas</p>
                          <p className="font-medium">
                            {new Date(reservation.check_in_date).toLocaleDateString()} - 
                            {new Date(reservation.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray4">Total</p>
                          <p className="font-medium text-green-600">${reservation.total_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray4">Estado</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reservation.status === 'confirmed' ? 'Confirmada' :
                             reservation.status === 'pending' ? 'Pendiente' :
                             reservation.status === 'cancelled' ? 'Cancelada' :
                             reservation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </HotelLayout>
  );
}
