"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { Button } from "@/components/ui/button";
import { 
  Bed, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Check,
  X,
  Wifi,
  Tv,
  Thermometer,
  Droplets,
  Car,
  Coffee,
  Phone,
  Minus,
  Save,
  ArrowLeft,
  CreditCard,
  Upload,
  Image,
  Settings,
  Building2,
  AlertCircle
} from "lucide-react";
import { formatCLP } from "@/lib/currency";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import PlanLimitsAlert from "@/components/hotel/PlanLimitsAlert";

interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'triple' | 'quad' | 'suite' | 'family' | 'custom';
  floor: number;
  price: number;
  capacity: number;
  description?: string;
  features: {
    tv: boolean;
    wifi: boolean;
    heating: boolean;
    ac: boolean;
    privateBathroom: boolean;
    parking: boolean;
    coffeeMaker: boolean;
    phone: boolean;
    minibar: boolean;
    balcony: boolean;
    oceanView: boolean;
    mountainView: boolean;
  };
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
}

const roomTypes = [
  { value: 'single', label: 'Individual', capacity: 1, description: 'Habitación para una persona' },
  { value: 'double', label: 'Doble', capacity: 2, description: 'Habitación para dos personas' },
  { value: 'triple', label: 'Triple', capacity: 3, description: 'Habitación para tres personas' },
  { value: 'quad', label: 'Cuádruple', capacity: 4, description: 'Habitación para cuatro personas' },
  { value: 'suite', label: 'Suite', capacity: 2, description: 'Suite de lujo' },
  { value: 'family', label: 'Familiar', capacity: 6, description: 'Habitación familiar amplia' },
  { value: 'custom', label: 'Personalizada', capacity: 0, description: 'Capacidad personalizable' }
];

const roomFeatures = [
  { key: 'tv', label: 'TV', icon: Tv, description: 'Televisión' },
  { key: 'wifi', label: 'WiFi', icon: Wifi, description: 'Internet inalámbrico' },
  { key: 'heating', label: 'Calefacción', icon: Thermometer, description: 'Sistema de calefacción' },
  { key: 'ac', label: 'Aire Acondicionado', icon: Thermometer, description: 'Aire acondicionado' },
  { key: 'privateBathroom', label: 'Baño Privado', icon: Droplets, description: 'Baño privado' },
  { key: 'parking', label: 'Estacionamiento', icon: Car, description: 'Estacionamiento incluido' },
  { key: 'coffeeMaker', label: 'Cafetera', icon: Coffee, description: 'Cafetera en habitación' },
  { key: 'phone', label: 'Teléfono', icon: Phone, description: 'Teléfono interno' },
  { key: 'minibar', label: 'Minibar', icon: Coffee, description: 'Minibar' },
  { key: 'balcony', label: 'Balcón', icon: Bed, description: 'Balcón privado' },
  { key: 'oceanView', label: 'Vista al Mar', icon: Bed, description: 'Vista al océano' },
  { key: 'mountainView', label: 'Vista a la Montaña', icon: Bed, description: 'Vista a la montaña' }
];

