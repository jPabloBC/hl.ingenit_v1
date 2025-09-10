import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener inventario por canal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const channelId = searchParams.get('channelId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Obtener habitaciones del hotel
    const { data: rooms, error: roomsError } = await supabase
      .from('hl_rooms')
      .select('id, room_number, room_type, price_per_night, status')
      .eq('business_id', businessId);

    if (roomsError) {
      throw roomsError;
    }

    // Obtener inventario por canal
    let inventoryQuery = supabase
      .from('hl_channel_inventory')
      .select('*')
      .eq('business_id', businessId);

    if (channelId) {
      inventoryQuery = inventoryQuery.eq('channel_id', channelId);
    }

    const { data: inventory, error: inventoryError } = await inventoryQuery;

    if (inventoryError) {
      throw inventoryError;
    }

    // Combinar datos de habitaciones con inventario
    const inventoryWithRooms = rooms?.map(room => {
      const roomInventory = inventory?.filter(inv => inv.room_id === room.id) || [];
      return {
        room_id: room.id,
        room_number: room.room_number,
        room_type: room.room_type,
        base_price: room.price_per_night,
        status: room.status,
        channel_inventory: roomInventory
      };
    });

    return NextResponse.json({ inventory: inventoryWithRooms });

  } catch (error) {
    console.error('Error getting inventory:', error);
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}

// POST - Actualizar inventario por canal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      channelId,
      roomId,
      available,
      price,
      restrictions
    } = body;

    if (!businessId || !channelId || !roomId) {
      return NextResponse.json(
        { error: 'businessId, channelId y roomId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe inventario para este canal/habitación
    const { data: existingInventory } = await supabase
      .from('hl_channel_inventory')
      .select('id')
      .eq('business_id', businessId)
      .eq('channel_id', channelId)
      .eq('room_id', roomId)
      .single();

    if (existingInventory) {
      // Actualizar inventario existente
      const { data, error } = await supabase
        .from('hl_channel_inventory')
        .update({
          available: available,
          price: price,
          restrictions: restrictions || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInventory.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ inventory: data });
    } else {
      // Crear nuevo inventario
      const { data, error } = await supabase
        .from('hl_channel_inventory')
        .insert([{
          business_id: businessId,
          channel_id: channelId,
          room_id: roomId,
          available: available,
          price: price,
          restrictions: restrictions || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ inventory: data });
    }

  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Error al actualizar inventario' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar inventario masivo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, channelId, updates } = body;

    if (!businessId || !channelId || !updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'businessId, channelId y updates (array) son requeridos' },
        { status: 400 }
      );
    }

    const results = [];

    for (const update of updates) {
      const { roomId, available, price, restrictions } = update;

      if (!roomId) continue;

      try {
        // Verificar si existe inventario
        const { data: existingInventory } = await supabase
          .from('hl_channel_inventory')
          .select('id')
          .eq('business_id', businessId)
          .eq('channel_id', channelId)
          .eq('room_id', roomId)
          .single();

        if (existingInventory) {
          // Actualizar existente
          const { data, error } = await supabase
            .from('hl_channel_inventory')
            .update({
              available: available,
              price: price,
              restrictions: restrictions || {},
              updated_at: new Date().toISOString()
            })
            .eq('id', existingInventory.id)
            .select()
            .single();

          if (!error) {
            results.push({ roomId, success: true, data });
          } else {
            results.push({ roomId, success: false, error: error.message });
          }
        } else {
          // Crear nuevo
          const { data, error } = await supabase
            .from('hl_channel_inventory')
            .insert([{
              business_id: businessId,
              channel_id: channelId,
              room_id: roomId,
              available: available,
              price: price,
              restrictions: restrictions || {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (!error) {
            results.push({ roomId, success: true, data });
          } else {
            results.push({ roomId, success: false, error: error.message });
          }
        }
      } catch (error) {
        results.push({ roomId, success: false, error: 'Error interno' });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error bulk updating inventory:', error);
    return NextResponse.json(
      { error: 'Error al actualizar inventario masivo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar inventario por canal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const channelId = searchParams.get('channelId');
    const roomId = searchParams.get('roomId');

    if (!businessId || !channelId) {
      return NextResponse.json(
        { error: 'businessId y channelId son requeridos' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('hl_channel_inventory')
      .delete()
      .eq('business_id', businessId)
      .eq('channel_id', channelId);

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting inventory:', error);
      return NextResponse.json(
        { error: 'Error al eliminar inventario' },
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

