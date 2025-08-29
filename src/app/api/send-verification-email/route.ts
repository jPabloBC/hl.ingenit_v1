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

    // Send actual email using Titan SMTP
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    // Configure Titan SMTP
    console.log('Configuring SMTP with:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM
    });
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: `"INGENIT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Verifica tu cuenta - INGENIT',
              html: `
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
              @media only screen and (max-width: 600px) {
                .container { width: 100% !important; padding: 10px !important; }
                .content { padding: 20px 15px !important; }
                .button { width: 100% !important; padding: 15px 20px !important; font-size: 16px !important; }
                .logo { width: 120px !important; height: auto !important; }
                .header-title { font-size: 24px !important; }
                .url-text { font-size: 12px !important; }
              }
              
              @media only screen and (max-width: 480px) {
                .container { padding: 5px !important; }
                .content { padding: 15px 10px !important; }
                .header-title { font-size: 22px !important; }
                .logo { width: 100px !important; }
                .button { font-size: 14px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f2f2f2; font-family: Arial, sans-serif;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f2f2f2; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #001a33 0%, #003c80 100%); padding: 30px 20px; text-align: center;">
                        <h1 class="header-title" style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                          ¡Bienvenido a INGENIT!
                        </h1>
                        <p style="color: #99adc2; margin: 8px 0 0 0; font-size: 16px;">
                          Plataforma de gestión integral
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td class="content" style="padding: 40px 30px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td>
                              <p style="font-size: 16px; line-height: 1.6; color: #1a1a1a; margin: 0 0 20px 0;">
                                Hola <strong style="color: #003c80;">${name}</strong>,
                              </p>
                              
                              <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 25px 0;">
                                ¡Gracias por unirte a INGENIT! Para completar tu registro y acceder a todas las funcionalidades de nuestra plataforma, necesitamos verificar tu dirección de correo electrónico.
                              </p>
                              
                              <!-- Button -->
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 35px 0;">
                                <tr>
                                  <td align="center">
                                    <a class="button" href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #003c80 0%, #0078ff 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(0, 120, 255, 0.3); transition: all 0.3s ease;">
                                      ✅ Verificar mi cuenta
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Alternative URL -->
                              <div style="background-color: #cce4ff; border: 1px solid #99c9ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <p style="font-size: 14px; color: #001a33; margin: 0 0 10px 0; font-weight: 600;">
                                  ¿No puedes hacer clic en el botón? Copia y pega este enlace en tu navegador:
                                </p>
                                <p class="url-text" style="font-size: 13px; color: #0078ff; word-break: break-all; margin: 0; font-family: monospace; background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #99c9ff;">
                                  ${verifyUrl}
                                </p>
                              </div>
                              
                              <!-- Security Info -->
                              <div style="background-color: #f8edd2; border-left: 4px solid #daa520; padding: 16px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                <p style="font-size: 14px; color: #372908; margin: 0; line-height: 1.5;">
                                  <strong>🔒 Información de seguridad:</strong><br>
                                  • Este enlace expirará en 24 horas por seguridad<br>
                                  • Si no solicitaste esta cuenta, puedes ignorar este mensaje<br>
                                  • Nunca compartiremos tu información personal
                                </p>
                              </div>
                              
                              <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 25px 0 0 0;">
                                ¡Esperamos verte pronto en INGENIT!<br>
                                <span style="color: #003c80; font-weight: 600;">El equipo de INGENIT</span>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #001a33; padding: 30px 20px; text-align: center;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding-bottom: 20px;">
                              <img class="logo" src="https://juupotamdjqzpxuqdtco.supabase.co/storage/v1/object/public/public-assets/logo_transparent_ingenIT_white.png" alt="INGENIT Logo" style="width: 140px; height: auto; display: block; margin: 0 auto;">
                            </td>
                          </tr>
                          <tr>
                            <td align="center">
                              <p style="color: #99adc2; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                                INGENIT
                              </p>
                              <p style="color: #6685a3; font-size: 13px; margin: 0 0 15px 0; line-height: 1.4;">
                                Plataforma integral de gestión para hoteles y restaurantes<br>
                                Optimiza tu negocio con tecnología de vanguardia
                              </p>
                              <p style="color: #666666; font-size: 12px; margin: 0; line-height: 1.3;">
                                © ${new Date().getFullYear()} INGENIT. Todos los derechos reservados.<br>
                                Este es un mensaje automático, por favor no responder a este correo.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      return NextResponse.json({ 
        message: 'Email de verificación enviado correctamente. Revisa tu bandeja de entrada.',
        emailSent: true
      });
      
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Fallback for development
      return NextResponse.json({ 
        message: 'Error enviando email, pero puedes verificar manualmente.',
        verificationUrl: verifyUrl,
        token: token,
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }
    
  } catch (err) {
    console.error('Send verification email error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
