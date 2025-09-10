import BaseLayout from "@/components/layout/base-layout";
import { Cookie, AlertTriangle, Shield, Eye, Lock, Database, Settings, Info, CheckCircle, XCircle } from "lucide-react";

export default function CookiesPage() {
  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue7 to-blue5 text-white py-16 sm:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 rounded-full p-4">
                <Cookie className="h-8 w-8 sm:h-10 sm:w-10 text-gold4" strokeWidth={1} />
              </div>
            </div>
            <h1 className="text-blue13 text-3xl sm:text-4xl lg:text-5xl font-normal mb-4 font-title">
              Política de Cookies
            </h1>
            <p className="text-lg sm:text-xl text-blue13 max-w-2xl mx-auto">
              Información sobre el uso de cookies y tecnologías de seguimiento en INGENIT
            </p>
            <div className="mt-6 p-4 bg-white/10 rounded border border-white/20">
              <p className="text-lg text-blue13">
                <strong>Fecha de entrada en vigor:</strong> {new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-blue13 mt-1">
                Versión 1.0 - Documento legal vinculante
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
          <div className="bg-white rounded shadow-xl p-6 sm:p-8 lg:p-12">
            
            {/* Aviso Legal */}
            <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">Aviso Legal</h3>
                  <p className="text-sm text-yellow-700">
                    Esta Política de Cookies constituye un documento legal vinculante que regula el uso de cookies 
                    y tecnologías de seguimiento en la plataforma INGENIT. El uso de nuestros servicios implica 
                    la aceptación de esta política.
                  </p>
                </div>
              </div>
            </div>

            {/* Introducción */}
            <div className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue5 mb-6 font-title">
                1. Declaración de Principios sobre Cookies
              </h2>
              <p className="text-gray5 leading-relaxed mb-4">
                INGENIT SpA, sociedad por acciones constituida en Chile, con domicilio en Chile y RUT 78.000.171-2, 
                en su calidad de responsable del tratamiento de datos personales, se compromete a ser transparente 
                sobre el uso de cookies y tecnologías similares en nuestra plataforma de gestión hotelera.
              </p>
              <p className="text-gray5 leading-relaxed mb-4">
                La presente Política de Cookies se rige por la Ley N° 19.628 sobre Protección de la Vida Privada 
                de Chile, el Reglamento General de Protección de Datos (GDPR) de la Unión Europea, la Directiva 
                ePrivacy (2002/58/CE), y demás normativas aplicables en materia de cookies y tecnologías de seguimiento.
              </p>
              <p className="text-gray5 leading-relaxed">
                <strong>Definiciones:</strong> Para los efectos de esta política, se entenderá por "Cookies" pequeños 
                archivos de texto que se almacenan en el dispositivo del usuario, por "Tecnologías de Seguimiento" 
                cualquier mecanismo que permita rastrear la actividad del usuario, y por "Dispositivo" cualquier 
                equipo informático, móvil o tablet utilizado para acceder a la plataforma.
              </p>
            </div>

            {/* ¿Qué son las Cookies? */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Info className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  2. ¿Qué son las Cookies y Cómo Funcionan?
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <p className="text-gray5 leading-relaxed mb-4">
                  Las cookies son pequeños archivos de texto que se almacenan en el navegador web del usuario cuando 
                  visita un sitio web. Estas cookies permiten que el sitio web recuerde información sobre la visita, 
                  como el idioma preferido y otras opciones, para hacer que la próxima visita sea más útil.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">2.1 Funcionamiento Técnico</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• Se almacenan en el navegador del usuario</li>
                      <li>• Contienen información de identificación única</li>
                      <li>• Se envían automáticamente en cada solicitud</li>
                      <li>• Tienen fechas de expiración configurables</li>
                      <li>• Pueden ser de primera o tercera parte</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">2.2 Propósitos Generales</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• Mejorar la experiencia del usuario</li>
                      <li>• Recordar preferencias y configuraciones</li>
                      <li>• Analizar el uso del sitio web</li>
                      <li>• Personalizar contenido y publicidad</li>
                      <li>• Mantener la seguridad de la sesión</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipos de Cookies */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Database className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  3. Tipos de Cookies Utilizadas en INGENIT
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.1 Cookies Técnicas (Necesarias)</h4>
                  <p className="text-gray5 text-sm mb-3">
                    Estas cookies son esenciales para el funcionamiento básico de la plataforma y no pueden ser desactivadas.
                  </p>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Cookies de Sesión:</strong> Mantienen la autenticación del usuario durante la navegación</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Cookies de Seguridad:</strong> Protegen contra ataques CSRF y validan formularios</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Cookies de Preferencias:</strong> Almacenan configuraciones del usuario (idioma, región)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Cookies de Funcionalidad:</strong> Permiten características avanzadas como chat en vivo</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.2 Cookies Analíticas (Opcionales)</h4>
                  <p className="text-gray5 text-sm mb-3">
                    Estas cookies nos ayudan a entender cómo los usuarios interactúan con la plataforma.
                  </p>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Google Analytics:</strong> Análisis de tráfico y comportamiento de usuarios</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Hotjar:</strong> Mapas de calor y grabaciones de sesiones (con consentimiento)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Cookies de Rendimiento:</strong> Monitoreo de tiempos de carga y errores</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.3 Cookies de Marketing (Opcionales)</h4>
                  <p className="text-gray5 text-sm mb-3">
                    Estas cookies se utilizan para mostrar publicidad relevante y medir la efectividad de campañas.
                  </p>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Google Ads:</strong> Seguimiento de conversiones y remarketing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Facebook Pixel:</strong> Seguimiento de eventos y optimización de anuncios</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>LinkedIn Insight:</strong> Análisis de audiencia profesional</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Finalidades del Uso */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Eye className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  4. Finalidades del Uso de Cookies
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">4.1 Finalidades Técnicas</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Autenticación y gestión de sesiones</li>
                    <li>• Prevención de ataques de seguridad</li>
                    <li>• Optimización del rendimiento</li>
                    <li>• Funcionalidades personalizadas</li>
                    <li>• Compatibilidad entre navegadores</li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">4.2 Finalidades Analíticas</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Análisis de uso de la plataforma</li>
                    <li>• Identificación de problemas técnicos</li>
                    <li>• Mejora de la experiencia del usuario</li>
                    <li>• Optimización de funcionalidades</li>
                    <li>• Investigación y desarrollo</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Base Legal */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Shield className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  5. Base Legal del Uso de Cookies
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <p className="text-gray5 leading-relaxed mb-4">
                  El uso de cookies en la plataforma INGENIT se fundamenta en las siguientes bases legales:
                </p>
                <ul className="space-y-3 text-gray5">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Interés Legítimo:</span> Para cookies técnicas y analíticas 
                      necesarias para el funcionamiento y mejora de la plataforma.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Consentimiento Explícito:</span> Para cookies de marketing 
                      y analíticas avanzadas que requieren autorización previa del usuario.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Ejecución de Contrato:</span> Para cookies esenciales 
                      que permiten la prestación de servicios contratados.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Cumplimiento Legal:</span> Para cookies de seguridad 
                      que cumplen con obligaciones regulatorias.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Gestión de Cookies */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Settings className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  6. Gestión y Control de Cookies
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">6.1 Panel de Consentimiento</h4>
                  <p className="text-gray5 text-sm mb-3">
                    INGENIT proporciona un panel de gestión de cookies que permite a los usuarios:
                  </p>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Revisar todas las cookies utilizadas en la plataforma</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Activar o desactivar cookies por categoría</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Modificar preferencias en cualquier momento</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Revocar consentimientos previamente otorgados</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">6.2 Configuración del Navegador</h4>
                  <p className="text-gray5 text-sm mb-3">
                    Los usuarios también pueden gestionar cookies a través de la configuración de su navegador:
                  </p>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Chrome: Configuración → Privacidad y seguridad → Cookies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Firefox: Opciones → Privacidad y seguridad → Cookies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Safari: Preferencias → Privacidad → Cookies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Edge: Configuración → Cookies y permisos del sitio</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cookies de Terceros */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Lock className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  7. Cookies de Terceros y Proveedores
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <p className="text-gray5 leading-relaxed mb-4">
                  La plataforma INGENIT utiliza servicios de terceros que pueden instalar cookies en su dispositivo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">7.1 Proveedores de Análisis</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Google Analytics:</strong> Análisis de tráfico web</li>
                      <li>• <strong>Hotjar:</strong> Análisis de comportamiento</li>
                      <li>• <strong>Mixpanel:</strong> Seguimiento de eventos</li>
                      <li>• <strong>Amplitude:</strong> Análisis de productos</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">7.2 Proveedores de Marketing</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Google Ads:</strong> Publicidad y remarketing</li>
                      <li>• <strong>Facebook Pixel:</strong> Seguimiento de conversiones</li>
                      <li>• <strong>LinkedIn Insight:</strong> Análisis de audiencia</li>
                      <li>• <strong>HubSpot:</strong> Marketing automation</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Cada proveedor de terceros tiene su propia política de privacidad. 
                    Recomendamos revisar estas políticas para entender cómo utilizan la información recopilada.
                  </p>
                </div>
              </div>
            </div>

            {/* Retención y Expiración */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <CheckCircle className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  8. Retención y Expiración de Cookies
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">8.1 Períodos de Retención</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Cookies de Sesión:</strong> Se eliminan al cerrar el navegador</li>
                      <li>• <strong>Cookies Persistentes:</strong> Hasta 2 años máximo</li>
                      <li>• <strong>Cookies Analíticas:</strong> 26 meses (Google Analytics)</li>
                      <li>• <strong>Cookies de Marketing:</strong> Hasta 90 días</li>
                      <li>• <strong>Cookies de Seguridad:</strong> Hasta 1 año</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">8.2 Criterios de Expiración</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• Finalización del propósito específico</li>
                      <li>• Cumplimiento del período legal máximo</li>
                      <li>• Revocación del consentimiento</li>
                      <li>• Solicitud de eliminación del usuario</li>
                      <li>• Actualización de la política</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Derechos del Usuario */}
            <div className="mb-8">
              <div className="bg-blue7 rounded p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 font-title">
                  9. Derechos del Usuario en Relación a Cookies
                </h3>
                <p className="text-blue13 mb-4">
                  Conforme a la normativa vigente, los usuarios tienen los siguientes derechos respecto al uso de cookies:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p><strong>Derechos de Control:</strong></p>
                    <p>• <strong>Consentimiento:</strong> Otorgar o retirar consentimiento</p>
                    <p>• <strong>Acceso:</strong> Conocer qué cookies se utilizan</p>
                    <p>• <strong>Rectificación:</strong> Modificar preferencias</p>
                    <p>• <strong>Eliminación:</strong> Solicitar supresión de datos</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Derechos de Información:</strong></p>
                    <p>• <strong>Transparencia:</strong> Información clara sobre cookies</p>
                    <p>• <strong>Finalidad:</strong> Conocer el propósito de cada cookie</p>
                    <p>• <strong>Proveedores:</strong> Identificar terceros involucrados</p>
                    <p>• <strong>Duración:</strong> Conocer períodos de retención</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disposiciones Finales */}
            <div className="border-t border-gray3 pt-8">
              <h3 className="text-lg font-semibold text-blue5 mb-3">10. Disposiciones Finales</h3>
              <div className="space-y-3 text-gray5 text-sm">
                <p>
                  <strong>Modificaciones:</strong> Esta Política de Cookies puede ser modificada por INGENIT SpA 
                  para adaptarse a cambios legales, tecnológicos o en las prácticas de cookies. Las modificaciones 
                  serán notificadas con al menos 30 días de anticipación.
                </p>
                <p>
                  <strong>Contacto:</strong> Para consultas sobre esta política o ejercer derechos relacionados 
                  con cookies, puede contactarnos a través de gerencia@ingenit.cl o en la dirección corporativa de INGENIT SpA.
                </p>
                <p>
                  <strong>Legislación Aplicable:</strong> Esta política se rige por la legislación chilena, 
                  el GDPR de la Unión Europea y las directivas ePrivacy aplicables en materia de cookies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}