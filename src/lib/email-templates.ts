export function getEmailTemplate(name: string, verifyUrl: string): string {
    return `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
        <style type="text/css">
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
          /* Outlook specific */
          .ExternalClass {width: 100%;}
          .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100%;
          }
          /* Remove blue links for clients that don't support CSS */
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin: 0 auto;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #1e40af; padding: 40px 20px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <!-- Icon -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 64px; height: 64px; text-align: center; vertical-align: middle;">
                                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">✓</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 20px;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif; line-height: 1.3;">
                            ¡Bienvenido a INGENIT!
                          </h1>
                          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px; font-family: Arial, sans-serif; line-height: 1.4;">
                            Plataforma de gestión integral para hoteles
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="font-size: 18px; line-height: 1.6; color: #1f2937; margin: 0 0 20px 0; font-family: Arial, sans-serif;">
                      Hola <strong style="color: #1e40af;">${name}</strong>,
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0; font-family: Arial, sans-serif;">
                      ¡Gracias por unirte a INGENIT! Para completar tu registro y acceder a todas las funcionalidades de nuestra plataforma, necesitamos verificar tu dirección de correo electrónico.
                    </p>
                    
                    <!-- Verification Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: #1e40af; border-radius: 8px;">
                                <a href="${verifyUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 16px 32px; font-weight: bold; font-size: 16px; font-family: Arial, sans-serif; line-height: 1.2; text-align: center;">
                                  Verificar mi cuenta
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Alternative Link -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                      <tr>
                        <td style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                          <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0; font-weight: bold; font-family: Arial, sans-serif; text-align: center;">
                            ¿No puedes hacer clic en el botón?
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; text-align: center;">
                                <p style="margin: 0; font-size: 13px; color: #374151; word-break: break-all; font-family: 'Courier New', monospace; line-height: 1.4;">
                                  ${verifyUrl}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Important Notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                      <tr>
                        <td style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px;">
                          <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                            Importante
                          </h3>
                          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5; font-family: Arial, sans-serif;">
                            Este enlace de verificación expirará en 24 horas por motivos de seguridad.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin: 24px 0 0 0; font-family: Arial, sans-serif;">
                      Si no solicitaste esta cuenta, puedes ignorar este email de forma segura.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: Arial, sans-serif;">
                      © 2024 INGENIT. Todos los derechos reservados.
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0; font-family: Arial, sans-serif;">
                      Este es un email automático, por favor no respondas a este mensaje.
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