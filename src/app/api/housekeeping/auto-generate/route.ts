import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Generar tareas automáticamente basadas en check-outs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Obtener check-outs de hoy
    const today = new Date().toISOString().split('T')[0];
    
    const { data: checkouts, error: checkoutsError } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        room_id,
        room_number,
        check_out_date,
        guest_count,
        total_amount,
        special_requests
      `)
      .eq('business_id', businessId)
      .eq('check_out_date', today)
      .in('status', ['checked_in', 'confirmed']);

    if (checkoutsError) {
      console.error('Error fetching checkouts:', checkoutsError);
      return NextResponse.json(
        { error: 'Error al obtener check-outs' },
        { status: 500 }
      );
    }

    if (!checkouts || checkouts.length === 0) {
      return NextResponse.json({
        message: 'No hay check-outs para hoy',
        generated_tasks: 0
      });
    }

    // Obtener personal disponible
    const { data: staff, error: staffError } = await supabase
      .from('hl_staff')
      .select('id, name, role')
      .eq('business_id', businessId)
      .eq('active', true)
      .eq('role', 'housekeeping');

    if (staffError) {
      console.error('Error fetching staff:', staffError);
      return NextResponse.json(
        { error: 'Error al obtener personal' },
        { status: 500 }
      );
    }

    // Generar tareas para cada check-out
    const generatedTasks = [];
    const staffArray = staff || [];
    let staffIndex = 0;

    for (const checkout of checkouts) {
      // Verificar si ya existe una tarea para esta habitación
      const { data: existingTask } = await supabase
        .from('hl_housekeeping_tasks')
        .select('id')
        .eq('business_id', businessId)
        .eq('room_id', checkout.room_id)
        .eq('task_type', 'checkout')
        .eq('status', 'pending')
        .single();

      if (existingTask) {
        continue; // Ya existe una tarea para esta habitación
      }

      // Determinar prioridad basada en el monto y solicitudes especiales
      let priority = 'medium';
      if (checkout.total_amount > 100000) {
        priority = 'high';
      }
      if (checkout.special_requests && checkout.special_requests.includes('urgente')) {
        priority = 'urgent';
      }

      // Determinar duración estimada basada en el tipo de habitación y huéspedes
      let estimatedDuration = 30; // minutos por defecto
      if (checkout.guest_count > 2) {
        estimatedDuration = 45;
      }
      if (checkout.total_amount > 150000) {
        estimatedDuration = 60; // habitaciones premium
      }

      // Asignar personal de forma rotativa
      const assignedStaff = staffArray.length > 0 ? staffArray[staffIndex % staffArray.length] : null;

      // Checklist estándar para check-out
      const checklistItems = [
        { description: 'Cambiar sábanas y toallas', completed: false },
        { description: 'Limpiar baño completo', completed: false },
        { description: 'Aspirar y limpiar pisos', completed: false },
        { description: 'Limpiar superficies y muebles', completed: false },
        { description: 'Revisar electrodomésticos', completed: false },
        { description: 'Reabastecer amenities', completed: false },
        { description: 'Verificar funcionamiento de luces', completed: false },
        { description: 'Reportar daños o problemas', completed: false }
      ];

      // Crear la tarea
      const { data: newTask, error: taskError } = await supabase
        .from('hl_housekeeping_tasks')
        .insert([{
          business_id: businessId,
          room_id: checkout.room_id,
          room_number: checkout.room_number,
          task_type: 'checkout',
          priority: priority,
          status: 'pending',
          estimated_duration: estimatedDuration,
          notes: `Check-out de ${checkout.guest_count} huésped${checkout.guest_count > 1 ? 'es' : ''}. ${checkout.special_requests || ''}`,
          assigned_to: assignedStaff?.id || null,
          assigned_name: assignedStaff?.name || null,
          checklist_items: checklistItems,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (taskError) {
        console.error('Error creating task for room', checkout.room_number, taskError);
        continue;
      }

      generatedTasks.push(newTask);
      staffIndex++;
    }

    // Actualizar estado de las reservas a 'checked_out'
    const checkoutIds = checkouts.map(c => c.id);
    if (checkoutIds.length > 0) {
      const { error: updateError } = await supabase
        .from('hl_reservations')
        .update({ status: 'checked_out' })
        .in('id', checkoutIds);

      if (updateError) {
        console.error('Error updating reservation status:', updateError);
      }
    }

    return NextResponse.json({
      message: `Se generaron ${generatedTasks.length} tareas de housekeeping`,
      generated_tasks: generatedTasks.length,
      tasks: generatedTasks
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener estadísticas de generación automática
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Obtener check-outs para la fecha especificada
    const { data: checkouts, error: checkoutsError } = await supabase
      .from('hl_reservations')
      .select('id, room_number, check_out_date, status')
      .eq('business_id', businessId)
      .eq('check_out_date', date);

    if (checkoutsError) {
      console.error('Error fetching checkouts:', checkoutsError);
      return NextResponse.json(
        { error: 'Error al obtener check-outs' },
        { status: 500 }
      );
    }

    // Obtener tareas generadas para la fecha
    const { data: tasks, error: tasksError } = await supabase
      .from('hl_housekeeping_tasks')
      .select('id, room_number, task_type, status, created_at')
      .eq('business_id', businessId)
      .eq('task_type', 'checkout')
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        { error: 'Error al obtener tareas' },
        { status: 500 }
      );
    }

    const stats = {
      date: date,
      total_checkouts: checkouts?.length || 0,
      completed_checkouts: checkouts?.filter(c => c.status === 'checked_out').length || 0,
      pending_checkouts: checkouts?.filter(c => c.status === 'checked_in').length || 0,
      generated_tasks: tasks?.length || 0,
      completed_tasks: tasks?.filter(t => t.status === 'completed').length || 0,
      pending_tasks: tasks?.filter(t => t.status === 'pending').length || 0,
      in_progress_tasks: tasks?.filter(t => t.status === 'in_progress').length || 0
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

