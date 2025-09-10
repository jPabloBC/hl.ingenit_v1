import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  console.log('=== EMAIL VERIFICATION ENDPOINT ===');
  
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    console.log('Token:', token);
    
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 400 });
    }
    
    console.log('Searching for user...');
    const { data: users, error } = await supabase
      .from('hl_user')
      .select('*')
      .eq('email_verification_token', token);
    
    console.log('Users found:', users?.length || 0);
    console.log('Error:', error);
    
    if (error) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Token not found' }, { status: 400 });
    }
    
    const user = users[0];
    console.log('Updating user:', user.email);
    
    const { error: updateError } = await supabase
      .from('hl_user')
      .update({ 
        email_verified: true, 
        email_verification_token: null 
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.log('Update error:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    
    console.log('SUCCESS! User verified:', user.email);
    return NextResponse.json({ 
      message: '¡Correo verificado correctamente!',
      email: user.email
    });
    
  } catch (error) {
    console.log('CATCH ERROR:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
