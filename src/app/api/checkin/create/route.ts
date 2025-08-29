import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { reservation_id, hours_valid = 72 } = await request.json();

    if (!reservation_id) {
      return NextResponse.json(
        { error: 'reservation_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe y obtener información
    const { data: reservation, error: reservationError } = await supabase
      .from('hl_reservations')
      .select(`
        id,
        guest_name,
        guest_email,
        guest_phone,
        check_in_date,
        check_out_date,
        business_id,
        hl_business (
          business_name,
          contact_email
        )
      `)
      .eq('id', reservation_id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Crear proceso de check-in
    const { data: checkinData, error: checkinError } = await supabase
      .rpc('create_reservation_checkin', {
        p_reservation_id: reservation_id,
        p_hours_valid: hours_valid
      });

    if (checkinError || !checkinData || checkinData.length === 0) {
      console.error('Error creating check-in process:', checkinError);
      return NextResponse.json(
        { error: 'Error al crear proceso de check-in' },
        { status: 500 }
      );
    }

    const { checkin_id, checkin_token, expires_at } = checkinData[0];

    // Crear URL de check-in
    const checkinUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkin/${checkin_token}`;

    // Configurar transporter de email
    const transporter = nodemailer.createTransport({
      host: 'smtp.titan.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Crear email de check-in
    const hotelName = (reservation.hl_business as any)?.business_name || 'Hotel';
    const checkinDate = new Date(reservation.check_in_date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const expiryDate = new Date(expires_at).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check-in Digital - ${hotelName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 25px;
            color: #1e40af;
        }
        .info-box {
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box h3 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 16px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #4b5563;
        }
        .info-value {
            color: #1f2937;
        }
        .cta-section {
            text-align: center;
            margin: 35px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .steps {
            background-color: #fef3c7;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .steps h3 {
            margin: 0 0 15px 0;
            color: #92400e;
            font-size: 16px;
        }
        .step {
            margin-bottom: 10px;
            color: #78350f;
        }
        .step:last-child {
            margin-bottom: 0;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
            font-size: 14px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 25px 30px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .content, .header, .footer {
                padding: 20px;
            }
            .info-item {
                flex-direction: column;
            }
            .info-label {
                margin-bottom: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏨 Check-in Digital</h1>
            <p>Completa tu check-in antes de llegar</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                ¡Hola ${reservation.guest_name}!
            </div>
            
            <p>Te damos la bienvenida a <strong>${hotelName}</strong>. Para hacer tu llegada más rápida y cómoda, puedes completar tu check-in de forma digital antes de tu arribo.</p>
            
            <div class="info-box">
                <h3>📋 Detalles de tu Reserva</h3>
                <div class="info-item">
                    <span class="info-label">Hotel:</span>
                    <span class="info-value">${hotelName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Huésped Principal:</span>
                    <span class="info-value">${reservation.guest_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Check-in:</span>
                    <span class="info-value">${checkinDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Check-out:</span>
                    <span class="info-value">${new Date(reservation.check_out_date).toLocaleDateString('es-ES')}</span>
                </div>
            </div>
            
            <div class="cta-section">
                <a href="${checkinUrl}" class="cta-button">
                    🚀 Completar Check-in Digital
                </a>
            </div>
            
            <div class="steps">
                <h3>📝 ¿Qué necesitas hacer?</h3>
                <div class="step">1. Haz clic en el botón de arriba</div>
                <div class="step">2. Completa los datos de todos los huéspedes</div>
                <div class="step">3. Sube fotos de documentos de identidad</div>
                <div class="step">4. ¡Listo! Al llegar solo necesitas presentarte en recepción</div>
            </div>
            
            <div class="warning">
                <strong>⏰ Importante:</strong> Este enlace expira el <strong>${expiryDate}</strong>. 
                Completa tu check-in antes de esa fecha.
            </div>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Esperamos verte pronto!</p>
        </div>
        
        <div class="footer">
            <p>
                Este email fue enviado por <strong>${hotelName}</strong><br>
                Si no realizaste esta reserva, puedes ignorar este mensaje.
            </p>
            <p>
                <a href="${checkinUrl}">Completar Check-in</a> | 
                <a href="mailto:${(reservation.hl_business as any)?.contact_email || process.env.SMTP_USER}">Contactar Hotel</a>
            </p>
        </div>
    </div>
</body>
</html>`;

    // Enviar email
    const mailOptions = {
      from: `"${hotelName}" <${process.env.SMTP_USER}>`,
      to: reservation.guest_email,
      subject: `🏨 Check-in Digital - ${hotelName} | Reserva para ${checkinDate}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    // Registrar notificación
    await supabase
      .from('hl_checkin_notifications')
      .insert({
        checkin_process_id: checkin_id,
        business_id: reservation.business_id,
        notification_type: 'checkin_link_sent',
        recipient_email: reservation.guest_email,
        subject: mailOptions.subject,
        message: 'Check-in digital link sent successfully',
        sent_at: new Date().toISOString(),
        delivery_status: 'sent'
      });

    return NextResponse.json({
      success: true,
      checkin_id,
      checkin_token,
      checkin_url: checkinUrl,
      expires_at,
      message: 'Link de check-in enviado exitosamente'
    });

  } catch (error) {
    console.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
