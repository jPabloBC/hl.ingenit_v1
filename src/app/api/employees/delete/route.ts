import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente admin solo si las variables están disponibles
let supabaseAdmin: any = null;

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function DELETE(request: NextRequest) {
  try {
    // Validar que el cliente admin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service not available - missing configuration' }, { status: 503 });
    }

    console.log('Delete employee API called');
    
    const { employeeId, userId } = await request.json();
    console.log('Request data:', { employeeId, userId });

    if (!employeeId) {
      console.log('No employee ID provided');
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Si tiene user_id, eliminar de Supabase Auth
    if (userId) {
      console.log('Deleting auth user:', userId);
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting auth user:', authError);
        return NextResponse.json({ error: `Error deleting auth user: ${authError.message}` }, { status: 500 });
      }
      console.log('Auth user deleted successfully');
    }

    // Eliminar usuario de hl_user primero (para evitar foreign key constraint)
    console.log('Deleting user from hl_user table');
    const { data: userData, error: userSelectError } = await supabaseAdmin
      .from('hl_user')
      .select('id')
      .eq('employee_id', employeeId);

    if (userSelectError) {
      console.error('Error selecting user from hl_user:', userSelectError);
    } else if (userData && userData.length > 0) {
      console.log('Found user in hl_user:', userData[0].id);
      const { error: userError } = await supabaseAdmin
        .from('hl_user')
        .delete()
        .eq('employee_id', employeeId);

      if (userError) {
        console.error('Error deleting user from hl_user:', userError);
        return NextResponse.json({ error: `Error deleting user: ${userError.message}` }, { status: 500 });
      } else {
        console.log('User deleted from hl_user successfully');
      }
    } else {
      console.log('No user found in hl_user for this employee');
    }

    // Eliminar empleado de la base de datos
    console.log('Deleting employee from database:', employeeId);
    const { error } = await supabaseAdmin
      .from('hl_employees')
      .delete()
      .eq('id', employeeId);

    if (error) {
      console.error('Error deleting employee:', error);
      return NextResponse.json({ error: `Error deleting employee: ${error.message}` }, { status: 500 });
    }

    console.log('Employee deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete employee API:', error);
    return NextResponse.json({ error: `Internal server error: ${error}` }, { status: 500 });
  }
}
