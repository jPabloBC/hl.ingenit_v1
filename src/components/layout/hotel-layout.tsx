"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Bed, 
  Menu,
  X,
  LogOut,
  User,
  Home,
  ChevronRight,
  Bell,
  ShoppingCart,
  UserCheck,
  Trash2
} from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  business_id?: string;
}

interface HotelLayoutProps {
  children: React.ReactNode;
}

const mainNavigationItems = [
  {
    title: "Dashboard",
    href: "/business-type/hotel",
    icon: Home,
    description: "Vista general del hotel"
  },
  {
    title: "Ventas",
    href: "/business-type/hotel/sales",
    icon: ShoppingCart,
    description: "Venta de habitaciones"
  },
  {
    title: "Recepción",
    href: "/business-type/hotel/front-desk",
    icon: UserCheck,
    description: "Check-in y check-out"
  },
  {
    title: "Habitaciones",
    href: "/business-type/hotel/rooms",
    icon: Bed,
    description: "Gestión de habitaciones"
  },
  {
    title: "Reservas",
    href: "/business-type/hotel/reservations",
    icon: Calendar,
    description: "Sistema de reservas"
  },
  {
    title: "Huéspedes",
    href: "/business-type/hotel/guests",
    icon: Users,
    description: "Base de datos de clientes"
  },
  {
    title: "Pagos",
    href: "/business-type/hotel/payments",
    icon: CreditCard,
    description: "Transacciones Webpay"
  },
  {
    title: "Reportes",
    href: "/business-type/hotel/reports",
    icon: BarChart3,
    description: "Estadísticas y análisis"
  }
];

const adminNavigationItem = {
  title: "Configuración SII",
  href: "/business-type/hotel/settings",
  icon: Settings,
  description: "Facturación electrónica"
};

