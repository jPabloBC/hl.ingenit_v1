import { Button } from "@/components/ui/button";
import { Building2, Users, BarChart3, Settings, Users2, Calendar, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import BaseLayout from "@/components/layout/base-layout";

export default function AdminDashboard() {
  return (
    <BaseLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">
              Panel de Administración
            </h1>
            <p className="text-gray4 font-body">
              Bienvenido a tu plataforma de gestión
            </p>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" className="border-blue8 text-blue8 hover:bg-blue15 font-body">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
            <Button className="bg-blue8 hover:bg-blue6 text-white font-body">
              <Users2 className="h-4 w-4 mr-2" />
              Mi Perfil
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4 font-body">Habitaciones</p>
                <p className="text-2xl font-bold text-blue1 font-title">24</p>
                <p className="text-xs text-green-600 font-body">+2 disponibles</p>
              </div>
              <div className="bg-blue15 rounded-full p-3">
                <Building2 className="h-6 w-6 text-blue8" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4 font-body">Huéspedes</p>
                <p className="text-2xl font-bold text-blue1 font-title">18</p>
                <p className="text-xs text-blue-600 font-body">Actualmente</p>
              </div>
              <div className="bg-gold7 rounded-full p-3">
                <Users className="h-6 w-6 text-gold3" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4 font-body">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-blue1 font-title">$2,450</p>
                <p className="text-xs text-green-600 font-body">+12% vs ayer</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray4 font-body">Ocupación</p>
                <p className="text-2xl font-bold text-blue1 font-title">75%</p>
                <p className="text-xs text-blue-600 font-body">Este mes</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray8">
            <h2 className="text-xl font-bold text-blue1 mb-4 font-title">
              Acciones Rápidas
            </h2>
            <div className="space-y-3">
              <Button className="w-full justify-start bg-blue8 hover:bg-blue6 text-white font-body">
                <Users className="h-4 w-4 mr-3" />
                Nuevo Check-in
              </Button>
              <Button className="w-full justify-start bg-gold3 hover:bg-gold2 text-white font-body">
                <Calendar className="h-4 w-4 mr-3" />
                Gestionar Reservas
              </Button>
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white font-body">
                <Building2 className="h-4 w-4 mr-3" />
                Estado de Habitaciones
              </Button>
              <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white font-body">
                <BarChart3 className="h-4 w-4 mr-3" />
                Ver Reportes
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray8">
              {/* Archivo movido a ../users/page.tsx */}
            <h2 className="text-xl font-bold text-blue1 mb-4 font-title">
              Actividad Reciente
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray10 rounded-lg">
                <div className="bg-green-100 rounded-full p-2">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue1 font-body">Check-in completado</p>
                  <p className="text-xs text-gray4 font-body">Habitación 205 - 2 min atrás</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray10 rounded-lg">
                <div className="bg-blue-100 rounded-full p-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue1 font-body">Nueva reserva</p>
                  <p className="text-xs text-gray4 font-body">Habitación 301 - 15 min atrás</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray10 rounded-lg">
                <div className="bg-yellow-100 rounded-full p-2">
                  <Building2 className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue1 font-body">Limpieza completada</p>
                  <p className="text-xs text-gray4 font-body">Habitación 102 - 1 hora atrás</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray10 rounded-lg">
                <div className="bg-red-100 rounded-full p-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue1 font-body">Pago procesado</p>
                  <p className="text-xs text-gray4 font-body">$450 - Habitación 203 - 2 horas atrás</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation to Modules */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray8">
          <h2 className="text-xl font-bold text-blue1 mb-4 font-title">
            Módulos del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/rooms">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-blue8 text-blue8 hover:bg-blue15 font-body">
                <Building2 className="h-6 w-6" />
                <span>Gestión de Habitaciones</span>
              </Button>
            </Link>
            
            <Link href="/admin/guests">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-gold3 text-gold3 hover:bg-gold7 font-body">
                <Users className="h-6 w-6" />
                <span>Gestión de Huéspedes</span>
              </Button>
            </Link>
            
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-green-600 text-green-600 hover:bg-green-50 font-body">
                <BarChart3 className="h-6 w-6" />
                <span>Reportes y Estadísticas</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
