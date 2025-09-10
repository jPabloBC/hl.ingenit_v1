import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Exportar reportes en diferentes formatos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      reportType,
      format,
      startDate,
      endDate,
      filters
    } = body;

    if (!businessId || !reportType || !format) {
      return NextResponse.json(
        { error: 'businessId, reportType y format son requeridos' },
        { status: 400 }
      );
    }

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    let reportData;
    let fileName;

    switch (reportType) {
      case 'kpis':
        reportData = await generateKPIsReport(businessId, start, end);
        fileName = `kpis_report_${start}_${end}`;
        break;
      case 'revenue':
        reportData = await generateRevenueReport(businessId, start, end);
        fileName = `revenue_report_${start}_${end}`;
        break;
      case 'occupancy':
        reportData = await generateOccupancyReport(businessId, start, end);
        fileName = `occupancy_report_${start}_${end}`;
        break;
      case 'reservations':
        reportData = await generateReservationsReport(businessId, start, end, filters);
        fileName = `reservations_report_${start}_${end}`;
        break;
      case 'financial':
        reportData = await generateFinancialReport(businessId, start, end);
        fileName = `financial_report_${start}_${end}`;
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      const csvContent = convertToCSV(reportData as any, reportType);
      return NextResponse.json({
        content: csvContent,
        fileName: `${fileName}.csv`,
        format: 'csv'
      });
    } else if (format === 'json') {
      return NextResponse.json({
        content: reportData,
        fileName: `${fileName}.json`,
        format: 'json'
      });
    } else {
      return NextResponse.json(
        { error: 'Formato no soportado. Use csv o json' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function generateKPIsReport(businessId: string, startDate: string, endDate: string) {
  const { data: reservations } = await supabase
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

  const { data: rooms } = await supabase
    .from('hl_rooms')
    .select('id, room_type, price_per_night')
    .eq('business_id', businessId);

  if (!reservations || !rooms) return [];

  const confirmedReservations = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'checked_in'
  );
  const paidReservations = confirmedReservations.filter(r => r.payment_status === 'paid');
  
  const totalRevenue = paidReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalBookings = confirmedReservations.length;
  const totalRooms = rooms.length;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const totalRoomNights = totalRooms * daysInPeriod;
  
  const totalNights = confirmedReservations.reduce((sum, r) => {
    const checkIn = new Date(r.check_in_date);
    const checkOut = new Date(r.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return sum + nights;
  }, 0);

  const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
  const revpar = totalRoomNights > 0 ? totalRevenue / totalRoomNights : 0;
  const occupancy = totalRoomNights > 0 ? (totalNights / totalRoomNights) * 100 : 0;
  
  const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
  const cancellationRate = totalBookings > 0 ? 
    (cancelledReservations / (totalBookings + cancelledReservations)) * 100 : 0;

  return [{
    metric: 'ADR (Average Daily Rate)',
    value: adr,
    unit: 'CLP',
    description: 'Tarifa diaria promedio'
  }, {
    metric: 'RevPAR (Revenue Per Available Room)',
    value: revpar,
    unit: 'CLP',
    description: 'Ingreso por habitación disponible'
  }, {
    metric: 'Tasa de Ocupación',
    value: occupancy,
    unit: '%',
    description: 'Porcentaje de habitaciones ocupadas'
  }, {
    metric: 'Ingresos Totales',
    value: totalRevenue,
    unit: 'CLP',
    description: 'Ingresos totales del período'
  }, {
    metric: 'Reservas Totales',
    value: totalBookings,
    unit: 'reservas',
    description: 'Número total de reservas'
  }, {
    metric: 'Tasa de Cancelación',
    value: cancellationRate,
    unit: '%',
    description: 'Porcentaje de reservas canceladas'
  }];
}

async function generateRevenueReport(businessId: string, startDate: string, endDate: string) {
  const { data: reservations } = await supabase
    .from('hl_reservations')
    .select(`
      id,
      check_in_date,
      check_out_date,
      total_amount,
      status,
      payment_status,
      source,
      room_id,
      hl_rooms (
        room_type
      )
    `)
    .eq('business_id', businessId)
    .gte('check_in_date', startDate)
    .lte('check_in_date', endDate)
    .eq('payment_status', 'paid');

  if (!reservations) return [];

  const revenueByDate = reservations.reduce((acc: any, reservation) => {
    const date = reservation.check_in_date;
    if (!acc[date]) {
      acc[date] = {
        date,
        revenue: 0,
        bookings: 0,
        room_nights: 0,
        average_adr: 0
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

  return Object.values(revenueByDate).map((day: any) => ({
    fecha: day.date,
    ingresos: day.revenue,
    reservas: day.bookings,
    noches_habitacion: day.room_nights,
    adr_promedio: day.room_nights > 0 ? day.revenue / day.room_nights : 0
  }));
}

async function generateOccupancyReport(businessId: string, startDate: string, endDate: string) {
  const { data: reservations } = await supabase
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

  const { data: rooms } = await supabase
    .from('hl_rooms')
    .select('id')
    .eq('business_id', businessId);

  const totalRooms = rooms?.length || 1;

  if (!reservations) return [];

  const occupancyByDate: any = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    occupancyByDate[dateStr] = {
      fecha: dateStr,
      habitaciones_ocupadas: 0,
      total_habitaciones: totalRooms,
      tasa_ocupacion: 0
    };
  }

  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (occupancyByDate[dateStr]) {
        occupancyByDate[dateStr].habitaciones_ocupadas += 1;
      }
    }
  });

  Object.values(occupancyByDate).forEach((day: any) => {
    day.tasa_ocupacion = (day.habitaciones_ocupadas / day.total_habitaciones) * 100;
  });

  return Object.values(occupancyByDate);
}

async function generateReservationsReport(businessId: string, startDate: string, endDate: string, filters: any = {}) {
  let query = supabase
    .from('hl_reservations')
    .select(`
      id,
      check_in_date,
      check_out_date,
      total_amount,
      status,
      payment_status,
      source,
      guest_count,
      primary_guest_name,
      primary_guest_email,
      primary_guest_phone,
      special_requests,
      created_at,
      room_id,
      hl_rooms (
        room_number,
        room_type
      )
    `)
    .eq('business_id', businessId)
    .gte('check_in_date', startDate)
    .lte('check_in_date', endDate);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  if (filters.source) {
    query = query.eq('source', filters.source);
  }

  const { data: reservations } = await query;

  if (!reservations) return [];

  return reservations.map(reservation => ({
    id_reserva: reservation.id,
    fecha_check_in: reservation.check_in_date,
    fecha_check_out: reservation.check_out_date,
    habitacion: reservation.hl_rooms?.[0]?.room_number || 'N/A',
    tipo_habitacion: reservation.hl_rooms?.[0]?.room_type || 'N/A',
    monto_total: reservation.total_amount,
    estado: reservation.status,
    estado_pago: reservation.payment_status,
    canal: reservation.source || 'direct',
    numero_huespedes: reservation.guest_count,
    nombre_huesped: reservation.primary_guest_name,
    email_huesped: reservation.primary_guest_email,
    telefono_huesped: reservation.primary_guest_phone,
    solicitudes_especiales: reservation.special_requests,
    fecha_creacion: reservation.created_at
  }));
}

async function generateFinancialReport(businessId: string, startDate: string, endDate: string) {
  const { data: reservations } = await supabase
    .from('hl_reservations')
    .select(`
      id,
      check_in_date,
      check_out_date,
      total_amount,
      status,
      payment_status,
      source,
      room_id,
      hl_rooms (
        room_type
      )
    `)
    .eq('business_id', businessId)
    .gte('check_in_date', startDate)
    .lte('check_in_date', endDate)
    .eq('payment_status', 'paid');

  if (!reservations) return [];

  const totalRevenue = reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const estimatedCosts = totalRevenue * 0.3; // 30% de costos estimados
  const grossProfit = totalRevenue - estimatedCosts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const revenueBySource = reservations.reduce((acc: any, reservation) => {
    const source = reservation.source || 'direct';
    if (!acc[source]) {
      acc[source] = {
        canal: source === 'direct' ? 'Directo' : source,
        ingresos: 0,
        reservas: 0,
        porcentaje: 0
      };
    }
    
    acc[source].ingresos += reservation.total_amount || 0;
    acc[source].reservas += 1;
    
    return acc;
  }, {});

  // Calcular porcentajes
  Object.values(revenueBySource).forEach((source: any) => {
    source.porcentaje = totalRevenue > 0 ? (source.ingresos / totalRevenue) * 100 : 0;
  });

  return {
    resumen: {
      ingresos_totales: totalRevenue,
      costos_estimados: estimatedCosts,
      ganancia_bruta: grossProfit,
      margen_ganancia: profitMargin,
      total_reservas: reservations.length
    },
    por_canal: Object.values(revenueBySource),
    periodo: {
      fecha_inicio: startDate,
      fecha_fin: endDate
    }
  };
}

function convertToCSV(data: any[] | any, reportType: string): string {
  if (!data || data.length === 0) return '';

  if (reportType === 'financial') {
    // Para reportes financieros que tienen estructura anidada
    const summary = data.resumen;
    const channels = data.por_canal;
    
    let csv = 'Resumen Financiero\n';
    csv += 'Métrica,Valor\n';
    csv += `Ingresos Totales,${summary.ingresos_totales}\n`;
    csv += `Costos Estimados,${summary.costos_estimados}\n`;
    csv += `Ganancia Bruta,${summary.ganancia_bruta}\n`;
    csv += `Margen de Ganancia,${summary.margen_ganancia}%\n`;
    csv += `Total Reservas,${summary.total_reservas}\n\n`;
    
    csv += 'Ingresos por Canal\n';
    csv += 'Canal,Ingresos,Reservas,Porcentaje\n';
    channels.forEach((channel: any) => {
      csv += `${channel.canal},${channel.ingresos},${channel.reservas},${channel.porcentaje}%\n`;
    });
    
    return csv;
  }

  // Para otros tipos de reportes
  let csv = '';
  if (Array.isArray(data)) {
    const headers = Object.keys(data[0]);
    csv = headers.join(',') + '\n';
    
    data.forEach((row: any) => {
      const values = headers.map(header => {
        const value = row[header];
        // Escapar comas y comillas en valores
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });
  }
  
  return csv;
}