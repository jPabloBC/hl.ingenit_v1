import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, planName, planPrice, bankData } = await request.json();

    if (!userEmail || !planName || !planPrice || !bankData) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Crear el contenido del correo
    const emailContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Datos Bancarios - INGENIT</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .header { padding: 20px !important; }
            .content { padding: 20px !important; }
            .section { padding: 15px !important; margin-bottom: 15px !important; }
            .bank-table { font-size: 14px !important; }
            .bank-table td { padding: 6px 0 !important; }
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 16px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
                 <!-- Header -->
                 <div class="header" style="background-color: #001a33; color: white; padding: 30px; text-align: center;">
                   <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">INGENIT</h1>
                   <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Hotel Management System</p>
                 </div>
          
          <!-- Content -->
          <div class="content" style="padding: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 22px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Datos Bancarios para Pago</h2>
            
            <!-- Plan Info -->
            <div class="section" style="background-color: #cce4ff; padding: 20px; border-left: 4px solid #0078ff; margin-bottom: 25px;">
              <h3 style="color: #001a33; margin-bottom: 15px; font-size: 18px;">Plan Seleccionado</h3>
              <p style="margin: 8px 0; color: #001a33; font-size: 16px;"><strong>Plan:</strong> ${planName}</p>
              <p style="margin: 8px 0; color: #001a33; font-size: 16px;"><strong>Monto:</strong> $${planPrice.toLocaleString('es-CL')} CLP</p>
            </div>
            
            <!-- Bank Details -->
            <div class="section" style="background-color: #ffffff; padding: 25px; border: 1px solid #0078ff; margin-bottom: 25px;">
              <h3 style="color: #001a33; margin-bottom: 20px; font-size: 18px; text-align: center;">Datos Bancarios de INGENIT</h3>
              <table class="bank-table" style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600; width: 40%;"><strong>Banco:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 500;">${bankData.bankName}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;"><strong>Tipo de Cuenta:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 500;">${bankData.accountType}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;"><strong>Número de Cuenta:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937; font-family: 'Courier New', monospace; font-weight: bold; font-size: 18px; letter-spacing: 1px;">${bankData.accountNumber}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;"><strong>RUT:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px;">${bankData.rut}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;"><strong>Titular:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 500;">${bankData.accountHolder}</td>
                </tr>
              </table>
            </div>
            
            <!-- Instructions -->
            <div class="section" style="background-color: #cce4ff; padding: 20px; border-left: 4px solid #0078ff; margin-bottom: 25px;">
              <h3 style="color: #001a33; margin-bottom: 15px; font-size: 18px;">Instrucciones Importantes</h3>
              <ul style="color: #001a33; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li style="margin-bottom: 10px; font-size: 15px;">Realiza la transferencia por el monto exacto: <strong>$${planPrice.toLocaleString('es-CL')} CLP</strong></li>
                <li style="margin-bottom: 10px; font-size: 15px;">En el concepto, incluye tu email: <strong>${userEmail}</strong></li>
                <li style="margin-bottom: 10px; font-size: 15px;">Una vez realizada la transferencia, sube el comprobante en la plataforma o envíalo a: <strong>${bankData.email}</strong></li>
                <li style="margin-bottom: 10px; font-size: 15px;">Tu suscripción se activará en un plazo máximo de 24 horas</li>
              </ul>
            </div>
            
            <!-- Note -->
            <div class="section" style="background-color: #cce4ff; padding: 20px; border-left: 4px solid #0078ff;">
              <p style="color: #001a33; margin: 0; font-weight: 500; font-size: 15px; line-height: 1.5;">
                <strong>Nota:</strong> Una vez confirmado el pago, recibirás un correo de confirmación y tu acceso a la plataforma será restaurado automáticamente.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              © 2025 INGENIT SpA. Todos los derechos reservados.
            </p>
            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 12px;">
              Si tienes alguna consulta, contáctanos en ${bankData.email}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configurar transporter de email
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

    // Enviar el correo
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.ADMIN_EMAIL || 'gerencia@ingenit.cl',
      to: userEmail,
      subject: `Datos Bancarios - Pago Plan ${planName} - INGENIT`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Correo enviado exitosamente' });

  } catch (error) {
    console.error('Error in send-bank-details:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
