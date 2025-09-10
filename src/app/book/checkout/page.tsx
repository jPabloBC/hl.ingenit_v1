"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Star, ArrowLeft, CreditCard, User, Mail, Phone, Shield, CheckCircle } from "lucide-react";
import BaseLayout from "@/components/layout/base-layout";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/hooks/useRegion";

interface Hotel {
  id: string;
  business_name: string;
  address: string;
  city: string;
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  price_per_night: number;
  currency: string;
  capacity: number;
}

interface GuestData {
  name: string;
  email: string;
  phone: string;
  document_id: string;
  nationality: string;
  address: string;
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [guestData, setGuestData] = useState<GuestData>({
    name: '',
    email: '',
    phone: '',
    document_id: '',
    nationality: 'Chile',
    address: ''
  });

  const [additionalGuests, setAdditionalGuests] = useState<GuestData[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Parámetros de la URL
  const hotelId = searchParams.get('hotelId') || '';
  const roomId = searchParams.get('roomId') || '';
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const guests = Number(searchParams.get('guests')) || 1;
  const total = Number(searchParams.get('total')) || 0;

  useEffect(() => {
    if (hotelId && roomId) {
      loadHotelAndRoom();
    }
  }, [hotelId, roomId]);

  const loadHotelAndRoom = async () => {
    try {
      setLoading(true);
      
      // Cargar información del hotel
      const { data: hotelData, error: hotelError } = await supabase
        .from('hl_business')
        .select('id, business_name, address, city')
        .eq('id', hotelId)
        .single();

      if (hotelError) {
        console.error('Error loading hotel:', hotelError);
        return;
      }

      setHotel(hotelData);

      // Cargar información de la habitación
      const { data: roomData, error: roomError } = await supabase
        .from('hl_rooms')
        .select('id, room_number, room_type, price_per_night, currency, capacity')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error loading room:', roomError);
        return;
      }

      setRoom(roomData);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkin || !checkout) return 1;
    const checkInDate = new Date(checkin);
    const checkOutDate = new Date(checkout);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleGuestDataChange = (field: keyof GuestData, value: string) => {
    setGuestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAdditionalGuest = () => {
    if (additionalGuests.length < guests - 1) {
      setAdditionalGuests(prev => [...prev, {
        name: '',
        email: '',
        phone: '',
        document_id: '',
        nationality: 'Chile',
        address: ''
      }]);
    }
  };

  const removeAdditionalGuest = (index: number) => {
    setAdditionalGuests(prev => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalGuest = (index: number, field: keyof GuestData, value: string) => {
    setAdditionalGuests(prev => prev.map((guest, i) => 
      i === index ? { ...guest, [field]: value } : guest
    ));
  };

  const validateForm = () => {
    if (!guestData.name || !guestData.email || !guestData.phone) {
      return false;
    }
    
    if (additionalGuests.length > 0) {
      for (const guest of additionalGuests) {
        if (!guest.name || !guest.email || !guest.phone) {
          return false;
        }
      }
    }
    
    return acceptTerms;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Por favor completa todos los campos requeridos y acepta los términos.');
      return;
    }

    try {
      setSubmitting(true);

      // Crear la reserva
      const { data: reservation, error: reservationError } = await supabase
        .from('hl_reservations')
        .insert([{
          business_id: hotelId,
          room_id: roomId,
          primary_guest_name: guestData.name,
          primary_guest_email: guestData.email,
          primary_guest_phone: guestData.phone,
          primary_guest_document: guestData.document_id,
          primary_guest_nationality: guestData.nationality,
          primary_guest_address: guestData.address,
          check_in_date: checkin,
          check_out_date: checkout,
          guest_count: guests,
          total_amount: total,
          special_requests: specialRequests,
          status: 'pending',
          payment_status: 'pending',
          source: 'web_booking'
        }])
        .select()
        .single();

      if (reservationError) {
        console.error('Error creating reservation:', reservationError);
        alert('Error al crear la reserva. Intenta nuevamente.');
        return;
      }

      // Agregar huéspedes adicionales
      if (additionalGuests.length > 0) {
        const additionalGuestsData = additionalGuests.map(guest => ({
          reservation_id: reservation.id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          document_id: guest.document_id,
          nationality: guest.nationality,
          address: guest.address
        }));

        const { error: guestsError } = await supabase
          .from('hl_reservation_guests')
          .insert(additionalGuestsData);

        if (guestsError) {
          console.error('Error adding additional guests:', guestsError);
        }
      }

      // Redirigir al pago
      router.push(`/book/payment?reservationId=${reservation.id}`);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la reserva. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4 font-body">Cargando información de reserva...</p>
        </div>
      </BaseLayout>
    );
  }

  if (!hotel || !room) {
    return (
      <BaseLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray4 mb-4">Información no encontrada</h2>
          <Link href="/book">
            <Button className="bg-blue8 hover:bg-blue6 text-white">
              Volver a la búsqueda
            </Button>
          </Link>
        </div>
      </BaseLayout>
    );
  }

  const nights = calculateNights();

  return (
    <BaseLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue8 to-blue6 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href={`/book/${hotelId}?checkin=${checkin}&checkout=${checkout}&guests=${guests}`} className="inline-flex items-center text-white hover:text-blue15 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a las habitaciones
          </Link>
          
          <h1 className="text-3xl font-bold mb-2 font-title">Completar Reserva</h1>
          <p className="text-blue15 font-body">Confirma tus datos y completa el pago</p>
        </div>
      </div>

      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-blue1 mb-6 font-title">Datos del Huésped Principal</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray1 mb-2">Nombre completo *</label>
                    <input
                      type="text"
                      value={guestData.name}
                      onChange={(e) => handleGuestDataChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                      placeholder="Nombre y apellido"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray1 mb-2">Email *</label>
                    <input
                      type="email"
                      value={guestData.email}
                      onChange={(e) => handleGuestDataChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray1 mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      value={guestData.phone}
                      onChange={(e) => handleGuestDataChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                      placeholder="+56 9 1234 5678"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray1 mb-2">Documento de identidad</label>
                    <input
                      type="text"
                      value={guestData.document_id}
                      onChange={(e) => handleGuestDataChange('document_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                      placeholder="RUT o pasaporte"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray1 mb-2">Nacionalidad</label>
                    <select
                      value={guestData.nationality}
                      onChange={(e) => handleGuestDataChange('nationality', e.target.value)}
                      className="w-full px-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                    >
                      <option value="Chile">Chile</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Brasil">Brasil</option>
                      <option value="Perú">Perú</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Estados Unidos">Estados Unidos</option>
                      <option value="España">España</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray1 mb-2">Dirección</label>
                    <input
                      type="text"
                      value={guestData.address}
                      onChange={(e) => handleGuestDataChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>
              </div>

              {/* Huéspedes adicionales */}
              {guests > 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-blue1 font-title">Huéspedes Adicionales</h2>
                    {additionalGuests.length < guests - 1 && (
                      <Button
                        onClick={addAdditionalGuest}
                        variant="outline"
                        className="border-blue8 text-blue8 hover:bg-blue15"
                      >
                        + Agregar Huésped
                      </Button>
                    )}
                  </div>
                  
                  {additionalGuests.map((guest, index) => (
                    <div key={index} className="border border-gray8 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-blue1">Huésped {index + 2}</h3>
                        <Button
                          onClick={() => removeAdditionalGuest(index)}
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={guest.name}
                          onChange={(e) => updateAdditionalGuest(index, 'name', e.target.value)}
                          className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                          placeholder="Nombre completo *"
                          required
                        />
                        <input
                          type="email"
                          value={guest.email}
                          onChange={(e) => updateAdditionalGuest(index, 'email', e.target.value)}
                          className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                          placeholder="Email *"
                          required
                        />
                        <input
                          type="tel"
                          value={guest.phone}
                          onChange={(e) => updateAdditionalGuest(index, 'phone', e.target.value)}
                          className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                          placeholder="Teléfono *"
                          required
                        />
                        <input
                          type="text"
                          value={guest.document_id}
                          onChange={(e) => updateAdditionalGuest(index, 'document_id', e.target.value)}
                          className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                          placeholder="Documento de identidad"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Solicitudes especiales */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-blue1 mb-4 font-title">Solicitudes Especiales</h2>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-4 py-3 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                  rows={4}
                  placeholder="Solicitudes especiales, preferencias de habitación, etc."
                />
              </div>

              {/* Términos y condiciones */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <div>
                    <p className="text-sm text-gray4 font-body">
                      Acepto los <Link href="/terms" className="text-blue8 hover:underline">términos y condiciones</Link> y la{' '}
                      <Link href="/privacy" className="text-blue8 hover:underline">política de privacidad</Link>.
                      Confirmo que los datos proporcionados son correctos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-2xl font-bold text-blue1 mb-6 font-title">Resumen de Reserva</h2>
                
                {/* Hotel Info */}
                <div className="mb-6">
                  <h3 className="font-semibold text-blue1 mb-2">{hotel.business_name}</h3>
                  <p className="text-sm text-gray4 mb-2">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    {hotel.address}, {hotel.city}
                  </p>
                  <p className="text-sm text-gray4">
                    Habitación {room.room_number} - {room.room_type}
                  </p>
                </div>

                {/* Fechas */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray4">Check-in:</span>
                    <span className="font-semibold">{checkin}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray4">Check-out:</span>
                    <span className="font-semibold">{checkout}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray4">Noches:</span>
                    <span className="font-semibold">{nights}</span>
                  </div>
                </div>

                {/* Precio */}
                <div className="border-t border-gray8 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray4">Precio por noche:</span>
                    <span>{formatCurrency(room.price_per_night, room.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray4">Noches:</span>
                    <span>{nights}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-blue8">
                    <span>Total:</span>
                    <span>{formatCurrency(total, room.currency)}</span>
                  </div>
                </div>

                {/* Botón de pago */}
                <Button
                  onClick={handleSubmit}
                  disabled={!validateForm() || submitting}
                  className="w-full bg-blue8 hover:bg-blue6 text-white font-body py-3"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Continuar al Pago
                    </div>
                  )}
                </Button>

                <p className="text-xs text-gray4 text-center mt-4">
                  <Shield className="h-3 w-3 inline mr-1" />
                  Pago seguro con Webpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}