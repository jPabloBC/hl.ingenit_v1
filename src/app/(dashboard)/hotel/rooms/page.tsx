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
  XCircle as NoSmoking,
  Wrench
} from "lucide-react";
import { formatCLP } from "@/lib/currency";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import PlanLimitsAlert from "@/components/hotel/PlanLimitsAlert";

interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'twin' | 'triple' | 'quad' | 'suite' | 'family' | 'presidential';
  floor: number;
  status: 'active' | 'inactive' | 'maintenance' | 'cleaning';
  price: number;
  capacity: number;
  bed_count?: number;
  bed_type?: string;
  bed_configuration?: string;
  description?: string;
  features?: string[];
  size?: number;
  view?: string;
  amenities?: string[];
}

const roomTypes = [
  { value: 'single', label: 'Individual', capacity: 1, bedCount: 1, bedConfig: '1 single', basePrice: 25000 },
  { value: 'double', label: 'Doble', capacity: 2, bedCount: 1, bedConfig: '1 double', basePrice: 35000 },
  { value: 'triple', label: 'Triple', capacity: 3, bedCount: 2, bedConfig: '1 double + 1 single', basePrice: 45000 },
  { value: 'quad', label: 'Cuádruple', capacity: 4, bedCount: 2, bedConfig: '2 double', basePrice: 55000 },
  { value: 'suite', label: 'Suite', capacity: 2, bedCount: 1, bedConfig: '1 king', basePrice: 75000 },
  { value: 'family', label: 'Familiar', capacity: 6, bedCount: 3, bedConfig: '1 double + 2 single', basePrice: 65000 },
  { value: 'presidential', label: 'Presidencial', capacity: 4, bedCount: 2, bedConfig: '1 king + 1 queen', basePrice: 120000 }
];