function HotelAdminContent() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [activeTab, setActiveTab] = useState<'rooms' | 'settings'>('rooms');
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  const { validation, validateBeforeAdd, refreshStats } = usePlanValidation(businessId);

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    type: 'single' as Room['type'],
    floor: 1,
    price: 0,
    capacity: 1,
    description: '',
    features: {
      tv: false,
      wifi: false,
      heating: false,
      ac: false,
      privateBathroom: false,
      parking: false,
      coffeeMaker: false,
      phone: false,
      minibar: false,
      balcony: false,
      oceanView: false,
      mountainView: false
    },
    status: 'active' as Room['status']
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
        .select('id, business_name, rooms_count')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) {
        console.error('Error fetching business:', businessError);
        setLoading(false);
        return;
      }

      setBusinessId(businessData.id);

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
      const transformedRooms: Room[] = (roomsData || []).map(room => ({
        id: room.id,
        number: room.room_number,
        type: room.room_type as Room['type'],
        floor: room.floor,
        price: room.price,
        capacity: room.capacity,
        description: room.description || '',
        features: room.features || {
          tv: false,
          wifi: false,
          heating: false,
          ac: false,
          privateBathroom: false,
          parking: false,
          coffeeMaker: false,
          phone: false,
          minibar: false,
          balcony: false,
          oceanView: false,
          mountainView: false
        },
        status: room.status as Room['status'],
        createdAt: room.created_at
      }));

      setRooms(transformedRooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setLoading(false);
    }
  };


  const handleAddRoom = () => {
    // Validar límites del plan antes de permitir agregar habitación
    const validation = validateBeforeAdd('room');
    if (!validation.allowed) {
      alert(validation.message);
      return;
    }

    setFormData({
      number: '',
      type: 'single',
      floor: 1,
      price: 0,
      capacity: 1,
      description: '',
      features: {
        tv: false,
        wifi: false,
        heating: false,
        ac: false,
        privateBathroom: false,
        parking: false,
        coffeeMaker: false,
        phone: false,
        minibar: false,
        balcony: false,
        oceanView: false,
        mountainView: false
      },
      status: 'active'
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
      features: { ...room.features },
      status: room.status
    });
    setShowEditModal(true);
  };

  const handleSaveRoom = async () => {
    try {
      // Get current user's business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const { data: businessData } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (!businessData) {
        console.error('No business found');
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
            description: formData.description,
            features: formData.features,
            status: formData.status
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating room:', error);
          return;
        }

        // Reload rooms and refresh plan validation stats
        await loadRooms();
        refreshStats();
      } else if (showEditModal && selectedRoom) {
        // Update existing room in database
        const { error } = await supabase
          .from('hl_rooms')
          .update({
            room_number: formData.number,
            room_type: formData.type,
            floor: formData.floor,
            price: formData.price,
            capacity: formData.capacity,
            description: formData.description,
            features: formData.features,
            status: formData.status
          })
          .eq('id', selectedRoom.id);

        if (error) {
          console.error('Error updating room:', error);
          return;
        }

        // Reload rooms
        await loadRooms();
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta habitación?')) {
      try {
        const { error } = await supabase
          .from('hl_rooms')
          .delete()
          .eq('id', roomId);

        if (error) {
          console.error('Error deleting room:', error);
          return;
        }

        // Reload rooms
        await loadRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  const handleTypeChange = (type: Room['type']) => {
    const typeConfig = roomTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      capacity: type === 'custom' ? formData.capacity : (typeConfig?.capacity || 1)
    });
  };

  const toggleFeature = (featureKey: keyof Room['features']) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [featureKey]: !formData.features[featureKey]
      }
    });
  };

  const getTypeLabel = (type: string) => {
    const typeObj = roomTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const getActiveFeatures = (features: Room['features']) => {
    return Object.entries(features)
      .filter(([_, value]) => value)
      .map(([key]) => key);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || room.type === filterType;
    const matchesFloor = filterFloor === 'all' || room.floor.toString() === filterFloor;
    
    return matchesSearch && matchesType && matchesFloor;
  });

  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(r => r.status === 'active').length;
  const totalRevenue = rooms.reduce((sum, r) => sum + r.price, 0);

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
            <p className="text-gray4">Cargando habitaciones...</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">
              Administración del Hotel
            </h1>
            <p className="text-gray4">
              Gestiona las habitaciones y configuración del hotel
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray8">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'rooms'
                    ? 'border-blue8 text-blue8'
                    : 'border-transparent text-gray4 hover:text-blue1'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bed className="h-4 w-4" />
                  <span>Habitaciones</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue8 text-blue8'
                    : 'border-transparent text-gray4 hover:text-blue1'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'rooms' && (
          <>
            {/* Plan Limits Alert */}
            {businessId && (
              <PlanLimitsAlert 
                businessId={businessId}
                onUpgrade={() => window.open('/pricing', '_blank')}
              />
            )}

            {/* Add Room Button */}
            <div className="flex justify-end mb-6">
              <Button 
                onClick={handleAddRoom}
                className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2"
                disabled={!validation.canAddRooms}
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Habitación</span>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4">Total Habitaciones</p>
                <p className="text-3xl font-bold text-blue1">{totalRooms}</p>
              </div>
              <Bed className="h-12 w-12 text-blue8" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4">Habitaciones Activas</p>
                <p className="text-3xl font-bold text-green-600">{activeRooms}</p>
              </div>
              <Check className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4">Valor Total</p>
                <p className="text-3xl font-bold text-purple-600">${totalRevenue.toLocaleString()}</p>
              </div>
              <CreditCard className="h-12 w-12 text-purple-600" />
            </div>
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
                  placeholder="Número o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                />
              </div>
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
                {Array.from(new Set(rooms.map(r => r.floor))).sort().map((floor) => (
                  <option key={floor} value={floor}>
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

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow-sm border border-gray8 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue1">Habitación {room.number}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.status === 'active' ? 'bg-green-100 text-green-800' : 
                    room.status === 'maintenance' ? 'bg-orange-100 text-orange-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {room.status === 'active' ? 'Activa' : 
                     room.status === 'maintenance' ? 'Mantenimiento' : 'Inactiva'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray4">
                    <span className="font-medium">Tipo:</span> {getTypeLabel(room.type)}
                  </p>
                  <p className="text-sm text-gray4">
                    <span className="font-medium">Piso:</span> {room.floor}
                  </p>
                  <p className="text-sm text-gray4">
                    <span className="font-medium">Capacidad:</span> {room.capacity} personas
                  </p>
                  <p className="text-sm text-gray4">
                    <span className="font-medium">Precio:</span> ${room.price.toLocaleString()}
                  </p>
                  {room.description && (
                    <p className="text-sm text-gray4">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray4 mb-2">Características:</p>
                  <div className="flex flex-wrap gap-1">
                    {getActiveFeatures(room.features).map((featureKey) => {
                      const feature = roomFeatures.find(f => f.key === featureKey);
                      if (!feature) return null;
                      const Icon = feature.icon;
                      return (
                        <span
                          key={featureKey}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue15 text-blue8"
                          title={feature.description}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {feature.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

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
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Bed className="h-12 w-12 text-gray4 mx-auto mb-4" />
            <p className="text-gray4">No se encontraron habitaciones</p>
          </div>
        )}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Hotel Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-blue1 mb-6 font-title">
                Información del Hotel
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Nombre del Hotel</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="Nombre del hotel"
                    defaultValue="Hotel Ejemplo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Dirección</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="Dirección completa"
                    defaultValue="Av. Principal 123, Ciudad"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="+56 9 1234 5678"
                    defaultValue="+56 9 1234 5678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="info@hotel.com"
                    defaultValue="info@hotel.com"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-blue1 mb-6 font-title">
                Logo del Hotel
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  {/* Current Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gray10 rounded-lg border-2 border-dashed border-gray8 flex items-center justify-center">
                      <div className="text-center">
                        <Building2 className="h-12 w-12 text-gray4 mx-auto mb-2" />
                        <p className="text-sm text-gray4">Logo actual</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload Section */}
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray8 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-gray4 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-blue1 mb-2">
                        Subir nuevo logo
                      </h3>
                      <p className="text-sm text-gray4 mb-4">
                        PNG, JPG o SVG hasta 2MB
                      </p>
                      <Button className="bg-blue8 hover:bg-blue6 text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar archivo
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray4">
                  <p><strong>Recomendaciones:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Formato: PNG, JPG o SVG</li>
                    <li>Tamaño máximo: 2MB</li>
                    <li>Dimensiones recomendadas: 200x200px mínimo</li>
                    <li>Fondo transparente para mejor resultado</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Branding Colors */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-blue1 mb-6 font-title">
                Colores de la Marca
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Color Principal</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      className="w-12 h-12 rounded-lg border border-gray8 cursor-pointer"
                      defaultValue="#0078ff"
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                      defaultValue="#0078ff"
                      placeholder="#0078ff"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Color Secundario</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      className="w-12 h-12 rounded-lg border border-gray8 cursor-pointer"
                      defaultValue="#001a33"
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                      defaultValue="#001a33"
                      placeholder="#001a33"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Color de Acento</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      className="w-12 h-12 rounded-lg border border-gray8 cursor-pointer"
                      defaultValue="#daa520"
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                      defaultValue="#daa520"
                      placeholder="#daa520"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button className="bg-blue8 hover:bg-blue6 text-white px-8">
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-blue1 mb-4">
              {showAddModal ? 'Agregar Habitación' : 'Editar Habitación'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue1">Información Básica</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Número</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    placeholder="101"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as Room['type'])}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  >
                    {roomTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Piso</label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Capacidad</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                      min="1"
                      disabled={formData.type !== 'custom'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Precio por Noche</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Room['status']})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
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

              {/* Features */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue1">Características</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {roomFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isActive = formData.features[feature.key as keyof Room['features']];
                    
                    return (
                      <Button
                        key={feature.key}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={`justify-start h-auto p-3 ${
                          isActive 
                            ? 'bg-blue8 text-white hover:bg-blue6' 
                            : 'text-gray4 hover:text-blue1 hover:bg-blue15'
                        }`}
                        onClick={() => toggleFeature(feature.key as keyof Room['features'])}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium text-sm">{feature.label}</div>
                          <div className="text-xs opacity-75">{feature.description}</div>
                        </div>
                        {isActive && <Check className="h-4 w-4 ml-auto" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button 
                onClick={handleSaveRoom}
                className="bg-blue8 hover:bg-blue6 text-white flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {showAddModal ? 'Crear Habitación' : 'Guardar Cambios'}
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
  );
}

export default function HotelAdmin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HotelAdminContent />
    </Suspense>
  );
}