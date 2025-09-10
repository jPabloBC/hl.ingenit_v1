import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener canales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('hl_channels')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching channels:', error);
      return NextResponse.json(
        { error: 'Error al obtener canales' },
        { status: 500 }
      );
    }

    return NextResponse.json({ channels: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo canal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      name,
      type,
      apiKey,
      apiSecret,
      hotelId,
      commissionRate,
      syncFrequency,
      autoAccept,
      rateParity,
      inventorySync,
      bookingSync
    } = body;

    // Validar campos requeridos
    if (!businessId || !name || !type) {
      return NextResponse.json(
        { error: 'Campos requeridos: businessId, name, type' },
        { status: 400 }
      );
    }

    // Crear el canal
    const { data, error } = await supabase
      .from('hl_channels')
      .insert([{
        business_id: businessId,
        name,
        type,
        status: 'inactive',
        api_key: apiKey || null,
        api_secret: apiSecret || null,
        hotel_id: hotelId || null,
        commission_rate: commissionRate || 0,
        sync_frequency: syncFrequency || 'daily',
        auto_accept: autoAccept || false,
        rate_parity: rateParity || true,
        inventory_sync: inventorySync || true,
        booking_sync: bookingSync || true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      return NextResponse.json(
        { error: 'Error al crear canal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ channel: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar canal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      channelId,
      name,
      type,
      status,
      apiKey,
      apiSecret,
      hotelId,
      commissionRate,
      syncFrequency,
      autoAccept,
      rateParity,
      inventorySync,
      bookingSync
    } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (apiKey !== undefined) updateData.api_key = apiKey;
    if (apiSecret !== undefined) updateData.api_secret = apiSecret;
    if (hotelId !== undefined) updateData.hotel_id = hotelId;
    if (commissionRate !== undefined) updateData.commission_rate = commissionRate;
    if (syncFrequency !== undefined) updateData.sync_frequency = syncFrequency;
    if (autoAccept !== undefined) updateData.auto_accept = autoAccept;
    if (rateParity !== undefined) updateData.rate_parity = rateParity;
    if (inventorySync !== undefined) updateData.inventory_sync = inventorySync;
    if (bookingSync !== undefined) updateData.booking_sync = bookingSync;

    const { data, error } = await supabase
      .from('hl_channels')
      .update(updateData)
      .eq('id', channelId)
      .select()
      .single();

    if (error) {
      console.error('Error updating channel:', error);
      return NextResponse.json(
        { error: 'Error al actualizar canal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ channel: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar canal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId es requerido' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('hl_channels')
      .delete()
      .eq('id', channelId);

    if (error) {
      console.error('Error deleting channel:', error);
      return NextResponse.json(
        { error: 'Error al eliminar canal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

