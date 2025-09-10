import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener reportes avanzados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('type') || 'kpis';

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    switch (reportType) {
      case 'kpis':
        return await getKPIs(businessId, start, end);
      case 'revenue':
        return await getRevenueReport(businessId, start, end);
      case 'occupancy':
        return await getOccupancyReport(businessId, start, end);
      case 'channel':
        return await getChannelReport(businessId, start, end);
      case 'room_type':
        return await getRoomTypeReport(businessId, start, end);
      default:
        return await getKPIs(businessId, start, end);
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function getKPIs(businessId: string, startDate: string, endDate: string) {
  try {
    // Obtener reservas del período
    const { data: reservations, error: reservationsError } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        check_in_date,
        check_out_date,
        total_amount,
        status,
        payment_status,
        guest_count,
        room_id,
        hl_rooms (
          room_type,
          price_per_night
        )
      `)
      .eq('business_id', businessId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate);

    if (reservationsError) {
      throw reservationsError;
    }

    // Obtener habitaciones
    const { data: rooms, error: roomsError } = await supabase
      .from('hl_rooms')
      .select('id, room_type, price_per_night')
      .eq('business_id', businessId);

    if (roomsError) {
      throw roomsError;
    }

    if (!reservations || !rooms) {
      return NextResponse.json({ kpis: null });
    }

    // Calcular KPIs
    const kpis = calculateAdvancedKPIs(reservations, rooms, startDate, endDate);

    return NextResponse.json({ kpis });

  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return NextResponse.json(
      { error: 'Error al calcular KPIs' },
      { status: 500 }
    );
  }
}

async function getRevenueReport(businessId: string, startDate: string, endDate: string) {
  try {
    const { data: reservations, error } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        check_in_date,
        check_out_date,
        total_amount,
        status,
        payment_status,
        room_id,
        hl_rooms (
          room_type
        )
      `)
      .eq('business_id', businessId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
      .eq('payment_status', 'paid');

    if (error) {
      throw error;
    }

    if (!reservations) {
      return NextResponse.json({ revenue: [] });
    }

    // Agrupar por fecha
    const revenueByDate = reservations.reduce((acc: any, reservation) => {
      const date = reservation.check_in_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          bookings: 0,
          room_nights: 0
        };
      }
      
      acc[date].revenue += reservation.total_amount || 0;
      acc[date].bookings += 1;
      
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      acc[date].room_nights += nights;
      
      return acc;
    }, {});

    const revenueData = Object.values(revenueByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ revenue: revenueData });

  } catch (error) {
    console.error('Error generating revenue report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte de ingresos' },
      { status: 500 }
    );
  }
}

async function getOccupancyReport(businessId: string, startDate: string, endDate: string) {
  try {
    const { data: reservations, error } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        check_in_date,
        check_out_date,
        status,
        room_id
      `)
      .eq('business_id', businessId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
      .in('status', ['confirmed', 'checked_in']);

    if (error) {
      throw error;
    }

    // Obtener total de habitaciones
    const { data: rooms } = await supabase
      .from('hl_rooms')
      .select('id')
      .eq('business_id', businessId);

    const totalRooms = rooms?.length || 1;

    if (!reservations) {
      return NextResponse.json({ occupancy: [] });
    }

    // Calcular ocupación por fecha
    const occupancyByDate: any = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      occupancyByDate[dateStr] = {
        date: dateStr,
        occupied_rooms: 0,
        total_rooms: totalRooms,
        occupancy_rate: 0
      };
    }

    // Calcular habitaciones ocupadas por fecha
    reservations.forEach(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      
      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (occupancyByDate[dateStr]) {
          occupancyByDate[dateStr].occupied_rooms += 1;
        }
      }
    });

    // Calcular tasas de ocupación
    Object.values(occupancyByDate).forEach((day: any) => {
      day.occupancy_rate = (day.occupied_rooms / day.total_rooms) * 100;
    });

    const occupancyData = Object.values(occupancyByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ occupancy: occupancyData });

  } catch (error) {
    console.error('Error generating occupancy report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte de ocupación' },
      { status: 500 }
    );
  }
}

async function getChannelReport(businessId: string, startDate: string, endDate: string) {
  try {
    const { data: reservations, error } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        check_in_date,
        check_out_date,
        total_amount,
        status,
        payment_status,
        source,
        room_id
      `)
      .eq('business_id', businessId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
      .eq('payment_status', 'paid');

    if (error) {
      throw error;
    }

    if (!reservations) {
      return NextResponse.json({ channels: [] });
    }

    // Agrupar por canal
    const channelData = reservations.reduce((acc: any, reservation) => {
      const source = reservation.source || 'direct';
      if (!acc[source]) {
        acc[source] = {
          source: source === 'direct' ? 'Directo' : source,
          bookings: 0,
          revenue: 0,
          room_nights: 0,
          average_adr: 0
        };
      }
      
      acc[source].bookings += 1;
      acc[source].revenue += reservation.total_amount || 0;
      
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      acc[source].room_nights += nights;
      
      return acc;
    }, {});

    // Calcular ADR promedio por canal
    Object.values(channelData).forEach((channel: any) => {
      channel.average_adr = channel.room_nights > 0 ? channel.revenue / channel.room_nights : 0;
    });

    return NextResponse.json({ channels: Object.values(channelData) });

  } catch (error) {
    console.error('Error generating channel report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte por canal' },
      { status: 500 }
    );
  }
}

