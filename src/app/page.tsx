import { Button } from "@/components/ui/button";
import { Building2, Users, BarChart3, Settings, ArrowRight, CheckCircle } from "lucide-react";
import { APP_CONFIG, COMPANY_INFO } from "@/lib/constants";
import Link from "next/link";
import BaseLayout from "@/components/layout/base-layout";

export default function Home() {
  return (
    <BaseLayout>
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue1 sm:text-6xl font-title">
          Software de Gestión
          <span className="text-blue8"> para tu Negocio</span>
        </h1>
        <p className="mt-6 text-xl text-gray4 max-w-3xl mx-auto font-body">
          INGENIT SpA desarrolla software especializado para hoteles y restaurantes. 
          Automatiza procesos, optimiza operaciones y mejora la eficiencia de tu establecimiento.
        </p>
        
        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/business-type">
            <Button size="lg" className="bg-blue8 hover:bg-blue6 text-white font-body px-8">
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/business-type">
            <Button size="lg" variant="outline" className="border-blue8 text-blue8 hover:bg-blue15 font-body px-8">
              Ver Demo
            </Button>
          </Link>
        </div>
      </div>

      {/* Business Types */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Hotels Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray8">
          <div className="flex items-start space-x-4">
            <div className="bg-blue15 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-blue8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue1 mb-3 font-title">
                Software para Hoteles
              </h3>
              <p className="text-gray4 mb-4 font-body">
                Sistema de gestión integral para hoteles, moteles, hostales y establecimientos de hospedaje.
              </p>
              <ul className="space-y-2 text-sm text-gray4 font-body">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue8 mr-2" />
                  Check-in/Check-out automatizado
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue8 mr-2" />
                  Gestión de habitaciones en tiempo real
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue8 mr-2" />
                  Control de limpieza y mantenimiento
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue8 mr-2" />
                  Reportes de ingresos y balances
                </li>
              </ul>
              <Link href="/business-type">
                <Button className="mt-4 bg-blue8 hover:bg-blue6 text-white font-body">
                  Acceder al Software
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Restaurants Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray8">
          <div className="flex items-start space-x-4">
            <div className="bg-gold7 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0">
              <Users className="h-8 w-8 text-gold3" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue1 mb-3 font-title">
                Software para Restaurantes
              </h3>
              <p className="text-gray4 mb-4 font-body">
                Sistema de gestión especializado para restaurantes, bares, cafeterías y establecimientos gastronómicos.
              </p>
              <ul className="space-y-2 text-sm text-gray4 font-body">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-gold3 mr-2" />
                  Comandas digitales
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-gold3 mr-2" />
                  Gestión de menús y disponibilidad
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-gold3 mr-2" />
                  Control de mesas y ocupabilidad
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-gold3 mr-2" />
                  Sistema de cobro integrado
                </li>
              </ul>
              <Link href="/business-type">
                <Button className="mt-4 bg-gold3 hover:bg-gold2 text-white font-body">
                  Acceder al Software
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray8 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-blue1 mb-4 font-title">
            ¿Por qué elegir ShIngenit?
          </h2>
          <p className="text-xl text-gray4 max-w-2xl mx-auto font-body">
            Desarrollada por INGENIT SpA, nuestra plataforma está diseñada específicamente para optimizar las operaciones de tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue15 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-blue8" />
            </div>
            <h3 className="text-xl font-semibold text-blue1 mb-2 font-title">
              Gestión en Tiempo Real
            </h3>
            <p className="text-gray4 font-body">
              Monitorea todas las operaciones de tu negocio en tiempo real desde cualquier dispositivo.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-gold7 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-gold3" />
            </div>
            <h3 className="text-xl font-semibold text-blue1 mb-2 font-title">
              Personalizable
            </h3>
            <p className="text-gray4 font-body">
              Adapta la plataforma a las necesidades específicas de tu negocio y tipo de establecimiento.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue14 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue10" />
            </div>
            <h3 className="text-xl font-semibold text-blue1 mb-2 font-title">
              Soporte Técnico
            </h3>
            <p className="text-gray4 font-body">
              Equipo de desarrollo especializado en soluciones para el sector turístico y gastronómico.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue8 to-blue6 rounded-2xl shadow-xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4 font-title">
          ¿Listo para optimizar tu negocio?
        </h2>
        <p className="text-xl mb-8 font-body opacity-90">
          Únete a los establecimientos que ya confían en las soluciones tecnológicas de INGENIT SpA.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/business-type">
            <Button size="lg" className="bg-white text-blue8 hover:bg-gray10 font-body px-8">
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/business-type">
            <Button size="lg" variant="outline" className="border-white text-blue8 hover:bg-gray10 hover:text-blue8 font-body px-8">
              Solicitar Demo
            </Button>
          </Link>
        </div>
      </div>
    </BaseLayout>
  );
}
