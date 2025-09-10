"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Star, CheckCircle, ArrowRight, ArrowLeft, Bed, Wifi, Car, Coffee, CreditCard } from "lucide-react";
import BaseLayout from "@/components/layout/base-layout";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/hooks/useRegion";

interface Hotel {
  id: string;
  business_name: string;
  description: string;
  address: string;
  city: string;
  rating: number;
  image_url: string;
  amenities: string[];
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  price_per_night: number;
  currency: string;
  capacity: number;
  amenities: string[];
  status: string;
  available: boolean;
}

interface SearchParams {
  checkin: string;
  checkout: string;
  guests: number;
}

export default function HotelRoomsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const hotelId = params.hotelId as string;
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [searchParamsState, setSearchParamsState] = useState<SearchParams>({
    checkin: searchParams.get('checkin') || '',
    checkout: searchParams.get('checkout') || '',
    guests: Number(searchParams.get('guests')) || 1
  });

  useEffect(() => {
    if (hotelId) {
      loadHotelAndRooms();
    }
  }, [hotelId, searchParamsState]);

  const loadHotelAndRooms = async () => {
    try {
      setLoading(true);
      
      // Cargar información del hotel
      const { data: hotelData, error: hotelError } = await supabase
        .from('hl_business')
        .select(`
          id,
          business_name,
          description,
          address,
          city,
          rating,
          image_url,
          amenities
        `)
        .eq('id', hotelId)
        .single();

      if (hotelError) {
        console.error('Error loading hotel:', hotelError);
        return;
      }

      setHotel(hotelData);

      // Cargar habitaciones disponibles
      const { data: roomsData, error: roomsError } = await supabase
        .from('hl_rooms')
        .select(`
          id,
          room_number,
          room_type,
          floor,
          price_per_night,
          currency,
          capacity,
          amenities,
          status
        `)
        .eq('business_id', hotelId)
        .eq('status', 'available')
        .gte('capacity', searchParamsState.guests);

      if (roomsError) {
        console.error('Error loading rooms:', roomsError);
        return;
      }

      // Verificar disponibilidad para las fechas seleccionadas
      const availableRooms = await checkRoomAvailability((roomsData || []).map(room => ({ ...room, available: true })), searchParamsState);
      setRooms(availableRooms);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRoomAvailability = async (rooms: Room[], searchParams: SearchParams) => {
    if (!searchParams.checkin || !searchParams.checkout) {
      return rooms;
    }

    const { data: reservations, error } = await supabase
      .from('hl_reservations')
      .select('room_id, check_in_date, check_out_date, status')
      .eq('business_id', hotelId)
      .in('status', ['confirmed', 'checked_in', 'pending'])
      .overlaps('check_in_date', `[${searchParams.checkin},${searchParams.checkout}]`);

    if (error) {
      console.error('Error checking availability:', error);
      return rooms;
    }

    const bookedRoomIds = new Set(reservations?.map(r => r.room_id) || []);
    
    return rooms.map(room => ({
      ...room,
      available: !bookedRoomIds.has(room.id)
    }));
  };

  const calculateNights = () => {
    if (!searchParamsState.checkin || !searchParamsState.checkout) return 1;
    const checkIn = new Date(searchParamsState.checkin);
    const checkOut = new Date(searchParamsState.checkout);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = (room: Room) => {
    const nights = calculateNights();
    return room.price_per_night * nights;
  };

  const handleRoomSelection = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  const handleBooking = (room: Room) => {
    const queryParams = new URLSearchParams({
      hotelId,
      roomId: room.id,
      checkin: searchParamsState.checkin,
      checkout: searchParamsState.checkout,
      guests: searchParamsState.guests.toString(),
      total: calculateTotalPrice(room).toString()
    });
    
    window.location.href = `/book/checkout?${queryParams.toString()}`;
  };

  if (loading) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4 font-body">Cargando habitaciones...</p>
        </div>
      </BaseLayout>
    );
  }

  if (!hotel) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray4 mb-4">Hotel no encontrado</h2>
          <Link href="/book">
            <Button className="bg-blue8 hover:bg-blue6 text-white">
              Volver a la búsqueda
            </Button>
          </Link>
        </div>
      </BaseLayout>
    );
  }

  const availableRooms = rooms.filter(room => room.available);
  const nights = calculateNights();

  return (
    <BaseLayout>
      {/* Hotel Header */}
      <div className="bg-gradient-to-r from-blue8 to-blue6 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/book" className="inline-flex items-center text-white hover:text-blue15 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la búsqueda
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 font-title">{hotel.business_name}</h1>
              <p className="text-blue15 mb-2 font-body">
                <MapPin className="h-4 w-4 inline mr-2" />
                {hotel.address}, {hotel.city}
              </p>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                <span className="font-semibold">{hotel.rating || 4.5}</span>
                <span className="ml-2 text-blue15">• Excelente ubicación</span>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-sm text-blue15">Estadía</div>
              <div className="font-bold">{nights} noche{nights !== 1 ? 's' : ''}</div>
              <div className="text-sm text-blue15">
                {searchParamsState.checkin} - {searchParamsState.checkout}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Summary */}
      <div className="bg-white border-b border-gray8 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Check-in: {searchParamsState.checkin}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Check-out: {searchParamsState.checkout}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>{searchParamsState.guests} huésped{searchParamsState.guests !== 1 ? 'es' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue1 font-title">
              Habitaciones Disponibles
            </h2>
            <p className="text-gray4 font-body">
              {availableRooms.length} habitación{availableRooms.length !== 1 ? 'es' : ''} disponible{availableRooms.length !== 1 ? 's' : ''}
            </p>
          </div>

          {availableRooms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <Bed className="h-16 w-16 text-gray8 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray4 mb-2">No hay habitaciones disponibles</h3>
              <p className="text-gray4 font-body mb-6">Intenta cambiar las fechas o el número de huéspedes</p>
              <Link href="/book">
                <Button className="bg-blue8 hover:bg-blue6 text-white">
                  Buscar otras fechas
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {availableRooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    {/* Room Image */}
                    <div className="lg:w-1/3 h-48 lg:h-auto bg-gray8 relative">
                      <div className="w-full h-full flex items-center justify-center text-gray4">
                        <Bed className="h-16 w-16" />
                      </div>
                      <div className="absolute top-3 left-3 bg-blue8 text-white px-2 py-1 rounded text-sm font-semibold">
                        Habitación {room.room_number}
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="lg:w-2/3 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-blue1 mb-2 font-title">
                            {room.room_type}
                          </h3>
                          <p className="text-gray4 text-sm mb-3 font-body">
                            Piso {room.floor} • {room.capacity} persona{room.capacity !== 1 ? 's' : ''} • {room.room_number}
                          </p>

                          {/* Amenities */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(room.amenities || ['WiFi', 'TV', 'Baño privado']).map((amenity, index) => (
                              <span key={index} className="flex items-center text-xs text-gray4 bg-gray10 px-2 py-1 rounded">
                                <CheckCircle className="h-3 w-3 mr-1 text-blue8" />
                                {amenity}
                              </span>
                            ))}
                          </div>

                          {/* Price per night */}
                          <div className="text-sm text-gray4 font-body">
                            <span className="font-semibold">{formatCurrency(room.price_per_night, room.currency)}</span> por noche
                          </div>
                        </div>

                        {/* Price and Booking */}
                        <div className="mt-4 lg:mt-0 lg:ml-6 text-right">
                          <div className="mb-3">
                            <div className="text-2xl font-bold text-blue8">
                              {formatCurrency(calculateTotalPrice(room), room.currency)}
                            </div>
                            <div className="text-sm text-gray4">
                              Total por {nights} noche{nights !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => handleBooking(room)}
                            className="bg-blue8 hover:bg-blue6 text-white font-body px-6"
                          >
                            Reservar Ahora
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
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