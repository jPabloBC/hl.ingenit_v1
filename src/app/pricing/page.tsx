"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Star, ArrowRight, Globe, MapPin, Gift, Info, X } from "lucide-react";
import BaseLayout from "@/components/layout/base-layout";
import Link from "next/link";
import { useRegion, getRegionalPricing, formatCurrency } from "@/hooks/useRegion";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function PricingPageContent() {
  const { region, loading } = useRegion();
  const plans = region ? getRegionalPricing(region) : [];
  const searchParams = useSearchParams();
  const isPaymentMode = searchParams.get('payment') === 'true';

  // Si viene desde el modal de trial expirado, mostrar mensaje especial
  useEffect(() => {
    if (isPaymentMode) {
      // Scroll to top para mostrar el mensaje
      window.scrollTo(0, 0);
    }
  }, [isPaymentMode]);

  if (loading) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4 font-body">Detectando tu ubicación...</p>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
        {isPaymentMode && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Info className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Período de Prueba Expirado</h2>
            </div>
            <p className="text-red-700">
              Tu período de prueba ha terminado. Selecciona un plan para continuar usando la plataforma.
            </p>
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl font-bold text-blue1 mb-6 font-title">
          Planes de Suscripción
        </h1>
        <p className="text-xl text-gray4 max-w-3xl mx-auto font-body mb-4">
          {isPaymentMode 
            ? "Selecciona un plan para continuar usando la plataforma."
            : "Elige el plan perfecto para tu hotel. Todos incluyen soporte técnico y actualizaciones automáticas."
          }
        </p>
        
        {/* Region Display */}
        {region && (
          <div className="inline-flex items-center bg-blue15 text-blue8 px-4 py-2 rounded-full text-sm font-body">
            <Globe className="h-4 w-4 mr-2" />
            <span>Precios en {region.currency} para {region.country}</span>
            <MapPin className="h-4 w-4 ml-2" />
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-white rounded-2xl shadow-lg border-2 p-6 relative flex flex-col ${
              plan.popular ? 'border-blue8' : 'border-gray8'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue8 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  POPULAR
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-blue1 mb-2 font-title">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue8">
                  {plan.id === 'enterprise' ? 'Consultar' : 
                   formatCurrency(plan.price, plan.currency)}
                </span>
                <span className="text-gray4">
                  /{plan.period}
                  {plan.id !== 'enterprise' && (
                    <div className="text-xs text-gray-500 mt-1">
                      + {region?.countryCode === 'CL' ? 'IVA' : 'impuestos'}
                    </div>
                  )}
                </span>
              </div>
              <p className="text-sm text-gray4 font-body">
                Ideal para hoteles {plan.id === 'starter' ? 'pequeños' : plan.id === 'professional' ? 'medianos' : 'grandes'}
              </p>
            </div>

            <ul className="space-y-3 mb-6 text-sm font-body flex-grow">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  {feature.includes('Prueba gratuita') ? (
                    <Gift className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-blue8 mr-2 flex-shrink-0" />
                  )}
                  <span className={feature.includes('Prueba gratuita') ? 'text-green-600 font-medium' : ''}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link 
                href={
                  isPaymentMode 
                    ? `/book/payment?plan=${plan.id}` 
                    : plan.id === 'enterprise' 
                      ? '/contact' 
                      : `/register?plan=${plan.id}`
                } 
                className="block"
              >
                <Button className="w-full bg-blue8 hover:bg-blue6 text-white font-body">
                  {isPaymentMode 
                    ? 'Pagar Plan'
                    : plan.id === 'enterprise' 
                      ? 'Contactar Ventas' 
                      : 'Comenzar Prueba Gratuita'
                  }
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray8 mb-16">
        <h2 className="text-2xl lg:text-3xl font-bold text-blue1 text-center mb-6 lg:mb-8 font-title">
          Comparación de Funcionalidades
        </h2>
        
        {/* Development Status Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Funcionalidades Incluidas
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Todos los planes incluyen un conjunto completo de funcionalidades para la gestión hotelera moderna.
                </p>
                <p>
                  Las funcionalidades específicas se detallan durante el proceso de implementación según las necesidades de cada hotel.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray8">
                <th className="text-left py-3 px-3 font-semibold text-blue1 text-sm">Funcionalidad</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-3 px-3 font-semibold text-blue1 text-sm">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs lg:text-sm font-body">
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Habitaciones</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    {plan.id === 'starter' ? '20' : 
                     plan.id === 'professional' ? '50' : 
                     plan.id === 'business' ? '80' :
                     '80+'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Gestión de Reservas</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Gestión de Huéspedes</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Sistema de Pagos</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Facturación Electrónica</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Reservas Web</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Reportes y Analytics</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    {plan.id === 'starter' ? (
                      <span className="text-xs text-gray-600">Básicos</span>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Soporte Técnico</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    {plan.id === 'starter' ? 'Básico' : 
                     plan.id === 'professional' ? '24/7' :
                     plan.id === 'business' ? '24/7' : 'Dedicado'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray8">
                <td className="py-2 px-3">Funcionalidades Avanzadas</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-2 px-3">
                    {plan.id === 'starter' ? (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        

      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue8 to-blue6 rounded-2xl shadow-xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4 font-title">
          ¿Listo para optimizar tu hotel?
        </h2>
        <p className="text-xl mb-8 font-body opacity-90">
          Comienza con el plan de prueba gratuito y descubre cómo podemos transformar tu operación hotelera.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register?plan=starter">
            <Button size="lg" className="bg-white text-blue8 hover:bg-gray10 font-body px-8">
              Comenzar Prueba Gratuita (14 días)
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="border-blue10 bg-blue8 text-white hover:bg-white hover:text-blue8 font-body px-8">
              Hablar con Ventas
            </Button>
          </Link>
        </div>
      </div>
      </div>
    </BaseLayout>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <BaseLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4 font-body">Cargando...</p>
        </div>
      </BaseLayout>
    }>
      <PricingPageContent />
    </Suspense>
  );
}