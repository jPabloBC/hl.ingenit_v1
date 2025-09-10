import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { getEmailTemplate } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email es requerido.' }, { status: 400 });
    }

    // Generate a verification token
    const token = randomBytes(32).toString('hex');
    
    // Store the token in the database
    const { error: updateError } = await supabase
      .from('hl_user')
      .update({ email_verification_token: token })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating verification token:', updateError);
      return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    // Intentar enviar email usando las variables disponibles
    let transporter;
    
    // OPCIÓN 1: Variables de producción (EMAIL_USE, EMAIL_PASS, ADMIN_EMAIL)
    if (process.env.EMAIL_USE && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_USE,
        port: 587,
        secure: false,
        auth: {
          user: process.env.ADMIN_EMAIL,
          pass: process.env.EMAIL_PASS
        }
      });
    }
    // OPCIÓN 2: Variables originales locales (SMTP_*)
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    }
    else {
      console.error('No se encontraron variables de configuración de email');
      return NextResponse.json({ 
        error: 'Configuración de email no encontrada. Contacta al administrador.' 
      }, { status: 500 });
    }

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.ADMIN_EMAIL || 'noreply@ingenit.cl',
      to: email,
      subject: 'Verifica tu cuenta - INGENIT',
      html: getEmailTemplate(name, verifyUrl)
    };

    await transporter.sendMail(mailOptions);
      
      return NextResponse.json({ 
        message: 'Email de verificación enviado correctamente. Revisa tu bandeja de entrada.',
        emailSent: true
      });
    
  } catch (err) {
    console.error('Send verification email error:', err);
    return NextResponse.json({ 
      error: 'Error interno del servidor.' 
    }, { status: 500 });
  }
}