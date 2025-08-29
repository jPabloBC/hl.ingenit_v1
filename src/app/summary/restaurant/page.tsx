
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BaseLayout from "@/components/layout/base-layout";

export default function RestaurantSummary() {
  return (
    <BaseLayout>
      <main className="flex flex-col md:flex-row w-full max-w-full h-[calc(100vh-80px)] min-h-[500px] overflow-hidden">
        {/* Columna de texto */}
        <div className="flex flex-col justify-center px-8 py-16 md:w-1/2 w-full bg-white/90">
          <h1 className="text-4xl font-bold text-gold3 mb-4 font-title">Software para Restaurantes</h1>
          <p className="text-gray4 mb-6 font-body text-lg">
            Descubre cómo nuestra plataforma puede potenciar tu restaurante, bar o cafetería:
          </p>
          <ul className="space-y-3 text-base text-gray4 font-body mb-8">
            <li>Comandas digitales</li>
            <li>Gestión de menús y disponibilidad</li>
            <li>Control de mesas y ocupabilidad</li>
            <li>Sistema de cobro integrado</li>
          </ul>
          <p className="text-gray4 mb-8 font-body text-base">
            Agiliza la atención, controla tu operación y aumenta la rentabilidad con nuestro software especializado para restaurantes.
          </p>
          <Link href="/register?businessType=restaurant">
            <Button className="w-full bg-gold3 hover:bg-gold2 text-white font-body text-lg py-3">Comenzar Registro</Button>
          </Link>
        </div>
        {/* Columna de imagen */}
        <div className="w-full md:w-1/2 h-64 md:h-auto flex items-stretch">
          <img
            src="/assets/images/hotel.jpg"
            alt="Gráfico restaurante"
            className="w-full h-full object-cover"
            style={{ background: 'rgba(255,255,255,0.7)' }}
          />
        </div>
      </main>
    </BaseLayout>
  );
}