export default function HotelLayout({ children }: HotelLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

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
      setLoading(false);

    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleIconUpload = async (file: File) => {
    try {
      setUploadingIcon(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/icons/hotel-icon.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hotel')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Error uploading icon:', uploadError);
        alert(`Error al subir el icono: ${uploadError.message}`);
        return;
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hotel')
        .getPublicUrl(fileName);

      // Update business record with icon URL
      console.log('Attempting to update business with icon URL:', publicUrl);
      console.log('User ID:', user.id);
      
      // First, let's check if the business record exists
      const { data: existingBusiness, error: checkError } = await supabase
        .from('hl_business')
        .select('id, user_id, business_name')
        .eq('user_id', user.id)
        .single();
      
      if (checkError) {
        console.error('Error checking business:', checkError);
        alert(`Error al verificar el negocio: ${checkError.message}`);
        return;
      }
      
      console.log('Existing business record:', existingBusiness);
      
      const { data: updateData, error: updateError } = await supabase
        .from('hl_business')
        .update({ 
          icon_url: publicUrl
        })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('Error updating business:', updateError);
        console.error('Error message:', updateError.message);
        console.error('Error code:', updateError.code);
        console.error('Full error object:', JSON.stringify(updateError, null, 2));
        
        alert(`Error al actualizar el negocio: ${updateError.message}`);
        return;
      }

      console.log('Business updated successfully:', updateData);

      // Refresh business info
      await checkUser();
      setShowIconEditor(false);
      alert('Icono actualizado exitosamente');

    } catch (error) {
      console.error('Error handling icon upload:', error);
      console.error('Full error:', JSON.stringify(error, null, 2));
      alert('Error al procesar el icono');
    } finally {
      setUploadingIcon(false);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === "/business-type/hotel") {
      // Handle both with and without trailing slash
      return pathname === href || pathname === href + "/";
    }
    
    return pathname.startsWith(href);
  };

  const getActiveRouteTitle = () => {
    const activeMainItem = mainNavigationItems.find(item => isActiveRoute(item.href));
    if (activeMainItem) return activeMainItem.title;
    
    if (isActiveRoute(adminNavigationItem.href)) return adminNavigationItem.title;
    
    return 'Dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray9 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray9 font-body">
      <div className="h-screen">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col h-screen max-h-screen overflow-hidden">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray8 flex-shrink-0">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-14 h-14 flex items-center justify-center border-2 border-gray11 rounded-full flex-shrink-0">
                <Image
                  src="/assets/icon_ingenIT.png"
                  alt="INGENIT Hotel Icon"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-light text-gray7 font-title truncate">
                    INGENIT
                  </h2>
                  <p className="text-xs text-gray6 truncate">Hotel Management</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Botón de expandir/colapsar en el borde derecho */}
          <div className="absolute top-4 -right-6 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex-shrink-0 bg-white border-t border-r border-b border-gray10 rounded-r-lg rounded-l-none hover:bg-gray10 px-1"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${!sidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-3 border-b border-gray8 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div 
                className="bg-blue8 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer hover:bg-blue6 transition-colors overflow-hidden"
                onClick={() => setShowIconEditor(true)}
                title="Click para cambiar el icono del usuario"
              >
                {businessInfo?.icon_url ? (
                  <Image
                    src={businessInfo.icon_url}
                    alt="User Icon"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="text-white text-4xl font-normal">
                    {businessInfo?.business_name ? businessInfo.business_name.charAt(0).toUpperCase() : 'H'}
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  {businessInfo && (
                    <p className="text-lg font-semibold text-blue8 truncate">
                      {capitalizeText(businessInfo.business_name)}
                    </p>
                  )}
                  <p className="text-base font-medium text-blue1 truncate">
                    {user?.name ? capitalizeText(user.name) : 'Usuario'}
                  </p>
                  <p className="text-xs text-gray4 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
            {mainNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <div key={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full h-auto p-2 transition-all duration-200 relative ${
                      sidebarCollapsed 
                        ? 'justify-center' 
                        : 'justify-start'
                    } ${
                      isActive 
                        ? 'bg-blue8 text-white hover:bg-blue6 shadow-md border-l-4 border-white' 
                        : 'text-gray4 hover:text-blue1 hover:bg-blue15'
                    }`}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    title={sidebarCollapsed ? item.title : undefined}
                  >
                    <Icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'} ${
                      isActive ? 'text-white' : ''
                    }`} />
                    {!sidebarCollapsed && (
                      <>
                        <div className="text-left">
                          <div className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.title}</div>
                          <div className={`text-xs ${isActive ? 'text-white opacity-90' : 'opacity-75'}`}>{item.description}</div>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 ml-auto text-white" />}
                      </>
                    )}
                    {/* Active indicator for collapsed sidebar */}
                    {sidebarCollapsed && isActive && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
                    )}
                  </Button>
                </div>
              );
            })}
          </nav>

          {/* Admin Navigation */}
          <div className="p-3 flex-shrink-0">
            {(() => {
              const Icon = adminNavigationItem.icon;
              const isActive = isActiveRoute(adminNavigationItem.href);
              
              return (
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full h-auto p-2 transition-all duration-200 relative ${
                    sidebarCollapsed 
                      ? 'justify-center' 
                      : 'justify-start'
                  } ${
                    isActive 
                      ? 'bg-blue8 text-white hover:bg-blue6 shadow-md border-l-4 border-white' 
                      : 'text-gray4 hover:text-blue1 hover:bg-blue15'
                  }`}
                  onClick={() => {
                    router.push(adminNavigationItem.href);
                    setSidebarOpen(false);
                  }}
                  title={sidebarCollapsed ? adminNavigationItem.title : undefined}
                >
                  <Icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'} ${
                    isActive ? 'text-white' : ''
                  }`} />
                  {!sidebarCollapsed && (
                    <>
                      <div className="text-left">
                        <div className={`font-medium ${isActive ? 'text-white' : ''}`}>{adminNavigationItem.title}</div>
                        <div className={`text-xs ${isActive ? 'text-white opacity-90' : 'opacity-75'}`}>{adminNavigationItem.description}</div>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto text-white" />}
                    </>
                  )}
                  {/* Active indicator for collapsed sidebar */}
                  {sidebarCollapsed && isActive && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
                  )}
                </Button>
              );
            })()}
          </div>

                              {/* Sidebar Footer */}
                    <div className="p-3 border-t border-gray8 flex-shrink-0">
            <Button
              variant="ghost"
              className={`w-full text-gray4 hover:text-red-600 hover:bg-red-50 ${
                sidebarCollapsed ? 'justify-center' : 'justify-start'
              }`}
              onClick={handleLogout}
              title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
            >
              <LogOut className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
              {!sidebarCollapsed && "Cerrar Sesión"}
            </Button>
          </div>
        </div>
      </div>

              {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} bg-gray9 min-h-screen`}>
          {/* Top Bar */}
          <div className="bg-white border-b border-gray8 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                                        <div>
                          <h1 className="text-xl font-bold text-blue1 font-title">
                            {getActiveRouteTitle()}
                          </h1>
                          <p className="text-sm text-gray4">
                            {mainNavigationItems.find(item => isActiveRoute(item.href))?.description || 
                             (isActiveRoute(adminNavigationItem.href) ? adminNavigationItem.description : 'Panel de control')}
                          </p>
                        </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notificaciones</span>
                </Button>
              </div>
            </div>
          </div>

                            {/* Page Content */}
                  <main className="p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Modal para editar icono */}
      {showIconEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue1">Cambiar Icono del Hotel</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIconEditor(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Vista previa del icono actual */}
              <div className="flex justify-center mb-4">
                <div className="bg-blue8 rounded-full w-16 h-16 flex items-center justify-center overflow-hidden">
                  {businessInfo?.icon_url ? (
                    <Image
                      src={businessInfo.icon_url}
                      alt="Hotel Icon"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-white text-xl font-bold">
                      {businessInfo?.business_name ? businessInfo.business_name.charAt(0).toUpperCase() : 'H'}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleIconUpload(file);
                    }
                  }}
                  disabled={uploadingIcon}
                />
              </div>
              
              {/* Botón para eliminar imagen */}
              {businessInfo?.icon_url && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  onClick={async () => {
                    try {
                      setUploadingIcon(true);
                      
                      // Eliminar la imagen del storage
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      
                      const fileExt = businessInfo.icon_url.split('.').pop()?.split('?')[0];
                      const fileName = `${user.id}/icons/hotel-icon.${fileExt}`;
                      
                      const { error: deleteError } = await supabase.storage
                        .from('hotel')
                        .remove([fileName]);
                      
                      if (deleteError) {
                        console.error('Error deleting icon:', deleteError);
                        alert(`Error al eliminar el icono: ${deleteError.message}`);
                        return;
                      }
                      
                      // Actualizar la base de datos para eliminar la URL
                      const { error: updateError } = await supabase
                        .from('hl_business')
                        .update({ icon_url: null })
                        .eq('user_id', user.id);
                      
                      if (updateError) {
                        console.error('Error updating business:', updateError);
                        alert(`Error al actualizar el negocio: ${updateError.message}`);
                        return;
                      }
                      
                      // Refresh business info
                      await checkUser();
                      setShowIconEditor(false);
                      alert('Icono eliminado exitosamente');
                      
                    } catch (error) {
                      console.error('Error handling icon deletion:', error);
                      alert('Error al eliminar el icono');
                    } finally {
                      setUploadingIcon(false);
                    }
                  }}
                  disabled={uploadingIcon}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar imagen actual
                </Button>
              )}
              
              {uploadingIcon && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue8"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    {businessInfo?.icon_url ? 'Eliminando icono...' : 'Subiendo icono...'}
                  </span>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <p>• Formato recomendado: PNG, JPG</p>
                <p>• Tamaño máximo: 2MB</p>
                <p>• Se recomienda una imagen cuadrada</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
