// Tipos de negocios disponibles
export type BusinessType = 'hotel' | 'restaurant';

// Subcategorías de hoteles
export type HotelSubType = 
  | 'hotel'
  | 'motel'
  | 'hostal'
  | 'resort'
  | 'apartment'
  | 'bed_and_breakfast';

// Subcategorías de restaurantes
export type RestaurantSubType = 
  | 'restaurant'
  | 'bar'
  | 'cafe'
  | 'food_truck'
  | 'pizzeria'
  | 'fast_food';

// Estado de habitación
export type RoomStatus = 
  | 'available'    // Disponible
  | 'occupied'     // Ocupada
  | 'cleaning'     // En limpieza
  | 'maintenance'  // En mantenimiento
  | 'reserved';    // Reservada

// Estado de mesa
export type TableStatus = 
  | 'available'    // Disponible
  | 'occupied'     // Ocupada
  | 'reserved'     // Reservada
  | 'cleaning';    // En limpieza

// Estado de comanda
export type OrderStatus = 
  | 'pending'      // Pendiente
  | 'preparing'    // Preparando
  | 'ready'        // Lista
  | 'delivered'    // Entregada
  | 'cancelled';   // Cancelada

// Estado de check-in/check-out
export type GuestStatus = 
  | 'checked_in'   // Registrado
  | 'checked_out'  // Salido
  | 'pending';     // Pendiente

// Interfaz base para negocios
export interface BaseBusiness {
  id: string;
  name: string;
  type: BusinessType;
  subType: HotelSubType | RestaurantSubType;
  address: string;
  phone: string;
  email: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Interfaz para hoteles
export interface HotelBusiness extends BaseBusiness {
  type: 'hotel';
  subType: HotelSubType;
  totalRooms: number;
  rating?: number;
  amenities: string[];
  checkInTime: string; // HH:MM
  checkOutTime: string; // HH:MM
}

// Interfaz para restaurantes
export interface RestaurantBusiness extends BaseBusiness {
  type: 'restaurant';
  subType: RestaurantSubType;
  totalTables: number;
  cuisine: string[];
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

// Unión de tipos de negocios
export type Business = HotelBusiness | RestaurantBusiness;

// Interfaz para habitaciones
export interface Room {
  id: string;
  businessId: string;
  number: string;
  type: string; // Individual, Doble, Suite, etc.
  status: RoomStatus;
  price: number;
  capacity: number;
  amenities: string[];
  currentGuestId?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  lastCleaned?: Date;
  notes?: string;
}

// Interfaz para mesas
export interface Table {
  id: string;
  businessId: string;
  number: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  currentGuests?: number;
  lastCleaned?: Date;
  location?: string; // Interior, Terraza, etc.
}

// Interfaz para huéspedes
export interface Guest {
  id: string;
  businessId: string;
  roomId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: GuestStatus;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para menús
export interface MenuItem {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  preparationTime: number; // en minutos
  allergens?: string[];
  imageUrl?: string;
}

// Interfaz para comandas
export interface Order {
  id: string;
  businessId: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  waiterId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para items de comanda
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status: OrderStatus;
}

// Interfaz para empleados
export interface Employee {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'manager' | 'receptionist' | 'housekeeper' | 'waiter' | 'chef' | 'cashier';
  isActive: boolean;
  hireDate: Date;
  salary?: number;
}
