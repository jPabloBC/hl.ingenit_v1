import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

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

    // Configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // tu-email@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD // contraseña de aplicación
      }
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    // Send email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Verifica tu cuenta - INGENIT',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">¡Bienvenido a INGENIT!</h2>
          <p>Hola ${name},</p>
          <p>Gracias por registrarte en INGENIT. Para completar tu registro, por favor verifica tu cuenta haciendo clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verificar mi cuenta
            </a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
          <p>Este enlace expirará en 24 horas.</p>
          <p>Si no solicitaste esta cuenta, puedes ignorar este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            INGENIT - Plataforma de gestión para hoteles
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      message: 'Email de verificación enviado correctamente. Revisa tu bandeja de entrada.',
      emailSent: true
    });
    
  } catch (err) {
    console.error('Send verification email error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}