const roomStatuses = [
  { 
    value: 'active', 
    label: 'Activa', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Habitación operativa y lista para usar'
  },
  { 
    value: 'inactive', 
    label: 'Inactiva', 
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
    description: 'Habitación fuera de servicio'
  },
  { 
    value: 'maintenance', 
    label: 'Mantenimiento', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle,
    description: 'Habitación en mantenimiento'
  },
  { 
    value: 'cleaning', 
    label: 'Limpieza', 
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    description: 'Habitación en proceso de limpieza'
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

function RoomsManagementContent() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomSchedules, setRoomSchedules] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    status: 'maintenance' as 'maintenance' | 'inactive',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    type: '',
    status: '',
    price: 0,
    capacity: 0,
    bed_count: 0,
    bed_type: '',
    features: [] as string[]
  });

  // Hook de validación de límites
  const { validation, validateBeforeAdd, refreshStats, selectedPlan } = usePlanValidation(businessId);

  // Function to get common features among selected rooms
  const getCommonFeatures = (selectedRoomIds: string[]) => {
    if (selectedRoomIds.length === 0) return [];
    
    const selectedRoomsData = rooms.filter(room => selectedRoomIds.includes(room.id));
    if (selectedRoomsData.length === 0) return [];
    
    // Get features from first room
    const firstRoomFeatures = selectedRoomsData[0].features || [];
    
    // Find features that are common to ALL selected rooms
    const commonFeatures = firstRoomFeatures.filter(feature => 
      selectedRoomsData.every(room => 
        room.features && room.features.includes(feature)
      )
    );
    
    return commonFeatures;
  };

  // Function to get common values for other fields
  const getCommonValues = (selectedRoomIds: string[]) => {
    if (selectedRoomIds.length === 0) return { type: '', status: '', price: 0, capacity: 0 };
    
    const selectedRoomsData = rooms.filter(room => selectedRoomIds.includes(room.id));
    if (selectedRoomsData.length === 0) return { type: '', status: '', price: 0, capacity: 0 };
    
    const firstRoom = selectedRoomsData[0];
    
    // Check if all rooms have the same value for each field
    const allSameType = selectedRoomsData.every(room => room.type === firstRoom.type);
    const allSameStatus = selectedRoomsData.every(room => room.status === firstRoom.status);
    const allSamePrice = selectedRoomsData.every(room => room.price === firstRoom.price);
    const allSameCapacity = selectedRoomsData.every(room => room.capacity === firstRoom.capacity);
    
    return {
      type: allSameType ? firstRoom.type : '',
      status: allSameStatus ? firstRoom.status : '',
      price: allSamePrice ? firstRoom.price : 0,
      capacity: allSameCapacity ? firstRoom.capacity : 0
    };
  };

  // Function to get capacity for a room type
  const getCapacityForType = (type: string) => {
    const roomType = roomTypes.find(rt => rt.value === type);
    return roomType ? roomType.capacity : 1;
  };

  // Function to get bed configuration for a room type
  const getBedConfigForType = (type: string) => {
    const roomType = roomTypes.find(rt => rt.value === type);
    return roomType ? roomType.bedConfig : '1 single';
  };

  // Function to get valid bed configurations for room type and capacity
  const getValidBedConfigs = (type: string, capacity: number) => {
    const configs = [];
    
    switch (type) {
      case 'single':
        if (capacity === 1) {
          configs.push({ bed_count: 1, bed_type: 'single', description: '1 cama individual' });
        }
        break;
        
      case 'double':
        if (capacity === 2) {
          configs.push(
            { bed_count: 1, bed_type: 'double', description: '1 cama doble' },
            { bed_count: 2, bed_type: 'single', description: '2 camas individuales' }
          );
        }
        break;
        
        
      case 'triple':
        if (capacity === 3) {
          configs.push(
            { bed_count: 3, bed_type: 'single', description: '3 camas individuales' },
            { bed_count: 2, bed_type: 'mixed', description: '1 cama doble + 1 individual' }
          );
        }
        break;
        
      case 'quadruple':
        if (capacity === 4) {
          configs.push(
            { bed_count: 4, bed_type: 'single', description: '4 camas individuales' },
            { bed_count: 2, bed_type: 'double', description: '2 camas dobles' },
            { bed_count: 3, bed_type: 'mixed', description: '1 cama doble + 2 individuales' },
            { bed_count: 1, bed_type: 'king', description: '1 cama king (para 4 personas)' },
            { bed_count: 2, bed_type: 'queen', description: '2 camas queen' }
          );
        }
        break;
        
      case 'quad':
        if (capacity === 4) {
          configs.push(
            { bed_count: 4, bed_type: 'single', description: '4 camas individuales' },
            { bed_count: 2, bed_type: 'double', description: '2 camas dobles' },
            { bed_count: 3, bed_type: 'mixed', description: '1 cama doble + 2 individuales' },
            { bed_count: 1, bed_type: 'king', description: '1 cama king (para 4 personas)' },
            { bed_count: 2, bed_type: 'queen', description: '2 camas queen' }
          );
        }
        break;
        
      case 'suite':
        if (capacity >= 2) {
          configs.push(
            { bed_count: 2, bed_type: 'mixed', description: '1 cama king + 1 individual' },
            { bed_count: 1, bed_type: 'king', description: '1 cama king' }
          );
        }
        break;
        
      case 'family':
        if (capacity >= 4) {
          configs.push(
            { bed_count: 4, bed_type: 'mixed', description: '2 camas dobles + 2 individuales' },
            { bed_count: 3, bed_type: 'mixed', description: '1 cama king + 2 individuales' },
            { bed_count: 2, bed_type: 'double', description: '2 camas dobles (para 4 personas)' },
            { bed_count: 1, bed_type: 'king', description: '1 cama king (para 4 personas)' }
          );
        }
        break;
        
      case 'presidential':
        if (capacity >= 4) {
          configs.push(
            { bed_count: 2, bed_type: 'king', description: '2 camas king' },
            { bed_count: 1, bed_type: 'king', description: '1 cama king (para 4 personas)' },
            { bed_count: 3, bed_type: 'mixed', description: '1 cama king + 2 individuales' },
            { bed_count: 4, bed_type: 'single', description: '4 camas individuales de lujo' }
          );
        }
                break;
      }
      
      // Caso genérico para habitaciones de mayor capacidad
      if (capacity >= 4 && !['quad', 'family', 'presidential'].includes(type)) {
        configs.push(
          { bed_count: 4, bed_type: 'single', description: '4 camas individuales' },
          { bed_count: 2, bed_type: 'double', description: '2 camas dobles' },
          { bed_count: 3, bed_type: 'mixed', description: '1 cama doble + 2 individuales' },
          { bed_count: 1, bed_type: 'king', description: '1 cama king (para 4 personas)' },
          { bed_count: 2, bed_type: 'queen', description: '2 camas queen' }
        );
      }
      
      return configs;
  };

  // Function to validate bed configuration
  const validateBedConfig = (type: string, capacity: number, bedCount: number, bedType: string) => {
    const validConfigs = getValidBedConfigs(type, capacity);
    return validConfigs.some(config => 
      config.bed_count === bedCount && config.bed_type === bedType
    );
  };

  // Function to get default bed configuration for type and capacity
  const getDefaultBedConfig = (type: string, capacity: number) => {
    const validConfigs = getValidBedConfigs(type, capacity);
    return validConfigs[0] || { bed_count: 1, bed_type: 'single', description: '1 cama individual' };
  };

  // Function to get base price for a room type
  const getBasePriceForType = (type: string) => {
    const roomType = roomTypes.find(rt => rt.value === type);
    return roomType ? roomType.basePrice : 25000;
  };
  
  // Function to validate room type
  const validateRoomType = (type: string): Room['type'] => {
    const validTypes: Room['type'][] = ['single', 'double', 'triple', 'quad', 'suite', 'family', 'presidential'];
    return validTypes.includes(type as Room['type']) ? (type as Room['type']) : 'single';
  };

  // Selection and bulk edit functions
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const selectAllRooms = () => {
    setSelectedRooms(rooms.map(room => room.id));
  };

  const clearSelection = () => {
    setSelectedRooms([]);
  };

  const handleBulkEdit = async () => {
    if (selectedRooms.length === 0) return;
    
    try {
            // Build the update data object with only the fields that have values
      const updateData: any = {};
      
      // Only update fields that exist in the database
      if (bulkEditData.type) {
        updateData.room_type = bulkEditData.type;
        
        // If type is changed, ensure capacity is consistent
        if (bulkEditData.capacity > 0) {
          const maxCapacity = getCapacityForType(bulkEditData.type);
          if (bulkEditData.capacity > maxCapacity) {
            alert(`La capacidad no puede superar ${maxCapacity} personas para habitaciones tipo ${bulkEditData.type}`);
            return;
          }
          updateData.capacity = bulkEditData.capacity;
        } else {
          // Auto-set capacity if not specified
          updateData.capacity = getCapacityForType(bulkEditData.type);
        }
      } else if (bulkEditData.capacity > 0) {
        // Validate capacity against current room type
        const currentType = rooms.find(room => selectedRooms.includes(room.id))?.type || 'single';
        const maxCapacity = getCapacityForType(currentType);
        if (bulkEditData.capacity > maxCapacity) {
          alert(`La capacidad no puede superar ${maxCapacity} personas para habitaciones tipo ${currentType}`);
          return;
        }
        updateData.capacity = bulkEditData.capacity;
      }
      
      if (bulkEditData.status) updateData.status = bulkEditData.status;
      if (bulkEditData.price > 0) updateData.price = bulkEditData.price;
      
      // Bed configuration validation - TEMPORARILY DISABLED
      // TODO: Re-enable when bed_count and bed_type columns are available in the database
      if (bulkEditData.bed_count > 0 && bulkEditData.bed_type) {
        if (!validateBedConfig(bulkEditData.type || 'single', bulkEditData.capacity || 1, bulkEditData.bed_count, bulkEditData.bed_type)) {
          alert(`Configuración de camas inválida para habitación ${bulkEditData.type} con capacidad ${bulkEditData.capacity}`);
          return;
        }
        updateData.bed_count = bulkEditData.bed_count;
        updateData.bed_type = bulkEditData.bed_type;
        console.log('✅ Bed configuration update enabled');
      }
      
      if (bulkEditData.features && bulkEditData.features.length > 0) {
        // Convert array to JSONB object format
        const featuresObj: any = {};
        bulkEditData.features.forEach(feature => {
          featuresObj[feature] = true;
        });
        updateData.features = featuresObj;
      }

      // Check if there are any fields to update
      if (Object.keys(updateData).length === 0) {
        alert('No hay campos para actualizar');
        return;
      }

      console.log('Bulk edit update data:', updateData);
      console.log('Updating rooms:', selectedRooms);

      // Update each room individually to avoid constraint issues
      let successCount = 0;
      let errorCount = 0;

      for (const roomId of selectedRooms) {
        console.log(`🔄 Updating room ${roomId} with data:`, updateData);
        
        // Try updating through the view first
        let { data, error } = await supabase
          .from('hl_rooms')
          .update(updateData)
          .eq('id', roomId)
          .select();

        // If view update fails, try direct table update
        if (error && error.code === 'PGRST204') {
          console.log(`⚠️ View update failed, trying direct table update for room ${roomId}`);
          
          const { data: tableData, error: tableError } = await supabase
            .from('app_hl.hl_rooms')
            .update(updateData)
            .eq('id', roomId)
            .select();
            
          if (tableError) {
            console.error(`❌ Direct table update also failed for room ${roomId}:`, tableError);
            errorCount++;
          } else {
            console.log(`✅ Direct table update successful for room ${roomId}:`, tableData);
            successCount++;
          }
        } else if (error) {
          console.error(`❌ Error updating room ${roomId}:`, error);
          errorCount++;
        } else {
          console.log(`✅ Successfully updated room ${roomId}:`, data);
          successCount++;
        }
      }

      if (errorCount > 0) {
        alert(`Se actualizaron ${successCount} habitaciones, pero hubo errores en ${errorCount} habitaciones.`);
      } else {
        alert(`${successCount} habitación${successCount !== 1 ? 'es' : ''} actualizada${successCount !== 1 ? 's' : ''} exitosamente`);
      }

      // Refresh rooms data
      console.log('🔄 Refreshing rooms data after bulk update...');
      await loadRooms();
      console.log('✅ Rooms data refreshed successfully');
      
      setShowBulkEditModal(false);
      setSelectedRooms([]);
      setBulkEditData({ type: '', status: '', price: 0, capacity: 0, bed_count: 0, bed_type: '', features: [] });
    } catch (error) {
      console.error('Error in bulk edit:', error);
      alert('Error inesperado al actualizar habitaciones');
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    type: 'single',
    floor: 1,
    price: 0,
    capacity: 1,
    bed_count: 1,
    bed_type: 'single',
    size: 0,
    view: 'city',
    features: [] as string[],
    amenities: [] as string[]
  });

  // Bulk add form state
  const [bulkFormData, setBulkFormData] = useState({
    floor: 1,
    count: 1,
    type: 'single',
    price: 25000,
    capacity: 1,
    bed_count: 1,
    bed_type: 'single',
    features: [] as string[]
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

      // Set business ID for validation
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

      // Debug: Log raw room data to see what columns are available
      console.log('🔍 Raw room data from database:', roomsData);
      if (roomsData && roomsData.length > 0) {
        console.log('🔍 First room structure:', roomsData[0]);
        console.log('🔍 Available columns:', Object.keys(roomsData[0]));
        
        // Check bed configuration values specifically
        const firstRoom = roomsData[0];
        console.log('🔍 bed_count value:', firstRoom.bed_count);
        console.log('🔍 bed_type value:', firstRoom.bed_type);
        console.log('🔍 bed_configuration value:', firstRoom.bed_configuration);
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
          type: validateRoomType(room.room_type),
          floor: room.floor,
          price: room.price,
          capacity: room.capacity,
          bed_count: room.bed_count || 1,
          bed_type: room.bed_type || 'single',
          status: room.status as Room['status'],
          size: 0, // Default value since column doesn't exist
          view: 'city', // Default value since column doesn't exist
          features: featuresArray,
          amenities: [] // Default value since column doesn't exist
        };
      });

      setRooms(transformedRooms);
      
      // Load room schedules
      await loadRoomSchedules(businessData.id);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setLoading(false);
    }
  };

  const loadRoomSchedules = async (businessId: string) => {
    try {
      // Use RPC function to get schedules
      const { data: schedulesData, error } = await supabase
        .rpc('get_room_schedules', {
          p_business_id: businessId
        });

      if (error) {
        console.error('Error loading schedules:', error);
        return;
      }

      // Group schedules by room_id
      const schedulesByRoom: {[key: string]: any[]} = {};
      schedulesData?.forEach((schedule: any) => {
        if (!schedulesByRoom[schedule.room_id]) {
          schedulesByRoom[schedule.room_id] = [];
        }
        schedulesByRoom[schedule.room_id].push(schedule);
      });

      setRoomSchedules(schedulesByRoom);
    } catch (error) {
      console.error('Error loading room schedules:', error);
    }
  };

  // Function to get next room number for a specific floor
  const getNextRoomNumber = (floor: number) => {
    const floorRooms = rooms.filter(room => room.floor === floor);
    if (floorRooms.length === 0) {
      return `${floor}01`; // First room on floor
    }
    
    // Get the highest room number on this floor
    const roomNumbers = floorRooms.map(room => parseInt(room.number));
    const maxNumber = Math.max(...roomNumbers);
    return (maxNumber + 1).toString();
  };

  const handleAddRoom = () => {
    // Validar límites de plan antes de abrir modal
    const validationResult = validateBeforeAdd('room');
    if (!validationResult.allowed) {
      alert(validationResult.message);
      return;
    }

    const nextNumber = getNextRoomNumber(1); // Default to floor 1
    const defaultBedConfig = getDefaultBedConfig('single', 1);
    
    setFormData({
      number: nextNumber,
      type: 'single',
      floor: 1,
      price: 25000,
      capacity: 1,
      bed_count: defaultBedConfig.bed_count,
      bed_type: defaultBedConfig.bed_type,
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
      bed_count: room.bed_count || 1,
      bed_type: room.bed_type || 'single',
      size: 0, // Default value since column doesn't exist
      view: 'city', // Default value since column doesn't exist
      features: Array.isArray(room.features) ? room.features : [],
      amenities: [] as string[] // Default value since column doesn't exist
    });
    setShowEditModal(true);
  };

  const handleBulkAddRooms = () => {
    // Validar límites de plan antes de abrir modal
    const validationResult = validateBeforeAdd('room');
    if (!validationResult.allowed) {
      alert(validationResult.message);
      return;
    }

    const defaultBedConfig = getDefaultBedConfig('single', 1);
    
    setBulkFormData({
      floor: 1,
      count: 1,
      type: 'single',
      price: 25000,
      capacity: 1,
      bed_count: defaultBedConfig.bed_count,
      bed_type: defaultBedConfig.bed_type,
      features: []
    });
    setShowBulkAddModal(true);
  };

  const handleFloorChange = (newFloor: number) => {
    const nextNumber = getNextRoomNumber(newFloor);
    setFormData({
      ...formData,
      floor: newFloor,
      number: nextNumber
    });
  };

  const handleBulkFloorChange = (newFloor: number) => {
    setBulkFormData({
      ...bulkFormData,
      floor: newFloor
    });
  };

  const toggleBulkFeature = (featureId: string) => {
    const currentFeatures = Array.isArray(bulkFormData.features) ? bulkFormData.features : [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];
    setBulkFormData({ ...bulkFormData, features: newFeatures });
  };

  const handleSaveRoom = async () => {
    try {
      // Validar límites de plan si es una nueva habitación
      if (showAddModal) {
        const validationResult = validateBeforeAdd('room');
        if (!validationResult.allowed) {
          alert(validationResult.message);
          return;
        }
      }

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

      // Validate capacity doesn't exceed room type maximum
      const maxCapacity = getCapacityForType(formData.type);
      if (formData.capacity > maxCapacity) {
        alert(`La capacidad no puede superar ${maxCapacity} personas para habitaciones tipo ${formData.type}`);
        return;
      }

      // Validar configuración de camas
      const validBedConfigs = getValidBedConfigs(formData.type, formData.capacity);
      
      if (!validateBedConfig(formData.type, formData.capacity, formData.bed_count, formData.bed_type)) {
        alert(`Configuración de camas inválida para habitación ${formData.type} con capacidad ${formData.capacity}. Las opciones válidas son:\n${validBedConfigs.map(config => `• ${config.description}`).join('\n')}`);
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
            bed_count: formData.bed_count,
            bed_type: formData.bed_type,
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
          type: validateRoomType(newRoom.room_type),
          floor: newRoom.floor,
          price: newRoom.price,
          capacity: newRoom.capacity,
          status: 'active',
          size: newRoom.size || 0,
          view: newRoom.view || 'city',
          features: Array.isArray(formData.features) ? formData.features : [],
          amenities: newRoom.amenities || []
        };
        setRooms([...rooms, transformedRoom]);
        
        // Show success message
        alert('Habitación agregada exitosamente');
        
        // Refresh stats after adding room
        refreshStats();
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
            bed_count: formData.bed_count,
            bed_type: formData.bed_type,
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
            ? { 
                ...room, 
                number: formData.number,
                type: validateRoomType(formData.type),
                floor: formData.floor,
                price: formData.price,
                capacity: formData.capacity,
                features: Array.isArray(formData.features) ? formData.features : []
              }
            : room
        );
        setRooms(updatedRooms);
        
        // Show success message
        alert('Habitación actualizada exitosamente');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error al guardar habitación');
    }
  };

  const handleBulkSaveRooms = async () => {
    try {
      // Validar límites de plan antes de crear habitaciones en lote
      const validationResult = validateBeforeAdd('room');
      if (!validationResult.allowed) {
        alert(validationResult.message);
        return;
      }

      // Verificar si la cantidad solicitada excede el límite del plan
      const currentRoomCount = validation.currentStats.rooms;
      const totalAfterBulk = currentRoomCount + bulkFormData.count;
      
      if (selectedPlan && selectedPlan.limits.maxRooms !== -1 && totalAfterBulk > selectedPlan.limits.maxRooms) {
        const remainingRooms = selectedPlan.limits.maxRooms - currentRoomCount;
        alert(`No puedes crear ${bulkFormData.count} habitaciones. Tu plan permite máximo ${selectedPlan.limits.maxRooms} habitaciones y ya tienes ${currentRoomCount}. Solo puedes agregar ${remainingRooms} habitaciones más.`);
        return;
      }

      // Validate form data
      if (bulkFormData.count <= 0 || bulkFormData.count > 50) {
        alert('La cantidad debe estar entre 1 y 50 habitaciones');
        return;
      }
      
      if (bulkFormData.price <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
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

      // Get starting room number for the floor
      const startingNumber = getNextRoomNumber(bulkFormData.floor);
      const startingNumberInt = parseInt(startingNumber);

      // Validate capacity doesn't exceed room type maximum
      const maxCapacity = getCapacityForType(bulkFormData.type);
      if (bulkFormData.capacity > maxCapacity) {
        alert(`La capacidad no puede superar ${maxCapacity} personas para habitaciones tipo ${bulkFormData.type}`);
        return;
      }

      // Prepare rooms data
      const roomsToInsert = [];
      for (let i = 0; i < bulkFormData.count; i++) {
        const roomNumber = (startingNumberInt + i).toString();
        
        // Check if room number already exists
        const existingRoom = rooms.find(room => room.number === roomNumber);
        if (existingRoom) {
          alert(`La habitación ${roomNumber} ya existe. Deteniendo la creación masiva.`);
          return;
        }

        roomsToInsert.push({
          business_id: businessData.id,
          room_number: roomNumber,
          room_type: bulkFormData.type,
          floor: bulkFormData.floor,
          price: bulkFormData.price,
          capacity: bulkFormData.capacity,
          bed_count: bulkFormData.bed_count,
          bed_type: bulkFormData.bed_type,
          features: bulkFormData.features.length > 0 ? bulkFormData.features.reduce((acc, feature) => {
            acc[feature] = true;
            return acc;
          }, {} as Record<string, boolean>) : null,
          status: 'active'
        });
      }

      // Insert all rooms
      const { data: newRooms, error } = await supabase
        .from('hl_rooms')
        .insert(roomsToInsert)
        .select();

      if (error) {
        console.error('Error adding rooms:', error);
        alert(`Error al agregar habitaciones: ${error.message}`);
        return;
      }

      // Add to local state
      const transformedRooms: Room[] = (newRooms || []).map(room => {
        let featuresArray: string[] = [];
        if (room.features && typeof room.features === 'object') {
          featuresArray = Object.keys(room.features).filter(key => room.features[key] === true);
        }
        
        return {
          id: room.id,
          number: room.room_number,
          type: validateRoomType(room.room_type),
          floor: room.floor,
          price: room.price,
          capacity: room.capacity,
          status: 'active',
          size: 0,
          view: 'city',
          features: featuresArray,
          amenities: []
        };
      });

      setRooms([...rooms, ...transformedRooms]);
      
      // Show success message
      alert(`${bulkFormData.count} habitaciones agregadas exitosamente`);
      
      setShowBulkAddModal(false);
    } catch (error) {
      console.error('Error saving rooms:', error);
      alert('Error al guardar habitaciones');
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
        
        // Show success message
        alert('Habitación eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Error al eliminar habitación');
      }
    }
  };

  const handleSaveSchedule = async () => {
    try {
      if (!selectedRoom) return;

      // Validate form data
      if (!scheduleFormData.start_date || !scheduleFormData.end_date) {
        alert('Las fechas son requeridas');
        return;
      }
      
      if (new Date(scheduleFormData.end_date) < new Date(scheduleFormData.start_date)) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
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

      // Add schedule using RPC function
      const { data: result, error } = await supabase
        .rpc('add_room_schedule', {
          p_room_id: selectedRoom.id,
          p_business_id: businessData.id,
          p_status: scheduleFormData.status,
          p_start_date: scheduleFormData.start_date,
          p_end_date: scheduleFormData.end_date,
          p_reason: scheduleFormData.reason || null
        });

      if (error) {
        console.error('Error adding schedule:', error);
        alert(`Error al agregar programación: ${error.message}`);
        return;
      }

      if (!result.success) {
        alert(`Error: ${result.message}`);
        return;
      }

      alert('Programación agregada exitosamente');
      setShowScheduleModal(false);
      setSelectedRoom(null);
      setScheduleFormData({
        status: 'maintenance',
        start_date: '',
        end_date: '',
        reason: ''
      });
      
      // Reload rooms and schedules
      await loadRooms();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error al guardar programación');
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      // Si es maintenance o inactive, mostrar modal de programación
      if (newStatus === 'maintenance' || newStatus === 'inactive') {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          setSelectedRoom(room);
          setScheduleFormData({
            status: newStatus as 'maintenance' | 'inactive',
            start_date: '',
            end_date: '',
            reason: ''
          });
          setShowScheduleModal(true);
        }
        return;
      }

      // Si es 'active' o 'cleaning', eliminar todas las programaciones existentes
      if (newStatus === 'active' || newStatus === 'cleaning') {
        // Eliminar programaciones usando RPC
        await supabase.rpc('delete_room_schedules_by_room', {
          p_room_id: roomId
        });
      }

      // Para otros status, actualizar directamente
      const { data, error } = await supabase
        .from('hl_rooms')
        .update({ status: newStatus })
        .eq('id', roomId)
        .select();

      if (error) {
        console.error('Error updating room status:', error);
        alert(`Error al actualizar el estado: ${error.message}`);
        return;
      }

      // Reload everything to update the UI correctly
      await loadRooms();
      
      // Show success message
      alert('Estado de habitación actualizado exitosamente');
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const handleTypeChange = (type: string) => {
    const selectedType = roomTypes.find(t => t.value === type);
    const newCapacity = selectedType?.capacity || 1;
    
    // Obtener configuración de camas por defecto para el nuevo tipo y capacidad
    const defaultBedConfig = getDefaultBedConfig(type, newCapacity);
    
    setFormData({
      ...formData,
      type,
      capacity: newCapacity,
      price: selectedType?.basePrice || 0,
      bed_count: defaultBedConfig.bed_count,
      bed_type: defaultBedConfig.bed_type
    });
  };
  
  // Función para manejar la opción de personalizar configuración de camas
  const handleCustomBedConfig = () => {
    // Aquí podrías abrir un modal adicional para configuración personalizada
    // Por ahora, solo mostramos un mensaje
    alert('Función de personalización de camas en desarrollo. Por favor, selecciona una de las opciones predefinidas.');
  };

  const toggleFeature = (featureId: string) => {
    const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
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

  // Function to get current effective status of a room
  const getRoomEffectiveStatus = (room: Room) => {
    const today = new Date().toISOString().split('T')[0];
    const schedules = roomSchedules[room.id] || [];
    
    // Check if there's an active schedule for today
    const activeSchedule = schedules.find(schedule => 
      schedule.start_date <= today && schedule.end_date > today
    );
    
    if (activeSchedule) {
      return {
        status: activeSchedule.schedule_type,
        isScheduled: true,
        schedule: activeSchedule
      };
    }
    
    return {
      status: room.status,
      isScheduled: false,
      schedule: null
    };
  };

  // Function to revert room status (delete active schedules)
  const handleRevertStatus = async (roomId: string) => {
    try {
      // Delete schedules using RPC
      await supabase.rpc('delete_room_schedules_by_room', {
        p_room_id: roomId
      });

      // Update room status to active
      const { error: roomError } = await supabase
        .from('hl_rooms')
        .update({ status: 'active' })
        .eq('id', roomId);

      if (roomError) {
        console.error('Error updating room:', roomError);
        alert(`Error al actualizar habitación: ${roomError.message}`);
        return;
      }

      // Reload data
      await loadRooms();
      alert('Estado revertido exitosamente');
    } catch (error) {
      console.error('Error reverting status:', error);
      alert('Error al revertir estado');
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="w-full">
        {/* Plan Limits Alert */}
        {businessId && (
          <PlanLimitsAlert
            businessId={businessId}
            onUpgrade={() => window.open('/pricing', '_blank')}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
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
              onClick={selectAllRooms}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Seleccionar Todo</span>
            </Button>
            <Button 
              variant="outline"
              onClick={loadRooms}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </Button>
            <Button 
              variant="outline"
              onClick={handleBulkAddRooms}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Creación Masiva</span>
            </Button>
            <Button 
              onClick={handleAddRoom}
              disabled={!validation.canAddRooms}
              className={`flex items-center space-x-2 ${
                !validation.canAddRooms
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue8 hover:bg-blue6 text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Habitación</span>
            </Button>
          </div>
        </div>

        {/* Plan Status Indicator */}
        {selectedPlan && (
          <div className="mb-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${validation.isAtLimit ? 'bg-red-500' : validation.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-medium text-blue-800">
                    Plan: {selectedPlan.planName}
                  </span>
                </div>
                <div className="text-sm text-blue-600">
                  Habitaciones: {validation.currentStats.rooms} / {selectedPlan.limits.maxRooms === -1 ? '∞' : selectedPlan.limits.maxRooms}
                  {validation.remainingRooms > 0 && (
                    <span className="ml-2 text-green-600">
                      ({validation.remainingRooms} restantes)
                    </span>
                  )}
                </div>
              </div>
              {validation.isAtLimit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/pricing', '_blank')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Actualizar Plan
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Availability Summary */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-blue1 mb-4">Resumen de Disponibilidad</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {rooms.filter(r => r.status === 'active').length}
              </p>
              <p className="text-sm text-gray4">Activas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {rooms.filter(r => r.status === 'cleaning').length}
              </p>
              <p className="text-sm text-gray4">En Limpieza</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {rooms.filter(r => r.status === 'maintenance').length}
              </p>
              <p className="text-sm text-gray4">Mantenimiento</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {rooms.filter(r => r.status === 'inactive').length}
              </p>
              <p className="text-sm text-gray4">Inactivas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue1">
                {rooms.length}
              </p>
              <p className="text-sm text-gray4">Total</p>
            </div>
          </div>
        </div>

        {/* Bulk Selection Toolbar - Sticky */}
        {selectedRooms.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 sticky top-1 z-50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-800">
                  {selectedRooms.length} habitación{selectedRooms.length !== 1 ? 'es' : ''} seleccionada{selectedRooms.length !== 1 ? 's' : ''}
                </span>
                <Button
                  onClick={clearSelection}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Deseleccionar todo
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => {
                    // Pre-fill with common values
                    const commonValues = getCommonValues(selectedRooms);
                    const commonFeatures = getCommonFeatures(selectedRooms);
                    
                    setBulkEditData({
                      type: commonValues.type,
                      status: commonValues.status,
                      price: commonValues.price,
                      capacity: commonValues.capacity,
                      bed_count: 0,
                      bed_type: '',
                      features: commonFeatures
                    });
                    
                    setShowBulkEditModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Editar en Grupo
                </Button>
              </div>
            </div>
          </div>
        )}

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

          return sortedFloors.map((floor) => {
            // Contar habitaciones seleccionadas en este piso
            const selectedRoomsInFloor = roomsByFloor[floor].filter(room => selectedRooms.includes(room.id));
            
            return (
            <div key={floor} className="mb-8">
              {/* Floor Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold ${
                    selectedRoomsInFloor.length > 0 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue8 text-white'
                  }`}>
                    {floor}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue1">Piso {floor}</h2>
                    <p className="text-sm text-gray4">
                      {roomsByFloor[floor].length} habitación{roomsByFloor[floor].length !== 1 ? 'es' : ''}
                      {selectedRoomsInFloor.length > 0 && (
                        <span className="ml-2 text-green-600 font-medium">
                          ({selectedRoomsInFloor.length} seleccionada{selectedRoomsInFloor.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={roomsByFloor[floor].every(r => selectedRooms.includes(r.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const floorRoomIds = roomsByFloor[floor].map(r => r.id);
                          setSelectedRooms(prev => [...new Set([...prev, ...floorRoomIds])]);
                        } else {
                          const floorRoomIds = roomsByFloor[floor].map(r => r.id);
                          setSelectedRooms(prev => prev.filter(id => !floorRoomIds.includes(id)));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Seleccionar piso</span>
                  </div>
                  <div className="text-sm text-gray4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                      {roomsByFloor[floor].filter(r => r.status === 'active').length} Activas
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      {roomsByFloor[floor].filter(r => r.status === 'cleaning').length} En Limpieza
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <a href="/hotel/rooms/maintenance" className="hover:underline">
                        Programar
                      </a>
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
                    const effectiveStatus = getRoomEffectiveStatus(room);
                    const statusInfo = roomStatuses.find(s => s.value === effectiveStatus.status);
                    const StatusIcon = statusInfo?.icon || Clock;
                    
                    return (
                      <div key={room.id} className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                        effectiveStatus.status === 'active' ? 'border-green-200 hover:border-green-300' :
                        effectiveStatus.status === 'inactive' ? 'border-gray-200 hover:border-gray-300' :
                        effectiveStatus.status === 'maintenance' ? 'border-yellow-200 hover:border-yellow-300' :
                        effectiveStatus.status === 'cleaning' ? 'border-blue-200 hover:border-blue-300' :
                        'border-purple-200 hover:border-purple-300'
                      }`}>
                        <div className="p-6">
                          {/* Header with status */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedRooms.includes(room.id)}
                                onChange={() => toggleRoomSelection(room.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <h3 className="text-xl font-bold text-blue1">Habitación {room.number}</h3>
                                <p className="text-sm text-gray4">Piso {room.floor}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(effectiveStatus.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo?.label}
                                {effectiveStatus.isScheduled && <span className="ml-1">📅</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status indicator */}
                          <div className={`w-full h-2 rounded-full mb-4 ${
                            effectiveStatus.status === 'active' ? 'bg-green-200' :
                            effectiveStatus.status === 'inactive' ? 'bg-gray-200' :
                            effectiveStatus.status === 'maintenance' ? 'bg-yellow-200' :
                            effectiveStatus.status === 'cleaning' ? 'bg-blue-200' :
                            'bg-purple-200'
                          }`}>
                            <div className={`h-full rounded-full transition-all duration-300 ${
                              effectiveStatus.status === 'active' ? 'bg-green-500' :
                              effectiveStatus.status === 'inactive' ? 'bg-gray-500' :
                              effectiveStatus.status === 'maintenance' ? 'bg-yellow-500' :
                              effectiveStatus.status === 'cleaning' ? 'bg-blue-500' :
                              'bg-purple-500'
                            }`} style={{ width: '100%' }}></div>
                          </div>
                          
                          {/* Schedule information */}
                          {effectiveStatus.isScheduled && effectiveStatus.schedule && (
                            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs text-yellow-800 font-medium">
                                📅 Programado: {effectiveStatus.schedule.start_date} - {effectiveStatus.schedule.end_date}
                              </p>
                              {effectiveStatus.schedule.reason && (
                                <p className="text-xs text-yellow-700 mt-1">{effectiveStatus.schedule.reason}</p>
                              )}
                            </div>
                          )}
                          
                          {/* Room details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray4">Tipo:</span>
                              <span className="text-sm font-medium text-blue1">{getTypeLabel(room.type)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray4">Capacidad:</span>
                              <span className="text-sm font-medium text-blue1">{room.capacity} {room.capacity === 1 ? 'persona' : 'personas'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray4">Camas:</span>
                              <span className="text-sm font-medium text-blue1">
                                {room.bed_count && room.bed_type ? 
                                  `${room.bed_count} ${room.bed_type === 'single' ? 'individual' : 
                                    room.bed_type === 'double' ? 'doble' : 
                                    room.bed_type === 'king' ? 'king' : 
                                    room.bed_type === 'queen' ? 'queen' : 
                                    room.bed_type === 'mixed' ? 'mixta' : room.bed_type}${room.bed_count > 1 ? 's' : ''}` :
                                  getDefaultBedConfig(room.type, room.capacity).description
                                }
                              </span>
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
                            {effectiveStatus.isScheduled ? (
                              <div className="space-y-2">
                                <select
                                  value="scheduled"
                                  disabled
                                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 ${getStatusColor(effectiveStatus.status)}`}
                                >
                                  <option value="scheduled">{statusInfo?.label} (Programado)</option>
                                </select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevertStatus(room.id)}
                                  className="w-full text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                                >
                                  🔄 Revertir a Activa
                                </Button>
                              </div>
                            ) : (
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
                            )}
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
                              onClick={() => router.push('/hotel/rooms/maintenance')}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Wrench className="h-4 w-4" />
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
            );
          });
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
                      onChange={(e) => handleTypeChange(e.target.value as Room['type'])}
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
                        onChange={(e) => handleFloorChange(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">Capacidad *</label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => {
                          const newCapacity = parseInt(e.target.value) || 1;
                          const maxCapacity = getCapacityForType(formData.type);
                          
                          if (newCapacity > maxCapacity) {
                            alert(`La capacidad no puede superar ${maxCapacity} personas para habitaciones tipo ${formData.type}`);
                            return;
                          }
                          
                          setFormData({...formData, capacity: newCapacity});
                        }}
                        className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                        min="1"
                        max={getCapacityForType(formData.type)}
                      />
                      <p className="text-xs text-gray4 mt-1">
                        Máximo: {getCapacityForType(formData.type)} personas para habitación {formData.type}
                      </p>
                    </div>
                  </div>
                  
                  {/* Configuración de Camas */}
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Configuración de Camas *</label>
                    <select
                      value={`${formData.bed_count}-${formData.bed_type}`}
                      onChange={(e) => {
                        if (e.target.value === 'custom-custom') {
                          handleCustomBedConfig();
                          return;
                        }
                        const [bedCount, bedType] = e.target.value.split('-');
                        setFormData({
                          ...formData, 
                          bed_count: parseInt(bedCount), 
                          bed_type: bedType
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    >
                      {getValidBedConfigs(formData.type, formData.capacity).map((config, index) => (
                        <option key={index} value={`${config.bed_count}-${config.bed_type}`}>
                          {config.description}
                        </option>
                      ))}
                      {/* Opción de personalizar para habitaciones de 4+ personas */}
                      {formData.capacity >= 4 && (
                        <option value="custom-custom">
                          🎨 Personalizar configuración
                        </option>
                      )}
                    </select>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Configuraciones válidas:</strong> Las opciones se ajustan automáticamente según el tipo y capacidad de la habitación
                    </p>
                    {formData.capacity >= 4 && (
                      <p className="text-xs text-blue-600 mt-1">
                        🎨 <strong>Personalizar:</strong> Para habitaciones de 4+ personas, puedes seleccionar "Personalizar configuración" para opciones avanzadas
                      </p>
                    )}
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
                  

                </div>

                {/* Features Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue1">Características de la Habitación</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {roomFeatures.map((feature) => {
                      const FeatureIcon = feature.icon;
                      const featuresArray = Array.isArray(formData.features) ? formData.features : [];
                      const isSelected = featuresArray.includes(feature.id);
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

        {/* Bulk Add Modal */}
        {showBulkAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-blue1">Creación Masiva de Habitaciones</h2>
                  <button
                    onClick={() => setShowBulkAddModal(false)}
                    className="text-gray4 hover:text-gray6 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue1">Configuración General</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray4 mb-2">Piso *</label>
                        <input
                          type="number"
                          value={bulkFormData.floor}
                          onChange={(e) => handleBulkFloorChange(parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray4 mb-2">Cantidad *</label>
                        <input
                          type="number"
                          value={bulkFormData.count}
                          onChange={(e) => setBulkFormData({...bulkFormData, count: parseInt(e.target.value) || 1})}
                          className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray4 mb-2">Tipo de Habitación *</label>
                        <select
                          value={bulkFormData.type}
                          onChange={(e) => {
                            const selectedType = roomTypes.find(t => t.value === e.target.value);
                            const newCapacity = selectedType?.capacity || 1;
                            const defaultBedConfig = getDefaultBedConfig(e.target.value, newCapacity);
                            
                            setBulkFormData({
                              ...bulkFormData,
                              type: e.target.value,
                              capacity: newCapacity,
                              price: selectedType?.basePrice || 0,
                              bed_count: defaultBedConfig.bed_count,
                              bed_type: defaultBedConfig.bed_type
                            });
                          }}
                          className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                        >
                          {roomTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label} ({type.capacity} personas)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray4 mb-2">Capacidad *</label>
                        <input
                          type="number"
                          value={bulkFormData.capacity}
                          onChange={(e) => {
                            const newCapacity = parseInt(e.target.value) || 1;
                            const maxCapacity = getCapacityForType(bulkFormData.type);
                            
                            if (newCapacity > maxCapacity) {
                              alert(`La capacidad no puede superar ${maxCapacity} personas para habitaciones tipo ${bulkFormData.type}`);
                              return;
                            }
                            
                            setBulkFormData({...bulkFormData, capacity: newCapacity});
                          }}
                          className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                          min="1"
                          max={getCapacityForType(bulkFormData.type)}
                        />
                        <p className="text-xs text-gray4 mt-1">
                          Máximo: {getCapacityForType(bulkFormData.type)} personas para habitación {bulkFormData.type}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">Precio por noche *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray4">$</span>
                        <input
                          type="number"
                          value={bulkFormData.price}
                          onChange={(e) => setBulkFormData({...bulkFormData, price: parseInt(e.target.value) || 0})}
                          className="w-full pl-8 pr-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      {bulkFormData.price > 0 && (
                        <p className="text-xs text-gray4 mt-1">
                          Formato: {formatCLP(bulkFormData.price)}
                        </p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue1 mb-2">Información de Creación</h4>
                      <p className="text-sm text-blue-700">
                        Se crearán {bulkFormData.count} habitación{bulkFormData.count !== 1 ? 'es' : ''} en el piso {bulkFormData.floor}, 
                        comenzando desde la habitación {getNextRoomNumber(bulkFormData.floor)}.
                      </p>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue1">Características (Aplicadas a todas las habitaciones)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {roomFeatures.map((feature) => {
                        const FeatureIcon = feature.icon;
                        const featuresArray = Array.isArray(bulkFormData.features) ? bulkFormData.features : [];
                        const isSelected = featuresArray.includes(feature.id);
                        return (
                          <button
                            key={feature.id}
                            type="button"
                            onClick={() => toggleBulkFeature(feature.id)}
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
                    onClick={handleBulkSaveRooms}
                    className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2 flex-1"
                  >
                    <Save className="h-4 w-4" />
                    <span>Crear {bulkFormData.count} Habitación{bulkFormData.count !== 1 ? 'es' : ''}</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowBulkAddModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-blue1">
                  Programar {scheduleFormData.status === 'maintenance' ? 'Mantenimiento' : 'Inactividad'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedRoom(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Habitación</label>
                  <input
                    type="text"
                    value={`${selectedRoom.number} - ${selectedRoom.type}`}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Estado</label>
                  <select
                    value={scheduleFormData.status}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, status: e.target.value as 'maintenance' | 'inactive'})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                  >
                    <option value="maintenance">Mantenimiento</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Fecha Inicio *</label>
                    <input
                      type="date"
                      value={scheduleFormData.start_date}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        setScheduleFormData({
                          ...scheduleFormData, 
                          start_date: newStartDate,
                          // Si la fecha de fin es menor que la nueva fecha de inicio, limpiarla
                          end_date: scheduleFormData.end_date && newStartDate && scheduleFormData.end_date < newStartDate ? '' : scheduleFormData.end_date
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray4 mb-2">Fecha Fin *</label>
                    <input
                      type="date"
                      value={scheduleFormData.end_date}
                      min={scheduleFormData.start_date || undefined}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, end_date: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 ${
                        scheduleFormData.start_date && scheduleFormData.end_date && scheduleFormData.end_date < scheduleFormData.start_date 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray8'
                      }`}
                    />
                    {scheduleFormData.start_date && scheduleFormData.end_date && scheduleFormData.end_date < scheduleFormData.start_date && (
                      <p className="text-red-500 text-xs mt-1">La fecha de fin debe ser posterior a la fecha de inicio</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray4 mb-2">Motivo (opcional)</label>
                  <textarea
                    value={scheduleFormData.reason}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, reason: e.target.value})}
                    className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                    rows={3}
                    placeholder="Descripción del mantenimiento o motivo de inactividad..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <Button 
                  onClick={handleSaveSchedule}
                  disabled={
                    !scheduleFormData.start_date || 
                    !scheduleFormData.end_date || 
                    scheduleFormData.end_date < scheduleFormData.start_date
                  }
                  className={`flex items-center space-x-2 flex-1 ${
                    !scheduleFormData.start_date || 
                    !scheduleFormData.end_date || 
                    scheduleFormData.end_date < scheduleFormData.start_date
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue8 hover:bg-blue6 text-white'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Programación</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowScheduleModal(false);
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

        {/* Bulk Edit Modal */}
        {showBulkEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue1">
                  Editar {selectedRooms.length} Habitación{selectedRooms.length !== 1 ? 'es' : ''}
                </h2>
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditData({ type: '', status: '', price: 0, capacity: 0, bed_count: 0, bed_type: '', features: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Selected Rooms Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Habitaciones Seleccionadas:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRooms.map(roomId => {
                    const room = rooms.find(r => r.id === roomId);
                    return room ? (
                      <span key={roomId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {room.number} (Piso {room.floor})
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Información Básica */}
                <div>
                  <h3 className="text-lg font-semibold text-blue1 mb-4">Información Básica</h3>
                  
                  {/* Info about common values */}
                  {selectedRooms.length > 0 && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700">
                        💡 Los campos con valores son comunes a todas las habitaciones seleccionadas
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">
                        Tipo de Habitación
                        {bulkEditData.type && (
                          <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Común
                          </span>
                        )}
                      </label>
                      <select
                        value={bulkEditData.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const newCapacity = newType ? getCapacityForType(newType) : 0;
                          const newPrice = newType ? getBasePriceForType(newType) : 0;
                          
                          // Get default bed configuration for the new type and capacity
                          const defaultBedConfig = newType ? getDefaultBedConfig(newType, newCapacity) : { bed_count: 0, bed_type: '', description: '' };
                          
                          setBulkEditData({
                            ...bulkEditData, 
                            type: newType,
                            capacity: newCapacity,
                            price: newPrice
                          });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 ${
                          bulkEditData.type ? 'border-green-300 bg-green-50' : 'border-gray8'
                        }`}
                      >
                        <option value="">No cambiar</option>
                        {roomTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label} ({type.capacity} personas)
                          </option>
                        ))}
                      </select>
                      {bulkEditData.type && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700">
                            💡 <strong>Configuración automática:</strong>
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            • Capacidad: {getCapacityForType(bulkEditData.type)} personas
                          </p>
                          <p className="text-xs text-blue-600">
                            • Configuración actual: {getBedConfigForType(bulkEditData.type)}
                          </p>
                          <p className="text-xs text-blue-600">
                            • Precio sugerido: ${getBasePriceForType(bulkEditData.type).toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-700 mt-2">
                            🛏️ <strong>Configuraciones válidas de camas:</strong>
                          </p>
                          {getValidBedConfigs(bulkEditData.type, bulkEditData.capacity || getCapacityForType(bulkEditData.type)).map((config, index) => (
                            <p key={index} className="text-xs text-blue-600 ml-2">
                              • {config.description}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">
                        Estado
                        {bulkEditData.status && (
                          <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Común
                          </span>
                        )}
                      </label>
                      <select
                        value={bulkEditData.status}
                        onChange={(e) => setBulkEditData({...bulkEditData, status: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 ${
                          bulkEditData.status ? 'border-green-300 bg-green-50' : 'border-gray8'
                        }`}
                      >
                        <option value="">No cambiar</option>
                        {roomStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">
                        Precio por Noche
                        {bulkEditData.price > 0 && (
                          <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Común
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={bulkEditData.price || ''}
                          onChange={(e) => setBulkEditData({...bulkEditData, price: parseInt(e.target.value) || 0})}
                          className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 ${
                            bulkEditData.price > 0 ? 'border-green-300 bg-green-50' : 'border-gray8'
                          }`}
                          placeholder="No cambiar"
                          min="0"
                        />
                      </div>
                      <p className="text-xs text-gray4 mt-1">Formato: $45.000</p>
                      {bulkEditData.type && bulkEditData.price === getBasePriceForType(bulkEditData.type) && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Precio ajustado automáticamente para {roomTypes.find(rt => rt.value === bulkEditData.type)?.label}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">
                        Capacidad
                        {bulkEditData.capacity > 0 && (
                          <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Común
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={bulkEditData.capacity || ''}
                        onChange={(e) => {
                          const newCapacity = parseInt(e.target.value) || 0;
                          const maxCapacity = bulkEditData.type ? getCapacityForType(bulkEditData.type) : 4;
                          
                          // Validate capacity doesn't exceed maximum for the selected type
                          if (newCapacity > maxCapacity) {
                            alert(`La capacidad no puede superar ${maxCapacity} personas para habitaciones tipo ${bulkEditData.type}`);
                            return;
                          }
                          
                          setBulkEditData({...bulkEditData, capacity: newCapacity});
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 ${
                          bulkEditData.capacity > 0 ? 'border-green-300 bg-green-50' : 'border-gray8'
                        }`}
                        placeholder="No cambiar"
                        min="1"
                        max={bulkEditData.type ? getCapacityForType(bulkEditData.type) : 4}
                      />
                      {bulkEditData.type && (
                        <p className="text-xs text-gray-500 mt-1">
                          Máximo: {getCapacityForType(bulkEditData.type)} personas para habitación {bulkEditData.type}
                        </p>
                      )}
                    </div>
                    
                    {/* Configuración de Camas */}
                    <div>
                      <label className="block text-sm font-medium text-gray4 mb-2">
                        Configuración de Camas
                        {(bulkEditData.bed_count > 0 || bulkEditData.bed_type) && (
                          <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Cambiar
                          </span>
                        )}
                      </label>
                      <select
                        value={bulkEditData.bed_count > 0 && bulkEditData.bed_type ? 
                          `${bulkEditData.bed_count}-${bulkEditData.bed_type}` : '0-'
                        }
                        onChange={(e) => {
                          if (e.target.value === '0-') {
                            setBulkEditData({...bulkEditData, bed_count: 0, bed_type: ''});
                          } else if (e.target.value === 'custom-custom') {
                            handleCustomBedConfig();
                            return;
                          } else {
                            const [bedCount, bedType] = e.target.value.split('-');
                            setBulkEditData({
                              ...bulkEditData, 
                              bed_count: parseInt(bedCount), 
                              bed_type: bedType
                            });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 ${
                          (bulkEditData.bed_count > 0 || bulkEditData.bed_type) ? 'border-green-300 bg-green-50' : 'border-gray8'
                        }`}
                      >
                        <option value="0-">No cambiar</option>
                        {bulkEditData.type && bulkEditData.capacity ? 
                          getValidBedConfigs(bulkEditData.type, bulkEditData.capacity).map((config, index) => (
                            <option key={index} value={`${config.bed_count}-${config.bed_type}`}>
                              {config.description}
                            </option>
                          )) : []
                        }
                        {/* Opción de personalizar para habitaciones de 4+ personas */}
                        {bulkEditData.capacity >= 4 && (
                          <option value="custom-custom">
                            🎨 Personalizar configuración
                          </option>
                        )}
                      </select>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 <strong>Configuraciones válidas:</strong> Las opciones se ajustan automáticamente según el tipo y capacidad seleccionados
                      </p>
                      {bulkEditData.capacity >= 4 && (
                        <p className="text-xs text-blue-600 mt-1">
                          🎨 <strong>Personalizar:</strong> Para habitaciones de 4+ personas, puedes seleccionar "Personalizar configuración" para opciones avanzadas
                        </p>
                      )}
                    </div>

                  </div>
                </div>
                
                {/* Características de la Habitación */}
                <div>
                  <h3 className="text-lg font-semibold text-blue1 mb-4">Características de la Habitación</h3>
                  
                  {/* Info about common features */}
                  {selectedRooms.length > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 Las características marcadas en azul son comunes a todas las habitaciones seleccionadas
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {roomFeatures.map((feature) => {
                      const isSelected = (bulkEditData.features || []).includes(feature.id);
                      const isCommon = selectedRooms.length > 0 && getCommonFeatures(selectedRooms).includes(feature.id);
                      
                      return (
                        <button
                          key={feature.id}
                          onClick={() => {
                            const currentFeatures = bulkEditData.features || [];
                            const newFeatures = currentFeatures.includes(feature.id)
                              ? currentFeatures.filter(f => f !== feature.id)
                              : [...currentFeatures, feature.id];
                            setBulkEditData({...bulkEditData, features: newFeatures});
                          }}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : isCommon
                              ? 'border-blue-300 bg-blue-100 text-blue-600'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                          }`}
                          title={
                            isCommon 
                              ? `${feature.label} - Común a todas las habitaciones seleccionadas`
                              : feature.label
                          }
                        >
                          <feature.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{feature.label}</span>
                          {isCommon && !isSelected && (
                            <span className="ml-auto text-xs text-blue-500">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Selecciona las características que quieres aplicar a todas las habitaciones seleccionadas
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                <Button 
                  onClick={handleBulkEdit}
                  disabled={!bulkEditData.type && !bulkEditData.status && bulkEditData.price === 0 && bulkEditData.capacity === 0 && (!bulkEditData.features || bulkEditData.features.length === 0)}
                  className="bg-blue8 hover:bg-blue6 text-white flex-1 py-3 text-lg"
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditData({ type: '', status: '', price: 0, capacity: 0, bed_count: 0, bed_type: '', features: [] });
                  }}
                  className="flex-1 py-3 text-lg"
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

export default function RoomsManagement() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoomsManagementContent />
    </Suspense>
  );
}