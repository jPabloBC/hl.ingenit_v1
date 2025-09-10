import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener personal de housekeeping
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const role = searchParams.get('role');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('hl_staff')
      .select(`
        id,
        name,
        role,
        email,
        phone,
        active,
        created_at
      `)
      .eq('business_id', businessId)
      .eq('active', true);

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error fetching housekeeping staff:', error);
      return NextResponse.json(
        { error: 'Error al obtener personal de housekeeping' },
        { status: 500 }
      );
    }

    // Obtener estadísticas de tareas para cada miembro del personal
    const staffWithStats = await Promise.all(
      (data || []).map(async (member) => {
        const today = new Date().toISOString().split('T')[0];
        
        // Tareas activas
        const { count: activeTasks } = await supabase
          .from('hl_housekeeping_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('assigned_to', member.id)
          .eq('status', 'in_progress');

        // Tareas completadas hoy
        const { count: completedToday } = await supabase
          .from('hl_housekeeping_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('assigned_to', member.id)
          .eq('status', 'completed')
          .gte('completed_at', today);

        return {
          ...member,
          active_tasks: activeTasks || 0,
          total_completed_today: completedToday || 0
        };
      })
    );

    return NextResponse.json({ staff: staffWithStats });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo miembro del personal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      name,
      role,
      email,
      phone
    } = body;

    // Validar campos requeridos
    if (!businessId || !name || !role) {
      return NextResponse.json(
        { error: 'Campos requeridos: businessId, name, role' },
        { status: 400 }
      );
    }

    // Crear el miembro del personal
    const { data, error } = await supabase
      .from('hl_staff')
      .insert([{
        business_id: businessId,
        name,
        role,
        email: email || null,
        phone: phone || null,
        active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating staff member:', error);
      return NextResponse.json(
        { error: 'Error al crear miembro del personal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ staff: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar miembro del personal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      staffId,
      name,
      role,
      email,
      phone,
      active
    } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: 'staffId es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('hl_staff')
      .update(updateData)
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff member:', error);
      return NextResponse.json(
        { error: 'Error al actualizar miembro del personal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ staff: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar miembro del personal (desactivar)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json(
        { error: 'staffId es requerido' },
        { status: 400 }
      );
    }

    // En lugar de eliminar, desactivar el miembro del personal
    const { error } = await supabase
      .from('hl_staff')
      .update({ active: false })
      .eq('id', staffId);

    if (error) {
      console.error('Error deactivating staff member:', error);
      return NextResponse.json(
        { error: 'Error al desactivar miembro del personal' },
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

