import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Permission {
  permission_name: string;
  module: string;
}

interface UserRole {
  id: string;
  name: string;
  display_name: string;
  is_owner: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      // Primero verificar si hay usuario autenticado con Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Flujo normal para owners autenticados
        console.log('Loading owner permissions from Supabase Auth');
        
        // Obtener rol del usuario
        const { data: userData } = await supabase
          .from('hl_users_with_roles')
          .select('role_id, role_name, role_display_name, is_owner')
          .eq('id', user.id)
          .single();

        if (userData) {
          setUserRole({
            id: userData.role_id,
            name: userData.role_name,
            display_name: userData.role_display_name,
            is_owner: userData.is_owner
          });
        }

        // Obtener permisos del usuario
        const { data: permissionsData } = await supabase
          .rpc('get_user_permissions', { user_id_param: user.id });

        if (permissionsData) {
          setPermissions(permissionsData.map((p: Permission) => p.permission_name));
        }
        
      } else {
        // No hay usuario autenticado, verificar si hay sesión de empleado
        const employeeSession = localStorage.getItem('employee_session');
        const employeePermissions = localStorage.getItem('employee_permissions');
        
        if (employeeSession && employeePermissions) {
          try {
            const sessionData = JSON.parse(employeeSession);
            const perms = JSON.parse(employeePermissions);
            
            // Verificar si no ha expirado
            if (Date.now() < sessionData.expires_at) {
              console.log('Loading employee permissions from session');
              setUserRole({
                id: 'employee',
                name: 'employee',
                display_name: sessionData.role,
                is_owner: false
              });
              
              const permissionNames = perms.map((p: any) => p.name);
              console.log('Employee permissions loaded:', permissionNames);
              setPermissions(permissionNames);
              setLoading(false);
              return;
            } else {
              // Sesión expirada, limpiar
              localStorage.removeItem('employee_session');
              localStorage.removeItem('employee_permissions');
            }
          } catch (error) {
            console.error('Error parsing employee session:', error);
            localStorage.removeItem('employee_session');
            localStorage.removeItem('employee_permissions');
          }
        }
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (userRole?.is_owner || userRole?.name === 'owner') return true; // Owner tiene todos los permisos
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsList: string[]): boolean => {
    if (userRole?.is_owner || userRole?.name === 'owner') return true;
    return permissionsList.some(permission => permissions.includes(permission));
  };

  const hasModuleAccess = (module: string): boolean => {
    if (userRole?.is_owner || userRole?.name === 'owner') return true;
    return permissions.some(permission => permission.startsWith(`${module}.`));
  };

  return {
    permissions,
    userRole,
    loading,
    hasPermission,
    hasAnyPermission,
    hasModuleAccess
  };
}