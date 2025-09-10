import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Sincronizar canal específico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, syncType = 'full' } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId es requerido' },
        { status: 400 }
      );
    }

    // Obtener información del canal
    const { data: channel, error: channelError } = await supabase
      .from('hl_channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Canal no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar estado a sincronizando
    await supabase
      .from('hl_channels')
      .update({ status: 'syncing' })
      .eq('id', channelId);

    try {
      // Simular sincronización según el tipo de canal
      const syncResult = await performChannelSync(channel, syncType);

      // Actualizar estado y última sincronización
      await supabase
        .from('hl_channels')
        .update({
          status: 'active',
          last_sync: new Date().toISOString()
        })
        .eq('id', channelId);

      return NextResponse.json({
        success: true,
        message: `Sincronización completada para ${channel.name}`,
        details: syncResult
      });

    } catch (syncError) {
      // Actualizar estado a error
      await supabase
        .from('hl_channels')
        .update({ status: 'error' })
        .eq('id', channelId);

      throw syncError;
    }

  } catch (error) {
    console.error('Error syncing channel:', error);
    return NextResponse.json(
      { error: 'Error durante la sincronización' },
      { status: 500 }
    );
  }
}

// GET - Obtener estado de sincronización
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Obtener canales con estado de sincronización
    const { data: channels, error } = await supabase
      .from('hl_channels')
      .select('id, name, status, last_sync, sync_frequency')
      .eq('business_id', businessId);

    if (error) {
      throw error;
    }

    // Calcular próximas sincronizaciones
    const channelsWithNextSync = channels?.map(channel => {
      let nextSync = null;
      if (channel.last_sync) {
        const lastSync = new Date(channel.last_sync);
        const nextSyncDate = new Date(lastSync);
        
        switch (channel.sync_frequency) {
          case 'realtime':
            nextSync = 'En tiempo real';
            break;
          case 'hourly':
            nextSyncDate.setHours(nextSyncDate.getHours() + 1);
            nextSync = nextSyncDate.toISOString();
            break;
          case 'daily':
            nextSyncDate.setDate(nextSyncDate.getDate() + 1);
            nextSync = nextSyncDate.toISOString();
            break;
          default:
            nextSync = 'No programado';
        }
      }

      return {
        ...channel,
        next_sync: nextSync
      };
    });

    return NextResponse.json({ channels: channelsWithNextSync });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de sincronización' },
      { status: 500 }
    );
  }
}

async function performChannelSync(channel: any, syncType: string) {
  // Simular diferentes tipos de sincronización según el canal
  const syncResults = {
    inventory_updated: 0,
    rates_updated: 0,
    bookings_received: 0,
    errors: []
  };

  switch (channel.type) {
    case 'ota':
      // Simular sincronización con OTA (Booking.com, Expedia, etc.)
      if (syncType === 'full' || syncType === 'inventory') {
        syncResults.inventory_updated = Math.floor(Math.random() * 10) + 5;
      }
      if (syncType === 'full' || syncType === 'rates') {
        syncResults.rates_updated = Math.floor(Math.random() * 5) + 3;
      }
      if (syncType === 'full' || syncType === 'bookings') {
        syncResults.bookings_received = Math.floor(Math.random() * 3);
      }
      break;

    case 'gds':
      // Simular sincronización con GDS (Amadeus, Sabre, etc.)
      if (syncType === 'full' || syncType === 'inventory') {
        syncResults.inventory_updated = Math.floor(Math.random() * 8) + 3;
      }
      if (syncType === 'full' || syncType === 'rates') {
        syncResults.rates_updated = Math.floor(Math.random() * 4) + 2;
      }
      break;

    case 'metasearch':
      // Simular sincronización con metabúsquedas (Google Hotels, Trivago, etc.)
      if (syncType === 'full' || syncType === 'rates') {
        syncResults.rates_updated = Math.floor(Math.random() * 6) + 2;
      }
      break;

    case 'direct':
      // Sincronización directa (sitio web propio)
      if (syncType === 'full' || syncType === 'inventory') {
        syncResults.inventory_updated = Math.floor(Math.random() * 15) + 10;
      }
      break;
  }

  // Simular algunos errores aleatorios
  if (Math.random() < 0.1) {
    syncResults.errors.push('Error de conexión temporal');
  }

  return syncResults;
}

// PUT - Configurar sincronización automática
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, syncFrequency, autoAccept, rateParity } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (syncFrequency !== undefined) updateData.sync_frequency = syncFrequency;
    if (autoAccept !== undefined) updateData.auto_accept = autoAccept;
    if (rateParity !== undefined) updateData.rate_parity = rateParity;

    const { data, error } = await supabase
      .from('hl_channels')
      .update(updateData)
      .eq('id', channelId)
      .select()
      .single();

    if (error) {
      console.error('Error updating sync settings:', error);
      return NextResponse.json(
        { error: 'Error al actualizar configuración de sincronización' },
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

