import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, UserRole, ROLE_PERMISSIONS, ROLE_DISPLAY_NAMES } from '@/types/user';

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('hl_user')
          .select(`
            *,
            hl_business (*)
          `)
          .eq('email', authUser.email)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          setError('Error al cargar datos del usuario');
          setLoading(false);
          return;
        }

        setUser(userData);
        setLoading(false);
      } catch (err) {
        console.error('Error in useUserRole:', err);
        setError('Error inesperado');
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS.admin) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role][permission];
  };

  const isRole = (role: UserRole) => {
    return user?.role === role;
  };

  const getRoleDisplayName = (role: UserRole) => {
    return ROLE_DISPLAY_NAMES[role];
  };

  return {
    user,
    loading,
    error,
    hasPermission,
    isRole,
    getRoleDisplayName,
    role: user?.role || null,
  };
}
