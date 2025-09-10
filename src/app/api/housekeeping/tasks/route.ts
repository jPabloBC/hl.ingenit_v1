import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener tareas de housekeeping
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('hl_housekeeping_tasks')
      .select(`
        id,
        room_id,
        room_number,
        task_type,
        priority,
        status,
        assigned_to,
        assigned_name,
        created_at,
        started_at,
        completed_at,
        estimated_duration,
        notes,
        checklist_items
      `)
      .eq('business_id', businessId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching housekeeping tasks:', error);
      return NextResponse.json(
        { error: 'Error al obtener tareas de housekeeping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarea de housekeeping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      roomId,
      roomNumber,
      taskType,
      priority,
      estimatedDuration,
      notes,
      assignedTo,
      assignedName,
      checklistItems
    } = body;

    // Validar campos requeridos
    if (!businessId || !roomId || !roomNumber || !taskType || !priority) {
      return NextResponse.json(
        { error: 'Campos requeridos: businessId, roomId, roomNumber, taskType, priority' },
        { status: 400 }
      );
    }

    // Crear la tarea
    const { data, error } = await supabase
      .from('hl_housekeeping_tasks')
      .insert([{
        business_id: businessId,
        room_id: roomId,
        room_number: roomNumber,
        task_type: taskType,
        priority: priority,
        status: 'pending',
        estimated_duration: estimatedDuration || 30,
        notes: notes || '',
        assigned_to: assignedTo || null,
        assigned_name: assignedName || null,
        checklist_items: checklistItems || [],
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating housekeeping task:', error);
      return NextResponse.json(
        { error: 'Error al crear tarea de housekeeping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea de housekeeping
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      taskId,
      status,
      assignedTo,
      assignedName,
      notes,
      checklistItems
    } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (assignedName !== undefined) updateData.assigned_name = assignedName;
    if (notes !== undefined) updateData.notes = notes;
    if (checklistItems !== undefined) updateData.checklist_items = checklistItems;

    const { data, error } = await supabase
      .from('hl_housekeeping_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating housekeeping task:', error);
      return NextResponse.json(
        { error: 'Error al actualizar tarea de housekeeping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea de housekeeping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId es requerido' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('hl_housekeeping_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting housekeeping task:', error);
      return NextResponse.json(
        { error: 'Error al eliminar tarea de housekeeping' },
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

