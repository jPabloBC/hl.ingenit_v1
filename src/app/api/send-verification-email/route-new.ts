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

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    // Intentar enviar email usando las variables disponibles
    let transporter;
    
    // OPCIÓN 1: Variables de producción (EMAIL_USE, EMAIL_PASS, ADMIN_EMAIL)
    if (process.env.EMAIL_USE && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL) {
      transporter = nodemailer.createTransporter({
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
      transporter = nodemailer.createTransporter({
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

function getEmailTemplate(name: string, verifyUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verificación de cuenta - INGENIT</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }
        
        /* Mobile styles */
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 10px !important; }
          .content { padding: 20px 15px !important; }
          .button { width: 100% !important; padding: 15px 20px !important; font-size: 16px !important; }
          .header-title { font-size: 24px !important; }
          .header-subtitle { font-size: 14px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f6f8;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e1e5e9; margin: 0 auto;">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #1e3a8a; padding: 30px 20px; text-align: center;">
                  <h1 class="header-title" style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                    ¡Bienvenido a INGENIT!
                  </h1>
                  <p class="header-subtitle" style="color: #93c5fd; margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">
                    Plataforma de gestión integral para hoteles
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td class="content" style="padding: 40px 30px;">
                  <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0 0 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                    Hola <strong style="color: #1e3a8a;">${name}</strong>,
                  </p>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 25px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                    ¡Gracias por unirte a INGENIT! Para completar tu registro y acceder a todas las funcionalidades de nuestra plataforma, necesitamos verificar tu dirección de correo electrónico.
                  </p>
                  
                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 35px 0;">
                    <tr>
                      <td align="center">
                        <a href="${verifyUrl}" class="button" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 16px 32px; font-weight: 600; font-size: 16px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; border: 2px solid #1e3a8a;">
                          ✅ Verificar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Alternative URL -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #eff6ff; border: 1px solid #bfdbfe; margin: 25px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="font-size: 14px; color: #1e3a8a; margin: 0 0 10px 0; font-weight: 600; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                          ¿No puedes hacer clic en el botón? Copia y pega este enlace en tu navegador:
                        </p>
                        <p style="font-size: 13px; color: #1e40af; word-break: break-all; margin: 0; font-family: 'Courier New', Courier, monospace; background-color: #ffffff; padding: 10px; border: 1px solid #bfdbfe;">
                          ${verifyUrl}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="font-size: 14px; color: #6b7280; margin: 25px 0 0 0; line-height: 1.5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                    <strong>Importante:</strong> Este enlace de verificación expirará en 24 horas por motivos de seguridad.
                  </p>
                  
                  <p style="font-size: 14px; color: #6b7280; margin: 15px 0 0 0; line-height: 1.5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                    Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                    <strong>INGENIT</strong> - Plataforma de gestión integral para hoteles
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;">
                    © 2024 INGENIT. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}