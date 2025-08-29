// User role types
export type UserRole = 'admin' | 'customer' | 'manager' | 'staff';

// User interface
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

// Business interface
export interface Business {
  id: number;
  user_id: number;
  business_type: 'hotel' | 'restaurant';
  name: string;
  rut: string;
  address: string;
  country: string;
  region: string;
  city: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

// User with business data
export interface UserWithBusiness extends User {
  business?: Business;
}

// Role permissions
export const ROLE_PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canManageBusinesses: true,
    canViewAllData: true,
    canEditSystemSettings: true,
  },
  customer: {
    canManageUsers: false,
    canManageBusinesses: false,
    canViewAllData: false,
    canEditSystemSettings: false,
  },
  manager: {
    canManageUsers: true,
    canManageBusinesses: true,
    canViewAllData: true,
    canEditSystemSettings: false,
  },
  staff: {
    canManageUsers: false,
    canManageBusinesses: false,
    canViewAllData: false,
    canEditSystemSettings: false,
  },
} as const;

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Administrador',
  customer: 'Cliente',
  manager: 'Gerente',
  staff: 'Personal',
};
