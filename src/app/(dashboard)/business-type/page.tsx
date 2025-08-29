"use client";

import { Button } from "@/components/ui/button";
import { Building2, Users, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function BusinessTypePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginMode = searchParams?.get('login') === '1';
  
  function handleLogin(type: string) {
    if (router) router.push(`/login?type=${type}`);
  }
  
  return (
    <div className="min-h-screen bg-gray9 from-blue15 to-blue13 font-body">
      <Header />

      <Suspense fallback={<div>Loading...</div>}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue1 mb-4 font-title">
            Elige tu Software de Gestión
          </h1>
          <p className="text-xl text-gray4 max-w-2xl mx-auto font-body">
            Selecciona tu tipo de negocio para acceder a la plataforma de gestión especializada.
          </p>
        </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Hotels Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray8 hover:shadow-2xl transition-shadow">
            <div className="text-center">
              <div className="bg-blue15 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Image
                  src="/assets/icon_ingenIT.png"
                  alt="INGENIT Hotel Icon"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-blue1 mb-4 font-title">
                Software para Hoteles y Hospedajes
              </h2>
              <p className="text-gray4 mb-6 font-body">
                Sistema de gestión completo para hoteles, moteles, hostales, resorts y establecimientos de hospedaje.
              </p>
              
              <div className="text-left mb-6">
                <h3 className="font-semibold text-blue1 mb-3 font-title">Módulos del software:</h3>
                <ul className="space-y-2 text-sm text-gray4 font-body">
                  <li>• Sistema de Check-in/Check-out</li>
                  <li>• Gestión de habitaciones y disponibilidad</li>
                  <li>• Control de limpieza y mantenimiento</li>
                  <li>• Base de datos de huéspedes</li>
                  <li>• Reportes financieros y estadísticas</li>
                  <li>• Módulo de reservas y facturación</li>
                </ul>
              </div>
              
              {loginMode ? (
                <Button size="lg" className="bg-blue8 hover:bg-blue6 text-white font-body w-full" onClick={() => handleLogin('hotel')}>
                  Iniciar Sesión Hotel
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Link href="/register?type=hotel">
                  <Button size="lg" className="bg-blue8 hover:bg-blue6 text-white font-body w-full">
                    Registrarse
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Restaurants Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray8 hover:shadow-2xl transition-shadow">
            <div className="text-center">
              <div className="bg-gold7 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-gold3" />
              </div>
              <h2 className="text-2xl font-bold text-blue1 mb-4 font-title">
                Software para Restaurantes y Bares
              </h2>
              <p className="text-gray4 mb-6 font-body">
                Sistema de gestión especializado para restaurantes, bares, cafeterías, pizzerías y establecimientos gastronómicos.
              </p>
              
              <div className="text-left mb-6">
                <h3 className="font-semibold text-blue1 mb-3 font-title">Módulos del software:</h3>
                <ul className="space-y-2 text-sm text-gray4 font-body">
                  <li>• Sistema de comandas digitales</li>
                  <li>• Gestión de menús y precios</li>
                  <li>• Control de mesas y turnos</li>
                  <li>• Sistema de punto de venta (POS)</li>
                  <li>• Gestión de inventario y stock</li>
                  <li>• Reportes de ventas y análisis</li>
                </ul>
              </div>
              
              {loginMode ? (
                <Button size="lg" className="bg-gold3 hover:bg-gold2 text-white font-body w-full" onClick={() => handleLogin('restaurant')}>
                  Iniciar Sesión Restaurante
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Link href="/register?type=restaurant">
                  <Button size="lg" className="bg-gold3 hover:bg-gold2 text-white font-body w-full">
                    Registrarse
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        </main>
      </Suspense>

      <Footer />
    </div>
  );
}
