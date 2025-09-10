"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Bed, 
  Utensils,
  Bell,
  LogOut,
  User,
  Home,
  ShoppingCart,
  UserCheck,
  Globe
} from "lucide-react";
import AlertsPanelWithHistory from "@/components/hotel/AlertsPanelWithHistory";
import SubscriptionStatus from "@/components/hotel/SubscriptionStatus";
import PaymentModal from "@/components/hotel/PaymentModal";
import LoadingPage from "@/components/ui/loading-page";
import { formatCLP } from "@/lib/currency";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  business_id?: string;
}

export default function HotelDashboard() {
  const router = useRouter();
  const { hasPermission, permissions, userRole } = usePermissions();
  
  // Debug: mostrar permisos en consola
  useEffect(() => {
    if (permissions.length > 0) {
      console.log('Dashboard permissions:', permissions);
      console.log('User role:', userRole);
      console.log('Has users.view permission:', hasPermission('users.view'));
    }
  }, [permissions, userRole, hasPermission]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [qrAccess, setQrAccess] = useState(false);
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    reservationsToday: 0,
    totalIncome: 0
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Función para capitalizar texto
  const capitalizeText = (text: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    // Verificar si viene de acceso QR o empleado
    const urlParams = new URLSearchParams(window.location.search);
    const isQrAccess = urlParams.get('qr_access') === 'true';
    const isEmployeeAccess = urlParams.get('employee_access') === 'true';
    
    if (isQrAccess) {
      const employeeSession = localStorage.getItem('qr_employee_session');
      if (employeeSession) {
        try {
          const sessionData = JSON.parse(employeeSession);
          
          // Verificar si no ha expirado
          if (Date.now() < sessionData.expires_at) {
            console.log('QR session valid, setting user data');
            setQrAccess(true);
            setUser({
              id: sessionData.employee_id,
              name: sessionData.name,
              email: 'empleado@qr.local',
              role: sessionData.role,
              business_id: sessionData.business_id
            });
            setLoading(false);
            return;
          } else {
            // Sesión expirada
            localStorage.removeItem('qr_employee_session');
          }
        } catch (error) {
          console.error('Error parsing QR session:', error);
          localStorage.removeItem('qr_employee_session');
        }
      }
    }

    if (isEmployeeAccess) {
      const employeeSession = localStorage.getItem('employee_session');
      if (employeeSession) {
        try {
          const sessionData = JSON.parse(employeeSession);
          
          // Verificar si no ha expirado
          if (Date.now() < sessionData.expires_at) {
            console.log('Employee session valid, setting user data');
            
            // Configurar sesión de empleado sin recargar
            console.log('Setting up employee session without reload');
            
            setQrAccess(true);
            setUser({
              id: sessionData.employee_id,
              name: sessionData.name,
              email: 'empleado@pin.local',
              role: sessionData.role,
              business_id: sessionData.business_id
            });
            
            // Guardar permisos del empleado para usePermissions
            console.log('Saving employee permissions:', sessionData.permissions);
            localStorage.setItem('employee_permissions', JSON.stringify(sessionData.permissions || []));
            
            // Cerrar sesión de Supabase Auth de forma asíncrona (sin esperar)
            supabase.auth.signOut().catch(console.error);
            
            setLoading(false);
            return;
          } else {
            // Sesión expirada
            localStorage.removeItem('employee_session');
          }
        } catch (error) {
          console.error('Error parsing employee session:', error);
          localStorage.removeItem('employee_session');
        }
      }
    }
    
    checkUser();
  }, []);

  const validateQRSession = async (sessionToken: string) => {
    try {
      console.log('Validating QR session with token:', sessionToken.substring(0, 20) + '...');
      const response = await fetch('/api/qr/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      const data = await response.json();
      console.log('Session validation response:', data);
      console.log('Response status:', response.status);
      console.log('data.valid:', data.valid, typeof data.valid);

      if (response.ok && data.valid === true) {
        console.log('QR session valid, setting user data');
        setQrAccess(true);
        setUser({
          id: data.employee_id,
          name: 'Pablo Bernal (QR)',
          email: 'empleado@qr.local',
          role: data.role || 'reception',
          business_id: data.business_id
        });
        setLoading(false);
        console.log('User data set successfully, loading complete');
      } else {
        console.log('QR session invalid, redirecting to login. Response OK:', response.ok, 'Data valid:', data.valid);
        // Token inválido, limpiar y redirigir
        localStorage.removeItem('qr_session_token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error validating QR session:', error);
      localStorage.removeItem('qr_session_token');
      router.push('/login');
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

                     // Get user data from hl_user table
     const { data: userData, error } = await supabase
       .from('hl_user')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !userData) {
        console.error('Error fetching user data:', error);
        router.push('/login');
        return;
      }

      if (!userData.email_verified) {
        router.push('/verify-email');
        return;
      }

      setUser(userData);

      // Get business info
      const { data: businessData } = await supabase
        .from('hl_business')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (!businessData) {
        // Usuario no tiene negocio configurado, redirigir al onboarding
        router.push('/onboarding');
        return;
      }

      // Verificar que tenga todos los datos críticos para la gestión de hoteles
      const requiredFields = [
        'business_name',
        'business_type', 
        'country',
        'city',
        'address',
        'rooms_count'
      ];

      const missingFields = requiredFields.filter(field => 
        !businessData[field] || 
        (typeof businessData[field] === 'string' && businessData[field].trim() === '') ||
        (typeof businessData[field] === 'number' && businessData[field] <= 0)
      );

      if (missingFields.length > 0) {
        console.log('Campos faltantes para gestión de hoteles:', missingFields);
        // Usuario tiene negocio pero faltan datos críticos, redirigir al onboarding
        router.push('/onboarding');
        return;
      }

      setBusinessInfo(businessData);

      // Load real statistics
      await loadDashboardStats(authUser.id);

      setLoading(false);

    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const loadDashboardStats = async (userId: string) => {
    try {
      // Get business ID
      const { data: businessData } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!businessData) return;

      const businessId = businessData.id;

      // Get total rooms
      const { count: totalRooms } = await supabase
        .from('hl_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      // Get occupied rooms (reservations with status 'checked_in')
      const { data: occupiedReservations } = await supabase
        .from('hl_reservations')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'checked_in');

      const occupiedRooms = occupiedReservations?.length || 0;

      // Get reservations for today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayReservations } = await supabase
        .from('hl_reservations')
        .select('*')
        .eq('business_id', businessId)
        .eq('check_in_date', today);

      const reservationsToday = todayReservations?.length || 0;

      // Calculate total income from paid reservations
      const { data: paidReservations } = await supabase
        .from('hl_reservations')
        .select('total_amount')
        .eq('business_id', businessId)
        .eq('payment_status', 'paid');

      const totalIncome = paidReservations?.reduce((sum, reservation) => sum + (reservation.total_amount || 0), 0) || 0;

      console.log('Dashboard stats:', {
        totalRooms,
        occupiedRooms,
        reservationsToday,
        totalIncome,
        businessId
      });

      console.log('Raw data:', {
        totalRoomsQuery: totalRooms,
        occupiedReservations,
        todayReservations,
        paidReservations
      });

      setStats({
        totalRooms: totalRooms || 0,
        occupiedRooms,
        reservationsToday,
        totalIncome
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const dashboardModules = [
    {
      title: "Ventas",
      description: "Venta de habitaciones y reservas",
      icon: ShoppingCart,
      color: "bg-blue6",
      hoverColor: "hover:bg-blue4",
      href: "/hotel/sales"
    },
    {
      title: "Recepción",
      description: "Check-in y check-out de huéspedes",
      icon: UserCheck,
      color: "bg-blue7",
      hoverColor: "hover:bg-blue5",
      href: "/hotel/front-desk"
    },
    {
      title: "Gestión de Habitaciones",
      description: "Administra habitaciones, disponibilidad y estados",
      icon: Bed,
      color: "bg-blue6",
      hoverColor: "hover:bg-blue4",
      href: "/hotel/rooms"
    },
    {
      title: "Housekeeping",
      description: "Gestión de limpieza y mantenimiento",
      icon: Building2,
      color: "bg-blue7",
      hoverColor: "hover:bg-blue5",
      href: "/hotel/housekeeping"
    },
    {
      title: "Reservas",
      description: "Sistema de reservas y check-in/check-out",
      icon: Calendar,
      color: "bg-blue7",
      hoverColor: "hover:bg-blue5",
      href: "/hotel/reservations"
    },
    {
      title: "Huéspedes",
      description: "Base de datos de clientes y huéspedes",
      icon: Users,
      color: "bg-blue6",
      hoverColor: "hover:bg-blue4",
      href: "/hotel/guests"
    },
    {
      title: "Facturación",
      description: "Gestión de pagos, facturas y cobros",
      icon: CreditCard,
      color: "bg-blue7",
      hoverColor: "hover:bg-blue5",
      href: "/hotel/billing"
    },
    {
      title: "Pagos Webpay",
      description: "Transacciones y pagos en línea",
      icon: CreditCard,
      color: "bg-blue6",
      hoverColor: "hover:bg-blue4",
      href: "/hotel/payments"
    },
    {
      title: "Reportes",
      description: "Estadísticas, análisis y reportes financieros",
      icon: BarChart3,
      color: "bg-blue7",
      hoverColor: "hover:bg-blue5",
      href: "/hotel/reports"
    },
    {
      title: "Channel Manager",
      description: "Gestión de canales de distribución",
      icon: Globe,
      color: "bg-blue6",
      hoverColor: "hover:bg-blue4",
      href: "/hotel/channel-manager"
    },
    {
      title: "Configuración",
      description: "Configuración del hotel y preferencias",
      icon: Settings,
      color: "bg-blue6",
      hoverColor: "hover:bg-blue4",
      href: "/hotel/settings"
    },
    {
      title: "Gestión de Usuarios",
      description: "Administrar empleados y permisos",
      icon: Users,
      color: "bg-blue6",
      hoverColor: "hover:bg-blue4",
      href: "/hotel/users",
      permission: "users.view"
    },
    {
      title: "Administración",
      description: "Configuración avanzada del sistema",
      icon: Building2,
      color: "bg-blue7",
      hoverColor: "hover:bg-blue5",
      href: "/hotel/admin"
    },
    {
      title: "Alertas",
      description: "Notificaciones y alertas del sistema",
      icon: Bell,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      href: "/hotel/alerts"
    },
    {
      title: "Cambiar a Empleado",
      description: "Accede al sistema como empleado",
      icon: User,
      color: "bg-teal-500",
      hoverColor: "hover:bg-teal-600",
      href: "/hotel/switch-user",
      permission: "users.switch"
    }
  ];

  if (loading) {
    return <LoadingPage message="Cargando dashboard..." />;
  }

  return (
    <div className="w-full mb-20">
        {/* Subscription Status */}
        <SubscriptionStatus 
          showDetails={true}
          onUpgrade={() => setShowPaymentModal(true)}
        />

        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-white stroke-[1.5]" />
                </div>
              <div>
                <h1 className="text-3xl font-bold text-blue-600 font-title">
                  {businessInfo ? capitalizeText(businessInfo.business_name) : 'Dashboard Hotel'}
                </h1>
                <p className="text-gray-600">
                  Bienvenido, {user?.name ? capitalizeText(user.name) : 'Usuario'}
                </p>
                {businessInfo && (
                  <p className="text-lg text-gray-800 font-semibold">
                    {businessInfo.business_id}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Bell className="h-4 w-4 stroke-1" />
                <span>Notificaciones</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4 stroke-1" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Habitaciones</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalRooms}</p>
                </div>
                <Bed className="h-8 w-8 text-blue-600 stroke-[1.5]" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ocupadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.occupiedRooms}</p>
                </div>
                <Users className="h-8 w-8 text-green-600 stroke-[1.5]" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Reservas Hoy</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.reservationsToday}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600 stroke-[1.5]" />
              </div>
            </div>
            <div className="bg-blue15/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ingresos</p>
                  <p className="text-2xl font-bold text-blue6">${stats.totalIncome.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue6 stroke-[1.5]" />
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          {businessInfo && (
            <div className="mt-6">
              <AlertsPanelWithHistory businessId={businessInfo.id} maxAlerts={3} />
            </div>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dashboardModules
            .filter(module => !module.permission || hasPermission(module.permission))
            .map((module, index) => (
            <div
              key={index}
              className="bg-white rounded shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-600"
              onClick={() => router.push(module.href)}
            >
              <div className="text-center">
                <div className={`${module.color} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                  <module.icon className="h-8 w-8 text-white stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-title">
                  {module.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {module.description}
                </p>
                <Button 
                  className={`${module.color} ${module.hoverColor} text-white w-full`}
                  size="sm"
                >
                  Acceder
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            // Recargar la página para actualizar el estado de la suscripción
            window.location.reload();
          }}
        />
      </div>
  );
}