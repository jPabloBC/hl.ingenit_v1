import { useState, useEffect } from 'react';

export interface Region {
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  language: string;
  timezone: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  currencySymbol: string;
  period: string;
  features: string[];
  popular?: boolean;
  trial?: boolean;
}

export interface RegionalPricing {
  region: Region;
  plans: PricingPlan[];
}

export function useRegion() {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectRegion = async () => {
      try {
        // Intentar obtener la región desde la API de geolocalización
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const detectedRegion: Region = {
          country: data.country_name || 'Chile',
          countryCode: data.country_code || 'CL',
          currency: data.currency || 'CLP',
          currencySymbol: getCurrencySymbol(data.currency || 'CLP'),
          language: data.languages?.split(',')[0] || 'es',
          timezone: data.timezone || 'America/Santiago'
        };

        setRegion(detectedRegion);
      } catch (error) {
        console.log('Error detecting region, using default (Chile):', error);
        // Fallback a Chile como región por defecto
        const defaultRegion = {
          country: 'Chile',
          countryCode: 'CL',
          currency: 'CLP',
          currencySymbol: '$',
          language: 'es',
          timezone: 'America/Santiago'
        };
        setRegion(defaultRegion);
      } finally {
        setLoading(false);
      }
    };

    detectRegion();
  }, []);

  return { region, loading };
}

function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'CLP': '$',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'MXN': '$',
    'ARS': '$',
    'BRL': 'R$',
    'COP': '$',
    'PEN': 'S/',
    'UYU': '$',
    'PYG': '₲',
    'BOB': 'Bs',
    'VES': 'Bs',
    'GTQ': 'Q',
    'HNL': 'L',
    'NIO': 'C$',
    'CRC': '₡',
    'PAB': 'B/.',
    'DOP': 'RD$',
    'HTG': 'G',
    'JMD': 'J$',
    'TTD': 'TT$',
    'BBD': 'Bds$',
    'XCD': 'EC$',
    'AWG': 'ƒ',
    'ANG': 'ƒ',
    'SRD': '$',
    'GYD': 'G$',
    'BZD': 'BZ$'
  };
  
  return symbols[currency] || currency;
}