async function getRoomTypeReport(businessId: string, startDate: string, endDate: string) {
  try {
    const { data: reservations, error } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        check_in_date,
        check_out_date,
        total_amount,
        status,
        payment_status,
        room_id,
        hl_rooms (
          room_type,
          price_per_night
        )
      `)
      .eq('business_id', businessId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
      .eq('payment_status', 'paid');

    if (error) {
      throw error;
    }

    if (!reservations) {
      return NextResponse.json({ roomTypes: [] });
    }

    // Agrupar por tipo de habitación
    const roomTypeData = reservations.reduce((acc: any, reservation) => {
      const roomType = reservation.hl_rooms?.room_type || 'Sin especificar';
      if (!acc[roomType]) {
        acc[roomType] = {
          room_type: roomType,
          bookings: 0,
          revenue: 0,
          room_nights: 0,
          average_adr: 0,
          average_price: 0
        };
      }
      
      acc[roomType].bookings += 1;
      acc[roomType].revenue += reservation.total_amount || 0;
      
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      acc[roomType].room_nights += nights;
      
      return acc;
    }, {});

    // Calcular promedios
    Object.values(roomTypeData).forEach((roomType: any) => {
      roomType.average_adr = roomType.room_nights > 0 ? roomType.revenue / roomType.room_nights : 0;
      roomType.average_price = roomType.bookings > 0 ? roomType.revenue / roomType.bookings : 0;
    });

    return NextResponse.json({ roomTypes: Object.values(roomTypeData) });

  } catch (error) {
    console.error('Error generating room type report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte por tipo de habitación' },
      { status: 500 }
    );
  }
}

function calculateAdvancedKPIs(reservations: any[], rooms: any[], startDate: string, endDate: string) {
  const confirmedReservations = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'checked_in'
  );
  const paidReservations = confirmedReservations.filter(r => r.payment_status === 'paid');
  
  const totalRevenue = paidReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalBookings = confirmedReservations.length;
  const totalRooms = rooms.length;
  
  // Calcular días del período
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const totalRoomNights = totalRooms * daysInPeriod;
  
  // Calcular estadías totales
  const totalNights = confirmedReservations.reduce((sum, r) => {
    const checkIn = new Date(r.check_in_date);
    const checkOut = new Date(r.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return sum + nights;
  }, 0);

  const averageStay = totalBookings > 0 ? totalNights / totalBookings : 0;
  
  // ADR (Average Daily Rate)
  const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
  
  // RevPAR (Revenue Per Available Room)
  const revpar = totalRoomNights > 0 ? totalRevenue / totalRoomNights : 0;
  
  // Occupancy Rate
  const occupancy = totalRoomNights > 0 ? (totalNights / totalRoomNights) * 100 : 0;
  
  // Cancellation Rate
  const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
  const cancellationRate = totalBookings > 0 ? 
    (cancelledReservations / (totalBookings + cancelledReservations)) * 100 : 0;
  
  // Average Guest Count
  const totalGuests = confirmedReservations.reduce((sum, r) => sum + (r.guest_count || 1), 0);
  const averageGuests = totalBookings > 0 ? totalGuests / totalBookings : 0;
  
  // Revenue per Guest
  const revenuePerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0;
  
  // Conversion Rate (simplificado)
  const conversionRate = 85; // Placeholder
  
  // Profit Margin (simplificado - asumiendo 70% de margen)
  const estimatedCosts = totalRevenue * 0.3;
  const profit = totalRevenue - estimatedCosts;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return {
    adr,
    revpar,
    occupancy,
    totalRevenue,
    totalBookings,
    averageStay,
    cancellationRate,
    conversionRate,
    averageGuests,
    revenuePerGuest,
    profitMargin,
    totalNights,
    totalRoomNights,
    daysInPeriod
  };
}

