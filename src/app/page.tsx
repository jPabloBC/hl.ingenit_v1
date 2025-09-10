"use client";

import { Button } from "@/components/ui/button";
import { Building2, Users, BarChart3, Settings, ArrowRight, CheckCircle, Star, Shield, Award, Clock, Smartphone, Database, Monitor } from "lucide-react";
import { APP_CONFIG, COMPANY_INFO } from "@/lib/constants";
import Link from "next/link";
import BaseLayout from "@/components/layout/base-layout";
import { useRegion, getRegionalPricing, formatCurrency } from "@/hooks/useRegion";
import { useState, useEffect } from "react";

export default function Home() {
  const { region, loading } = useRegion();
  const plans = region ? getRegionalPricing(region) : [];
  const starterPlan = plans.find(p => p.id === 'starter');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: CheckCircle,
      text: "Check-in/Check-out automatizado",
      color: "text-blue8"
    },
    {
      icon: CheckCircle,
      text: "Gestión de habitaciones en tiempo real",
      color: "text-blue8"
    },
    {
      icon: CheckCircle,
      text: "Control de limpieza y mantenimiento",
      color: "text-blue8"
    },
    {
      icon: CheckCircle,
      text: "Reportes de ingresos y balances",
      color: "text-blue8"
    },
    {
      icon: CheckCircle,
      text: "Integración SII y Webpay",
      color: "text-blue8"
    },
    {
      icon: CheckCircle,
      text: "Channel Manager para OTAs",
      color: "text-blue8"
    }
  ];

  const benefits = [
    {
      icon: BarChart3,
      title: "Gestión en Tiempo Real",
      description: "Monitorea ocupación, reservas y operaciones desde cualquier dispositivo en tiempo real.",
      color: "text-blue8",
      bgColor: "bg-blue15"
    },
    {
      icon: Settings,
      title: "Cumplimiento Regulatorio",
      description: "Integración con sistemas fiscales locales y cumplimiento de regulaciones del mercado hotelero.",
      color: "text-gold3",
      bgColor: "bg-gold7"
    },
    {
      icon: Users,
      title: "Soporte Especializado",
      description: "Equipo de desarrollo con experiencia en el sector turístico y hospitalidad.",
      color: "text-blue8",
      bgColor: "bg-blue15"
    }
  ];

  return (
    <BaseLayout>
      {/* Hero Section */}
      <section className={`relative overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Background Elements */}
        <div className="absolute inset-0 bg-blue5 rounded"></div>
        
        <div className="relative z-10 text-center px-2 sm:px-4 py-8 sm:py-10 lg:py-16">
          <div className="max-w-8xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 sm:px-6 py-3 sm:py-4 bg-blue8 text-white text-sm sm:text-base font-normal mb-6 sm:mb-8 rounded-lg">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-blue12 flex-shrink-0" />
              <span className="whitespace-nowrap">Gestiona de manera eficiente</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white font-title leading-tight mb-6 sm:mb-8 px-2">
              WebApp de Gestión
              <span className="block sm:inline text-blue11"> para tu Hotel</span>
            </h1>
            
            <p className="text-base sm:text-base md:text-lg lg:text-xl text-blue15 max-w-5xl mx-auto font-body px-2 sm:px-4 mb-8 sm:mb-10 leading-relaxed">
              INGENIT SpA desarrolla software especializado para hoteles, moteles y hostales. 
              Automatiza procesos, optimiza operaciones y mejora la eficiencia de tu establecimiento.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-2 sm:px-4 mb-8 sm:mb-10">
            <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="text-blue8 hover:bg-blue8 hover:text-white font-normal px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg w-full sm:w-auto transform hover:scale-105 transition-all duration-300 bg-white">
                  Comenzar Demo
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" className="bg-blue8 hover:bg-blue6 text-white font-normal px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg w-full sm:w-auto transform hover:scale-105 transition-all duration-300 border-0">
                  Ver Precios
                  <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </Link>

            </div>
            
            {/* Pricing CTA */}
            <div className="text-center px-2">
              <p className="text-base sm:text-xl text-gray3 font-body">
                <span className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-blue2 text-white font-normal text-base sm:text-lg border border-blue10 rounded-lg">
                  Planes desde $ 9.990.- + IVA / mes*
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Features */}
      <section className="mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray9 p-6 sm:p-10 lg:p-16 rounded">
            <div className="flex flex-col lg:flex-row items-start space-y-8 sm:space-y-10 lg:space-y-0 lg:space-x-10">
              <div className="bg-blue6 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0 mx-auto lg:mx-0 rounded">
                <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-white" strokeWidth={1} />
              </div>
              <div className="text-center lg:text-left flex-1">
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray6 mb-6 sm:mb-8 font-title">
                  Software Integral para Hoteles
                </h3>
                  <p className="text-gray3 mb-8 sm:mb-10 font-body text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed">
                    Sistema de gestión completo diseñado específicamente para establecimientos de hospedaje.
                  </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-base sm:text-lg lg:text-xl text-gray3 font-body">
                  {features.map((feature, index) => (
                    <div key={index} className={`flex items-center justify-center lg:justify-start p-4 sm:p-5 bg-gray10 border border-gray9 rounded-lg`}>
                      <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 mr-3 sm:mr-4 flex-shrink-0 ${feature.color}`} />
                      <span className="text-sm sm:text-base lg:text-lg leading-tight font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-3 sm:mb-5 lg:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray1 mb-6 sm:mb-8 font-title px-2">
              ¿Por qué elegir <span className="text-blue9">INGENIT</span> para tu hotel?
            </h2>
            <p className="text-base sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray3 max-w-5xl mx-auto font-body leading-relaxed px-2">
              Desarrollada específicamente para el sector hotelero, nuestra plataforma optimiza cada aspecto de tu operación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {benefits.map((benefit, index) => (
              <div key={benefit.title} className={`text-center p-6 sm:p-8 lg:p-10 bg-white border border-gray9 rounded`}>
                <div className={`${benefit.bgColor} w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8 rounded`}>
                  <benefit.icon className={`h-10 w-10 sm:h-12 sm:w-12 ${benefit.color}`} strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray1 mb-4 sm:mb-6 font-title">
                  {benefit.title}
                </h3>
                <p className="text-gray3 font-body text-base sm:text-lg lg:text-xl leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Technology Section */}
      <section className="mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue5 p-6 sm:p-10 lg:p-16 text-white rounded">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light mb-6 sm:mb-8 font-title px-2">
                Tecnología de <span className="text-blue9">Vanguardia</span>
              </h2>
              <p className="font-light text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray7 max-w-4xl mx-auto font-body leading-relaxed px-2">
                Construida para garantizar rendimiento, seguridad y escalabilidad.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center p-4 sm:p-6 bg-white/10 border border-white/20">
                <Smartphone className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-blue10 mx-auto mb-4 sm:mb-6" strokeWidth={1} />
                <h3 className="font-bold mb-3 text-base sm:text-lg">Mobile First</h3>
                <p className="text-sm sm:text-base text-gray9 leading-tight">Diseño responsivo para todos los dispositivos</p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-white/10 border border-white/20">
                <Database className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-blue8 mx-auto mb-4 sm:mb-6" strokeWidth={1} />
                <h3 className="font-bold mb-3 text-base sm:text-lg">Cloud Native</h3>
                <p className="text-sm sm:text-base text-gray9 leading-tight">Infraestructura escalable en la nube</p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-white/10 border border-white/20">
                <Shield className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-gold4 mx-auto mb-4 sm:mb-6" strokeWidth={1} />
                <h3 className="font-bold mb-3 text-base sm:text-lg">Seguridad</h3>
                <p className="text-sm sm:text-base text-gray9 leading-tight">Protección de datos y cumplimiento</p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-white/10 border border-white/20">
                <Monitor className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-blue12 mx-auto mb-4 sm:mb-6" strokeWidth={1} />
                <h3 className="font-bold mb-3 text-base sm:text-lg">Tiempo Real</h3>
                <p className="text-sm sm:text-base text-gray9 leading-tight">Sincronización instantánea</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue5 p-6 sm:p-10 lg:p-16 text-center text-white rounded">
            <div className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white/20 text-white text-sm sm:text-base font-normal mb-6 sm:mb-8 border border-white/30 rounded-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-3" />
              <span className="whitespace-nowrap">Al mejor precio</span>
            </div>
            
            <h2 className="text-gold3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-normal mb-6 sm:mb-8 font-title px-2">
              Planes desde $ 10.000.- + IVA / mes
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-8 sm:mb-10 font-light opacity-95 max-w-4xl mx-auto px-2 leading-relaxed text-gray8">
              Comienza con una prueba gratuita de 14 días. Sin compromiso, sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="border-[1px] border-white text-white hover:bg-white hover:text-blue8 font-normal px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl w-full sm:w-auto transform hover:scale-105 transition-all duration-300 bg-transparent">
                  Elegir Plan
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" className="bg-white text-blue8 hover:bg-gray10 font-normal px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl w-full sm:w-auto transform hover:scale-105 transition-all duration-300 border-0">
                  Ver Todos los Planes
                  <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </BaseLayout>
  );
}