// Función para formatear precios según la moneda local
export function formatCurrency(amount: number, currency: string, locale?: string): string {
  const currencyConfigs: { [key: string]: { locale: string; options: Intl.NumberFormatOptions } } = {
    // Sudamérica - Prioridad Alta
    'CLP': {
      locale: 'es-CL',
      options: {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'ARS': {
      locale: 'es-AR',
      options: {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'BRL': {
      locale: 'pt-BR',
      options: {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'COP': {
      locale: 'es-CO',
      options: {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'PEN': {
      locale: 'es-PE',
      options: {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'UYU': {
      locale: 'es-UY',
      options: {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'PYG': {
      locale: 'es-PY',
      options: {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'BOB': {
      locale: 'es-BO',
      options: {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'VES': {
      locale: 'es-VE',
      options: {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    
    // Centroamérica y Caribe
    'MXN': {
      locale: 'es-MX',
      options: {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'GTQ': {
      locale: 'es-GT',
      options: {
        style: 'currency',
        currency: 'GTQ',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'HNL': {
      locale: 'es-HN',
      options: {
        style: 'currency',
        currency: 'HNL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'NIO': {
      locale: 'es-NI',
      options: {
        style: 'currency',
        currency: 'NIO',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'CRC': {
      locale: 'es-CR',
      options: {
        style: 'currency',
        currency: 'CRC',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'PAB': {
      locale: 'es-PA',
      options: {
        style: 'currency',
        currency: 'PAB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'DOP': {
      locale: 'es-DO',
      options: {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    
    // Norteamérica y Europa
    'USD': {
      locale: 'en-US',
      options: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'EUR': {
      locale: 'es-ES',
      options: {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'GBP': {
      locale: 'en-GB',
      options: {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    }
  };

  const config = currencyConfigs[currency];
  if (!config) {
    // Fallback para monedas no configuradas
    return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
  }

  try {
    return new Intl.NumberFormat(config.locale, config.options).format(amount);
  } catch (error) {
    // Fallback en caso de error
    return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
  }
}

export function getRegionalPricing(region: Region): PricingPlan[] {
  // Precios base en USD - Según especificaciones del usuario
  const basePricing = {
    trial: { price: 0, period: '14 días' },
    starter: { price: 10, period: 'mes' }, // Hoteles pequeños hasta 20 habitaciones
    professional: { price: 20, period: 'mes' }, // Hoteles medianos hasta 50 habitaciones
    business: { price: 30, period: 'mes' }, // Hoteles grandes hasta 80 habitaciones
    enterprise: { price: 0, period: 'mes' } // Contactar para hoteles enterprise
  };

  // Conversiones de moneda - Tasas actualizadas para Sudamérica (prioridad)
  const exchangeRates: { [key: string]: number } = {
    // Sudamérica - Prioridad Alta
    'CLP': 999,    // Chile - 1 USD = ~950 CLP
    'ARS': 850,    // Argentina - 1 USD = ~850 ARS
    'BRL': 5.2,    // Brasil - 1 USD = ~5.2 BRL
    'COP': 3900,   // Colombia - 1 USD = ~3900 COP
    'PEN': 3.8,    // Perú - 1 USD = ~3.8 PEN
    'UYU': 38,     // Uruguay - 1 USD = ~38 UYU
    'PYG': 7200,   // Paraguay - 1 USD = ~7200 PYG
    'BOB': 9.9,    // Bolivia - 1 USD = ~6.9 BOB
    'VES': 35,     // Venezuela - 1 USD = ~35 VES (tasa oficial)
    
    // Centroamérica y Caribe
    'MXN': 18.5,   // México - 1 USD = ~18.5 MXN
    'GTQ': 7.8,    // Guatemala - 1 USD = ~7.8 GTQ
    'HNL': 24.7,   // Honduras - 1 USD = ~24.7 HNL
    'NIO': 36.8,   // Nicaragua - 1 USD = ~36.8 NIO
    'CRC': 520,    // Costa Rica - 1 USD = ~520 CRC
    'PAB': 1,      // Panamá - 1 USD = 1 PAB (dolarizado)
    'DOP': 58.5,   // República Dominicana - 1 USD = ~58.5 DOP
    
    // Norteamérica y Europa
    'USD': 1,      // Estados Unidos - Base
    'EUR': 0.85,   // Europa - 1 USD = ~0.85 EUR
    'GBP': 0.73    // Reino Unido - 1 USD = ~0.73 GBP
  };

  const rate = exchangeRates[region.currency] || 1;
  const symbol = region.currencySymbol;

  return [
    {
      id: 'starter',
      name: 'Hoteles Pequeños',
      price: Math.round(basePricing.starter.price * rate),
      currency: region.currency,
      currencySymbol: symbol,
      period: basePricing.starter.period,
      features: [
        'Prueba gratuita 14 días',
        'Hasta 20 habitaciones',
        'Gestión completa de reservas',
        'Check-in y check-out digital',
        'Gestión de huéspedes',
        'Reportes y estadísticas',
        'Integración SII (Chile)',
        'Soporte técnico'
      ],
      popular: true
    },
    {
      id: 'professional',
      name: 'Hoteles Medianos',
      price: Math.round(basePricing.professional.price * rate),
      currency: region.currency,
      currencySymbol: symbol,
      period: basePricing.professional.period,
      features: [
        'Prueba gratuita 14 días',
        'Hasta 50 habitaciones',
        'Channel Manager integrado',
        'Multi-usuario avanzado',
        'Reportes ejecutivos',
        'Housekeeping avanzado',
        'API para integraciones',
        'Soporte prioritario 24/7'
      ]
    },
    {
      id: 'business',
      name: 'Hoteles Grandes',
      price: Math.round(basePricing.business.price * rate),
      currency: region.currency,
      currencySymbol: symbol,
      period: basePricing.business.period,
      features: [
        'Prueba gratuita 14 días',
        'Hasta 80 habitaciones',
        'Channel Manager integrado',
        'Multi-usuario avanzado',
        'Reportes ejecutivos',
        'Housekeeping avanzado',
        'API para integraciones',
        'Soporte prioritario 24/7',
        'Integraciones avanzadas',
        'Yield Management básico'
      ]
    },
    {
      id: 'enterprise',
      name: 'Hoteles Enterprise',
      price: 0, // Precio por contacto
      currency: region.currency,
      currencySymbol: symbol,
      period: 'contactar',
      features: [
        'Más de 80 habitaciones',
        'Solución personalizada',
        'Multi-propiedad',
        'Integraciones avanzadas',
        'Yield Management',
        'Gerente de cuenta dedicado',
        'Migración de datos incluida',
        'Implementación personalizada'
      ]
    }
  ];
}