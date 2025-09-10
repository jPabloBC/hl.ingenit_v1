
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BaseLayout from "@/components/layout/base-layout";


export default function HotelSummary() {
  return (
    <BaseLayout>
  <main className="flex flex-col md:flex-row w-full max-w-full h-[calc(100vh-80px)] min-h-[500px] overflow-hidden">
        {/* Columna de texto */}
        <div className="flex flex-col justify-center px-8 py-16 md:w-1/2 w-full bg-white/90">
          <h1 className="text-4xl font-bold text-blue8 mb-4 font-title">Software para Hoteles</h1>
          <p className="text-gray5 mb-6 font-body text-lg">
            Gestiona tu hotel de manera eficiente y profesional con una plataforma moderna, intuitiva y segura.
          </p>
          <ul className="space-y-3 text-base text-gray6 font-body mb-8">
            <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 bg-blue8 rounded-full"></span>Reservas y disponibilidad en tiempo real</li>
            <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 bg-blue8 rounded-full"></span>Gestión de habitaciones y huéspedes</li>
            <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 bg-blue8 rounded-full"></span>Control de limpieza y mantenimiento</li>
            <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 bg-blue8 rounded-full"></span>Reportes de ingresos y balances</li>
          </ul>
          <p className="text-gray5 mb-8 font-body text-base">
            Optimiza tus operaciones, mejora la experiencia de tus huéspedes y toma decisiones informadas con nuestro software especializado para hoteles.
          </p>
          <Link href="/register?businessType=hotel">
            <Button className="w-full bg-blue8 hover:bg-blue6 text-white font-body text-lg py-3">Comenzar Registro</Button>
          </Link>
        </div>
        {/* Columna de imagen */}
        <div className="w-full md:w-1/2 h-64 md:h-auto flex items-stretch">
          <img
            src="/assets/images/hotel.jpg"
            alt="Gráfico hotel"
            className="w-full h-full object-cover"
            style={{ background: 'rgba(255,255,255,0.7)' }}
          />
        </div>
      </main>
    </BaseLayout>
  );
}