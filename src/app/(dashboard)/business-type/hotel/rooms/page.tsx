"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
import { Button } from "@/components/ui/button";
import { 
  Bed, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Save,
  X,
  Wifi,
  Tv,
  AirVent,
  Coffee,
  Droplets,
  Car,
  ParkingCircle,
  Baby,
  Dog,
  Cigarette,
  XCircle as NoSmoking
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
  price: number;
  capacity: number;
  description?: string;
  features?: string[];
  size?: number;
  view?: string;
  amenities?: string[];
}

const roomTypes = [
  { value: 'single', label: 'Individual', capacity: 1, basePrice: 25000 },
  { value: 'double', label: 'Doble', capacity: 2, basePrice: 35000 },
  { value: 'triple', label: 'Triple', capacity: 3, basePrice: 45000 },
  { value: 'quad', label: 'Cuádruple', capacity: 4, basePrice: 55000 },
  { value: 'suite', label: 'Suite', capacity: 2, basePrice: 75000 },
  { value: 'family', label: 'Familiar', capacity: 6, basePrice: 65000 },
  { value: 'presidential', label: 'Presidencial', capacity: 4, basePrice: 120000 }
];

const roomStatuses = [
  { 
    value: 'available', 
    label: 'Disponible', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Habitación lista para ocupar'
  },
  { 
    value: 'occupied', 
    label: 'Ocupada', 
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Habitación ocupada por huéspedes'
  },
  { 
    value: 'maintenance', 
    label: 'Mantenimiento', 
    color: 'bg-orange-100 text-orange-800',
    icon: AlertTriangle,
    description: 'Habitación en mantenimiento'
  },
  { 
    value: 'cleaning', 
    label: 'Limpieza', 
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    description: 'Habitación en proceso de limpieza'
  },
  { 
    value: 'reserved', 
    label: 'Reservada', 
    color: 'bg-purple-100 text-purple-800',
    icon: Clock,
    description: 'Habitación reservada para fechas futuras'
  }
];

const roomFeatures = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'ac', label: 'Aire Acondicionado', icon: AirVent },
  { id: 'heating', label: 'Calefacción', icon: AirVent },
  { id: 'privateBathroom', label: 'Baño Privado', icon: Droplets },
  { id: 'coffee', label: 'Cafetera', icon: Coffee },
  { id: 'parking', label: 'Estacionamiento', icon: ParkingCircle },
  { id: 'baby', label: 'Cuna', icon: Baby },
  { id: 'pet', label: 'Mascotas', icon: Dog },
  { id: 'smoking', label: 'Fumar', icon: Cigarette },
  { id: 'no_smoking', label: 'No Fumar', icon: NoSmoking }
];

const roomViews = [
  { value: 'city', label: 'Vista Ciudad' },
  { value: 'mountain', label: 'Vista Montaña' },
  { value: 'ocean', label: 'Vista Mar' },
  { value: 'garden', label: 'Vista Jardín' },
  { value: 'pool', label: 'Vista Piscina' },
  { value: 'street', label: 'Vista Calle' }
];

