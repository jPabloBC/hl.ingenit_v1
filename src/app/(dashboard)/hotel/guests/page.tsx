"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { Button } from "@/components/ui/button";
import { 
  User, 
  Search,
  Filter,
  X,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  UserPlus
} from "lucide-react";


interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  created_at: string;
  updated_at: string;
}





export default function GuestsManagement() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);

  // RUT formatting functions
  const cleanRut = (value: string): string => {
    return value.replace(/[.-]/g, '').toLowerCase();
  };

  const computeRutDv = (body: string): string => {
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = sum % 11;
    const dv = 11 - remainder;
    if (dv === 11) return '0';
    if (dv === 10) return 'k';
    return dv.toString();
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

  const formatDocument = (value: string): string => {
    // If it looks like a RUT and is valid, format it
    if (isValidRut(value)) {
      return formatRut(value);
    }
    // Otherwise, return as-is (no formatting)
    return value;
  };

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, frequent, new, inactive
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: ''
  });
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndGuests();
  }, []);

  useEffect(() => {
    if (businessId) {
      loadGuests();
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
        router.push('/hotel');
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
      // Cargar huéspedes que tengan reservaciones en este hotel
      const { data, error } = await supabase
        .from('hl_guests')
        .select(`
          *,
          hl_reservation_guests!inner(
            hl_reservations!inner(
              business_id
            )
          )
        `)
        .eq('hl_reservation_guests.hl_reservations.business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading guests:', error);
        return;
      }

      // Transformar datos básicos
      const transformedGuests = (data || []).map((guest: any) => ({
        id: guest.id,
        name: guest.name || 'Sin nombre',
        email: guest.email || '',
        phone: guest.phone || '',
        document: guest.document || '',
        address: guest.address || '',
        created_at: guest.created_at,
        updated_at: guest.updated_at
      }));

      setGuests(transformedGuests);
      setLoading(false);
    } catch (error) {
      console.error('Error loading guests:', error);
      setLoading(false);
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
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(guest => 
          new Date(guest.created_at) >= thirtyDaysAgo
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

  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setEditFormData({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      document: guest.document,
      address: guest.address
    });
    setShowEditModal(true);
  };

  const handleUpdateGuest = async () => {
    if (!selectedGuest) return;

    try {
      // Verificar si el documento ya existe en otro huésped
      if (editFormData.document !== selectedGuest.document) {
        const { data: existingGuest, error: checkError } = await supabase
          .from('hl_guests')
          .select('id')
          .eq('document', editFormData.document)
          .neq('id', selectedGuest.id)
          .single();

        if (existingGuest) {
          alert('Ya existe un huésped con este número de documento. Por favor, verifica el número.');
          return;
        }
      }

      // Actualizar el huésped
      const { error } = await supabase
        .from('hl_guests')
        .update({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          document: editFormData.document,
          address: editFormData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedGuest.id);

      if (error) {
        console.error('Error updating guest:', error);
        alert('Error al actualizar el huésped. Por favor, intenta nuevamente.');
        return;
      }

      alert('Huésped actualizado exitosamente.');
      setShowEditModal(false);
      loadGuests(); // Recargar datos
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('Error al actualizar el huésped. Por favor, intenta nuevamente.');
    }
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
            onClick={() => router.push('/hotel/sales')}
            className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Nueva Reserva</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <option value="new">Nuevos (30 días)</option>
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
                    Fecha de Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray8">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-blue1">{guest.name}</div>
                        <div className="text-sm text-gray4">{formatDocument(guest.document)}</div>
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
                      <div className="text-sm text-gray4">
                        {new Date(guest.created_at).toLocaleDateString()}
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditGuest(guest)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                    <p className="font-medium">{formatDocument(selectedGuest.document)}</p>
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
                <h3 className="font-semibold text-blue1 mb-4">Información del Registro</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray4">Fecha de Registro</p>
                    <p className="font-medium">{new Date(selectedGuest.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray4">Última Actualización</p>
                    <p className="font-medium">{new Date(selectedGuest.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      )}

      {/* Modal de Edición de Huésped */}
      {showEditModal && selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-blue1">Editar Huésped</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray4 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray4 mb-1">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  value={formatDocument(editFormData.document)}
                  className="w-full px-3 py-2 border border-gray8 rounded-lg bg-gray10 text-gray4 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray4 mt-1">
                  El documento no puede ser modificado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray4 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray4 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray4 mb-1">
                  Dirección
                </label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateGuest}
                  className="flex-1 bg-blue8 hover:bg-blue6 text-white"
                >
                  Actualizar
                </Button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
  );
}