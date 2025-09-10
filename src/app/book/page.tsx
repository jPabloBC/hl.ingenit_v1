"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Star, CheckCircle, ArrowRight, Search, Filter } from "lucide-react";
import BaseLayout from "@/components/layout/base-layout";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Hotel {
  id: string;
  business_name: string;
  description: string;
  address: string;
  city: string;
  rating: number;
  image_url: string;
  min_price: number;
  currency: string;
  amenities: string[];
}

interface RoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price_per_night: number;
  currency: string;
  available_rooms: number;
  amenities: string[];
  images: string[];
}

export default function BookingPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      
      // Obtener hoteles públicos (que permiten reservas web)
      const { data, error } = await supabase
        .from('hl_business')
        .select(`
          id,
          business_name,
          description,
          address,
          city,
          rating,
          image_url,
          min_price,
          currency,
          amenities,
          public_booking_enabled
        `)
        .eq('business_type', 'hotel')
        .eq('public_booking_enabled', true)
        .eq('active', true);

      if (error) {
        console.error('Error loading hotels:', error);
        return;
      }

      setHotels(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !selectedCity || hotel.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const cities = [...new Set(hotels.map(hotel => hotel.city))];

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4 font-body">Cargando hoteles disponibles...</p>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue8 to-blue6 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-title">
            Reserva tu Hotel en Chile
          </h1>
          <p className="text-xl mb-8 font-body opacity-90">
            Encuentra y reserva los mejores hoteles con precios increíbles
          </p>
          
          {/* Search Form */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Destino */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="¿A dónde vas?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-gray1"
                />
              </div>

              {/* Check-in */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full pl-10 pr-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-gray1"
                />
              </div>

              {/* Check-out */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || getMinDate()}
                  max={getMaxDate()}
                  className="w-full pl-10 pr-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-gray1"
                />
              </div>

              {/* Huéspedes */}
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-gray1"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'huésped' : 'huéspedes'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue8 hover:text-blue6"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <Button className="bg-blue8 hover:bg-blue6 text-white px-8">
                Buscar Hoteles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Filtros adicionales */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-gray1"
                  >
                    <option value="">Todas las ciudades</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  
                  <select className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-gray1">
                    <option value="">Cualquier precio</option>
                    <option value="low">$0 - $50.000</option>
                    <option value="medium">$50.000 - $100.000</option>
                    <option value="high">$100.000+</option>
                  </select>
                  
                  <select className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-gray1">
                    <option value="">Cualquier calificación</option>
                    <option value="4">4+ estrellas</option>
                    <option value="3">3+ estrellas</option>
                    <option value="2">2+ estrellas</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hotels List */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-blue1 font-title">
              Hoteles Disponibles
            </h2>
            <p className="text-gray4 font-body">
              {filteredHotels.length} hotel{filteredHotels.length !== 1 ? 'es' : ''} encontrado{filteredHotels.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray8 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray4 mb-2">No se encontraron hoteles</h3>
              <p className="text-gray4 font-body">Intenta ajustar tus filtros de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <div key={hotel.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Hotel Image */}
                  <div className="h-48 bg-gray8 relative">
                    {hotel.image_url ? (
                      <img
                        src={hotel.image_url}
                        alt={hotel.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray4">
                        <MapPin className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-sm font-semibold text-blue8">
                      Desde ${hotel.min_price?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-blue1 font-title">
                        {hotel.business_name}
                      </h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="ml-1 text-sm font-semibold">{hotel.rating || 4.5}</span>
                      </div>
                    </div>

                    <p className="text-gray4 text-sm mb-3 font-body">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {hotel.city}
                    </p>

                    <p className="text-gray4 text-sm mb-4 font-body line-clamp-2">
                      {hotel.description || 'Hotel confortable con excelente ubicación y servicios de calidad.'}
                    </p>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(hotel.amenities || ['WiFi', 'Estacionamiento', 'Desayuno']).slice(0, 3).map((amenity, index) => (
                        <span key={index} className="flex items-center text-xs text-gray4 bg-gray10 px-2 py-1 rounded">
                          <CheckCircle className="h-3 w-3 mr-1 text-blue8" />
                          {amenity}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link href={`/book/${hotel.id}?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`}>
                      <Button className="w-full bg-blue8 hover:bg-blue6 text-white font-body">
                        Ver Habitaciones
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
}
