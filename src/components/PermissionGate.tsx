import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  module?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({ 
  permission, 
  permissions, 
  module, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasModuleAccess } = usePermissions();

  // Verificar permiso específico
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Verificar múltiples permisos (OR)
  if (permissions && !hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  // Verificar acceso al módulo
  if (module && !hasModuleAccess(module)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