export default function RoomsManagement() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    type: 'single',
    floor: 1,
    price: 0,
    capacity: 1,
    description: '',
    size: 0,
    view: 'city',
    features: [] as string[],
    amenities: [] as string[]
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
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

      // Load rooms for this business
      const { data: roomsData, error: roomsError } = await supabase
        .from('hl_rooms')
        .select('*')
        .eq('business_id', businessData.id)
        .order('room_number');

      if (roomsError) {
        console.error('Error loading rooms:', roomsError);
        setLoading(false);
        return;
      }

      // Transform data to match our interface
      const transformedRooms: Room[] = (roomsData || []).map(room => {
        // Convert JSONB features to array format
        let featuresArray: string[] = [];
        if (room.features && typeof room.features === 'object') {
          featuresArray = Object.keys(room.features).filter(key => room.features[key] === true);
        }
        
        return {
          id: room.id,
          number: room.room_number,
          type: room.room_type as Room['type'],
          floor: room.floor,
          price: room.price,
          capacity: room.capacity,
          description: room.description || '',
          status: room.status === 'active' ? 'available' : room.status as Room['status'],
          size: 0, // Default value since column doesn't exist
          view: 'city', // Default value since column doesn't exist
          features: featuresArray,
          amenities: [] // Default value since column doesn't exist
        };
      });

      setRooms(transformedRooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setFormData({
      number: '',
      type: 'single',
      floor: 1,
      price: 25000,
      capacity: 1,
      description: '',
      size: 0,
      view: 'city',
      features: [] as string[],
      amenities: [] as string[]
    });
    setShowAddModal(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      number: room.number,
      type: room.type,
      floor: room.floor,
      price: room.price,
      capacity: room.capacity,
      description: room.description || '',
      size: 0, // Default value since column doesn't exist
      view: 'city', // Default value since column doesn't exist
      features: room.features || [] as string[],
      amenities: [] as string[] // Default value since column doesn't exist
    });
    setShowEditModal(true);
  };

  const handleSaveRoom = async () => {
    try {
      // Validate form data
      if (!formData.number.trim()) {
        alert('El número de habitación es requerido');
        return;
      }
      
      if (formData.price <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
      }
      
      if (formData.capacity <= 0) {
        alert('La capacidad debe ser mayor a 0');
        return;
      }

      // Check for duplicate room number (only for new rooms)
      if (showAddModal) {
        const existingRoom = rooms.find(room => room.number === formData.number.trim());
        if (existingRoom) {
          alert('Ya existe una habitación con ese número');
          return;
        }
      }

      // Get current user's business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Usuario no autenticado');
        return;
      }

      const { data: businessData } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (!businessData) {
        alert('Error al obtener información del negocio');
        return;
      }

      if (showAddModal) {
        // Add new room to database
        const { data: newRoom, error } = await supabase
          .from('hl_rooms')
          .insert({
            business_id: businessData.id,
            room_number: formData.number,
            room_type: formData.type,
            floor: formData.floor,
            price: formData.price,
            capacity: formData.capacity,
            description: formData.description || null,
            features: formData.features.length > 0 ? formData.features.reduce((acc, feature) => {
              acc[feature] = true;
              return acc;
            }, {} as Record<string, boolean>) : null,
            status: 'active'
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding room:', error);
          alert(`Error al agregar habitación: ${error.message}`);
          return;
        }

        // Add to local state
        const transformedRoom: Room = {
          id: newRoom.id,
          number: newRoom.room_number,
          type: newRoom.room_type as Room['type'],
          floor: newRoom.floor,
          price: newRoom.price,
          capacity: newRoom.capacity,
          description: newRoom.description || '',
          status: 'available',
          size: newRoom.size || 0,
          view: newRoom.view || 'city',
          features: newRoom.features || [],
          amenities: newRoom.amenities || []
        };
        setRooms([...rooms, transformedRoom]);
      } else if (showEditModal && selectedRoom) {
        // Update room in database
        const { error } = await supabase
          .from('hl_rooms')
          .update({
            room_number: formData.number,
            room_type: formData.type,
            floor: formData.floor,
            price: formData.price,
            capacity: formData.capacity,
            description: formData.description || null,
            features: formData.features.length > 0 ? formData.features.reduce((acc, feature) => {
              acc[feature] = true;
              return acc;
            }, {} as Record<string, boolean>) : null
          })
          .eq('id', selectedRoom.id);

        if (error) {
          console.error('Error updating room:', error);
          alert(`Error al actualizar habitación: ${error.message}`);
          return;
        }

        // Update local state
        const updatedRooms = rooms.map(room => 
          room.id === selectedRoom.id 
            ? { ...room, ...formData }
            : room
        );
        setRooms(updatedRooms);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error al guardar habitación');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta habitación? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase
          .from('hl_rooms')
          .delete()
          .eq('id', roomId);

        if (error) {
          console.error('Error deleting room:', error);
          alert(`Error al eliminar habitación: ${error.message}`);
          return;
        }

        // Remove from local state
        setRooms(rooms.filter(room => room.id !== roomId));
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Error al eliminar habitación');
      }
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      // Convert UI status to database status
      const dbStatus = newStatus === 'available' ? 'active' : newStatus;
      
      const { data, error } = await supabase
        .from('hl_rooms')
        .update({ status: dbStatus })
        .eq('id', roomId)
        .select();

      if (error) {
        console.error('Error updating room status:', error);
        alert(`Error al actualizar el estado: ${error.message}`);
        return;
      }

      // Update local state
      setRooms(rooms.map(room => 
        room.id === roomId 
          ? { ...room, status: newStatus as Room['status'] }
          : room
      ));
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const handleTypeChange = (type: string) => {
    const selectedType = roomTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      capacity: selectedType?.capacity || 1,
      price: selectedType?.basePrice || 0
    });
  };

  const toggleFeature = (featureId: string) => {
    const currentFeatures = formData.features || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];
    setFormData({ ...formData, features: newFeatures });
  };

  const getStatusColor = (status: string) => {
    const statusObj = roomStatuses.find(s => s.value === status);
    return statusObj?.color || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const typeObj = roomTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const getViewLabel = (view: string) => {
    const viewObj = roomViews.find(v => v.value === view);
    return viewObj?.label || view;
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesType = filterType === 'all' || room.type === filterType;
    const matchesFloor = filterFloor === 'all' || room.floor.toString() === filterFloor;
    
    return matchesSearch && matchesStatus && matchesType && matchesFloor;
  });

  const uniqueFloors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray9 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4">Cargando habitaciones...</p>
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
                Gestión de Habitaciones
              </h1>
              <p className="text-gray4">
                Administra las habitaciones de tu hotel
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={loadRooms}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </Button>
            <Button 
              onClick={handleAddRoom}
              className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Habitación</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {roomStatuses.map((status) => {
            const count = rooms.filter(room => room.status === status.value).length;
            const StatusIcon = status.icon;
            return (
              <div key={status.value} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className={`${status.color} rounded-full p-2`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {count}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue1">{status.label}</p>
                  <p className="text-xs text-gray4 mt-1">{status.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Availability Summary */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-blue1 mb-4">Resumen de Disponibilidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {rooms.filter(r => r.status === 'available').length}
              </p>
              <p className="text-sm text-gray4">Disponibles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {rooms.filter(r => r.status === 'occupied').length}
              </p>
              <p className="text-sm text-gray4">Ocupadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {rooms.filter(r => r.status === 'maintenance' || r.status === 'cleaning').length}
              </p>
              <p className="text-sm text-gray4">En Servicio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue1">
                {rooms.length}
              </p>
              <p className="text-sm text-gray4">Total</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="Número o descripción..."
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
                {roomStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
              >
                <option value="all">Todos los tipos</option>
                {roomTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Piso</label>
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
              >
                <option value="all">Todos los pisos</option>
                {uniqueFloors.map((floor) => (
                  <option key={floor} value={floor.toString()}>
                    Piso {floor}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterType('all');
                  setFilterFloor('all');
                }}
              >
                <Filter className="h-4 w-4" />
                <span>Limpiar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Rooms by Floor */}
        {(() => {
          // Group rooms by floor
          const roomsByFloor = filteredRooms.reduce((acc, room) => {
            const floor = room.floor;
            if (!acc[floor]) {
              acc[floor] = [];
            }
            acc[floor].push(room);
            return acc;
          }, {} as Record<number, Room[]>);

          // Sort floors and rooms within each floor
          const sortedFloors = Object.keys(roomsByFloor)
            .map(Number)
            .sort((a, b) => a - b);

          return sortedFloors.map((floor) => (
            <div key={floor} className="mb-8">
              {/* Floor Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue8 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {floor}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue1">Piso {floor}</h2>
                    <p className="text-sm text-gray4">
                      {roomsByFloor[floor].length} habitación{roomsByFloor[floor].length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                      {roomsByFloor[floor].filter(r => r.status === 'available').length} Disponibles
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                      {roomsByFloor[floor].filter(r => r.status === 'occupied').length} Ocupadas
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {roomsByFloor[floor].filter(r => r.status === 'maintenance' || r.status === 'cleaning').length} En Servicio
                    </span>
                  </div>
                </div>
              </div>

              {/* Floor Divider */}
              <div className="border-b border-gray8 mb-6"></div>

              {/* Rooms Grid for this floor */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {roomsByFloor[floor]
                  .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                  .map((room) => {
                    const statusInfo = roomStatuses.find(s => s.value === room.status);
                    const StatusIcon = statusInfo?.icon || Clock;
                    
                    return (
                      <div key={room.id} className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                        room.status === 'available' ? 'border-green-200 hover:border-green-300' :
                        room.status === 'occupied' ? 'border-red-200 hover:border-red-300' :
                        room.status === 'maintenance' ? 'border-orange-200 hover:border-orange-300' :
                        room.status === 'cleaning' ? 'border-blue-200 hover:border-blue-300' :
                        'border-purple-200 hover:border-purple-300'
                      }`}>
                        <div className="p-6">
                          {/* Header with status */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-blue1">Habitación {room.number}</h3>
                              <p className="text-sm text-gray4">Piso {room.floor}</p>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo?.label}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status indicator */}
                          <div className={`w-full h-2 rounded-full mb-4 ${
                            room.status === 'available' ? 'bg-green-200' :
                            room.status === 'occupied' ? 'bg-red-200' :
                            room.status === 'maintenance' ? 'bg-orange-200' :
                            room.status === 'cleaning' ? 'bg-blue-200' :
                            'bg-purple-200'
                          }`}>
                            <div className={`h-full rounded-full transition-all duration-300 ${
                              room.status === 'available' ? 'bg-green-500' :
                              room.status === 'occupied' ? 'bg-red-500' :
                              room.status === 'maintenance' ? 'bg-orange-500' :
                              room.status === 'cleaning' ? 'bg-blue-500' :
                              'bg-purple-500'
                            }`} style={{ width: '100%' }}></div>
                          </div>
                          
                          {/* Room details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray4">Tipo:</span>
                              <span className="text-sm font-medium text-blue1">{getTypeLabel(room.type)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray4">Capacidad:</span>
                              <span className="text-sm font-medium text-blue1">{room.capacity} personas</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray4">Precio:</span>
                              <span className="text-sm font-medium text-green-600">{formatCLP(room.price)}</span>
                            </div>

                            {room.description && (
                              <div className="pt-2 border-t border-gray8">
                                <p className="text-xs text-gray4 italic">{room.description}</p>
                              </div>
                            )}
                            {room.features && Array.isArray(room.features) && room.features.length > 0 && (
                              <div className="pt-2 border-t border-gray8">
                                <p className="text-xs text-gray4 mb-1">Características:</p>
                                <div className="flex flex-wrap gap-1">
                                  {room.features.slice(0, 3).map((feature) => {
                                    const featureInfo = roomFeatures.find(f => f.id === feature);
                                    const FeatureIcon = featureInfo?.icon || Wifi;
                                    return (
                                      <span key={feature} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        <FeatureIcon className="h-3 w-3 mr-1" />
                                        {featureInfo?.label || feature}
                                      </span>
                                    );
                                  })}
                                  {room.features.length > 3 && (
                                    <span className="text-xs text-gray4">+{room.features.length - 3} más</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Status change dropdown */}
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray4 mb-1">Cambiar Estado</label>
                            <select
                              value={room.status}
                              onChange={(e) => handleStatusChange(room.id, e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 ${getStatusColor(room.status)}`}
                            >
                              {roomStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Action buttons */}
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditRoom(room)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ));
        })()}

        {filteredRooms.length === 0 && !loading && (
          <div className="text-center py-12">
            <Bed className="h-12 w-12 text-gray4 mx-auto mb-4" />
            <p className="text-gray4 mb-2">No se encontraron habitaciones</p>
            <p className="text-sm text-gray4">
              {rooms.length === 0 
                ? "No hay habitaciones registradas. Las habitaciones se crean automáticamente al registrar el hotel."
                : "No hay habitaciones que coincidan con los filtros aplicados."
              }
            </p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-blue1">
                  {showAddModal ? 'Agregar Habitación' : 'Editar Habitación'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedRoom(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue1">Información Básica</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Número de Habitación *</label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                      placeholder="101"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Tipo de Habitación *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    >
                      {roomTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} ({type.capacity} personas)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">Piso *</label>
                      <input
                        type="number"
                        value={formData.floor}
                        onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">Capacidad *</label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Precio por noche *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray4">$</span>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                        className="w-full pl-8 pr-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    {formData.price > 0 && (
                      <p className="text-xs text-gray4 mt-1">
                        Formato: {formatCLP(formData.price)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                      rows={3}
                      placeholder="Descripción de la habitación..."
                    />
                  </div>
                </div>

                {/* Features Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue1">Características de la Habitación</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {roomFeatures.map((feature) => {
                      const FeatureIcon = feature.icon;
                      const isSelected = (formData.features || []).includes(feature.id);
                      return (
                        <button
                          key={feature.id}
                          type="button"
                          onClick={() => toggleFeature(feature.id)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <FeatureIcon className="h-5 w-5" />
                          <span className="text-xs font-medium">{feature.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>


              
              <div className="flex space-x-4 mt-8">
                <Button 
                  onClick={handleSaveRoom}
                  className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2 flex-1"
                >
                  <Save className="h-4 w-4" />
                  <span>{showAddModal ? 'Agregar Habitación' : 'Guardar Cambios'}</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedRoom(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HotelLayout>
  );
}
