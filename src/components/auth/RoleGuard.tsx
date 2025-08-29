import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole } from '@/types/user';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = <div>No tienes permisos para acceder a esta página.</div>,
  requireAuth = true 
}: RoleGuardProps) {
  const { user, loading, isRole } = useUserRole();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (requireAuth && !user) {
    return <div>Debes iniciar sesión para acceder a esta página.</div>;
  }

  if (user && !allowedRoles.some(role => isRole(role))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componentes específicos para roles
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CustomerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['customer']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ManagerOrAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
