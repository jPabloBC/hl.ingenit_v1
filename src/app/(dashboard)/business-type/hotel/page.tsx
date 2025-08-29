"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
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
  Home
} from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    reservationsToday: 0,
    totalIncome: 0
  });

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
    checkUser();
  }, []);

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

      // Get occupied rooms (rooms with status 'occupied' or similar)
      const { count: occupiedRooms } = await supabase
        .from('hl_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'occupied');

      // For now, reservations and income are 0 since we don't have those tables yet
      const reservationsToday = 0;
      const totalIncome = 0;

      setStats({
        totalRooms: totalRooms || 0,
        occupiedRooms: occupiedRooms || 0,
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
      title: "Gestión de Habitaciones",
      description: "Administra habitaciones, disponibilidad y estados",
      icon: Bed,
      color: "bg-blue8",
      hoverColor: "hover:bg-blue6",
      href: "/business-type/hotel/rooms"
    },
    {
      title: "Reservas",
      description: "Sistema de reservas y check-in/check-out",
      icon: Calendar,
      color: "bg-green-600",
      hoverColor: "hover:bg-green-700",
      href: "/business-type/hotel/reservations"
    },
    {
      title: "Huéspedes",
      description: "Base de datos de clientes y huéspedes",
      icon: Users,
      color: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      href: "/business-type/hotel/guests"
    },
    {
      title: "Facturación",
      description: "Gestión de pagos, facturas y cobros",
      icon: CreditCard,
      color: "bg-orange-600",
      hoverColor: "hover:bg-orange-700",
      href: "/business-type/hotel/billing"
    },
    {
      title: "Reportes",
      description: "Estadísticas, análisis y reportes financieros",
      icon: BarChart3,
      color: "bg-indigo-600",
      hoverColor: "hover:bg-indigo-700",
      href: "/business-type/hotel/reports"
    },
    {
      title: "Configuración",
      description: "Configuración del hotel y preferencias",
      icon: Settings,
      color: "bg-gray-600",
      hoverColor: "hover:bg-gray-700",
      href: "/business-type/hotel/settings"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray9 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <HotelLayout>
      <div className="w-full">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue5 rounded-full w-16 h-16 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-white stroke-[1.5]" />
                </div>
              <div>
                <h1 className="text-3xl font-bold text-blue5 font-title">
                  {businessInfo ? capitalizeText(businessInfo.business_name) : 'Dashboard Hotel'}
                </h1>
                <p className="text-gray5">
                  Bienvenido, {user?.name ? capitalizeText(user.name) : 'Usuario'}
                </p>
                {businessInfo && (
                  <p className="text-lg text-gray9 font-semibold">
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
            <div className="bg-blue15 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Habitaciones</p>
                  <p className="text-2xl font-bold text-blue1">{stats.totalRooms}</p>
                </div>
                <Bed className="h-8 w-8 text-blue8 stroke-[1.5]" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Ocupadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.occupiedRooms}</p>
                </div>
                <Users className="h-8 w-8 text-green-600 stroke-[1.5]" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Reservas Hoy</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.reservationsToday}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600 stroke-[1.5]" />
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Ingresos</p>
                  <p className="text-2xl font-bold text-purple-600">${stats.totalIncome.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-600 stroke-[1.5]" />
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardModules.map((module, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray8 hover:border-blue8"
              onClick={() => router.push(module.href)}
            >
              <div className="text-center">
                <div className={`${module.color} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                  <module.icon className="h-8 w-8 text-white stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-bold text-blue1 mb-2 font-title">
                  {module.title}
                </h3>
                <p className="text-gray4 text-sm mb-4">
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
      </div>
    </HotelLayout>
  );
}
