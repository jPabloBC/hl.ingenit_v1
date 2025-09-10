// Tipos de negocios disponibles
export type BusinessType = 'hotel';

// Subcategorías de hoteles
export type HotelSubType = 
  | 'hotel'
  | 'motel'
  | 'hostal'
  | 'resort'
  | 'apartment'
  | 'bed_and_breakfast';

// Estado de habitación
export type RoomStatus = 
  | 'available'    // Disponible
  | 'occupied'     // Ocupada
  | 'cleaning'     // En limpieza
  | 'maintenance'  // En mantenimiento
  | 'reserved';    // Reservada

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
  subType: HotelSubType;
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

// Unión de tipos de negocios
export type Business = HotelBusiness;

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

// Interfaz para empleados
export interface Employee {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'manager' | 'receptionist' | 'housekeeper' | 'cashier';
  isActive: boolean;
  hireDate: Date;
  salary?: number;
}