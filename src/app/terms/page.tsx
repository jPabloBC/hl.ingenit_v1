import BaseLayout from "@/components/layout/base-layout";
import { FileText, AlertTriangle, Shield, Users, Globe, Calendar, CheckCircle, XCircle, Info } from "lucide-react";

export default function TermsPage() {
  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue7 to-blue5 text-white py-16 sm:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 rounded-full p-4">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gold4" strokeWidth={1} />
              </div>
            </div>
            <h1 className="text-blue13 text-3xl sm:text-4xl lg:text-5xl font-normal mb-4 font-title">
              Términos y Condiciones
            </h1>
            <p className="text-lg sm:text-xl text-blue13 max-w-2xl mx-auto">
              Condiciones de uso y prestación de servicios de la plataforma INGENIT
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
                    Estos Términos y Condiciones constituyen un contrato legal vinculante entre INGENIT SpA y los usuarios de la plataforma. 
                    El uso de nuestros servicios implica la aceptación expresa de todos los términos aquí establecidos.
                  </p>
                </div>
              </div>
            </div>

            {/* Introducción */}
            <div className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue5 mb-6 font-title">
                1. Información General y Aceptación
              </h2>
              <p className="text-gray5 leading-relaxed mb-4">
                INGENIT SpA, sociedad por acciones constituida en Chile, con domicilio en Chile y RUT 78.000.171-2, 
                en adelante "INGENIT", "nosotros", "nuestra" o "la Empresa", es titular y operadora de la plataforma 
                de gestión hotelera INGENIT.
              </p>
              <p className="text-gray5 leading-relaxed mb-4">
                Los presentes Términos y Condiciones regulan el uso de la plataforma INGENIT, incluyendo todos los 
                servicios, funcionalidades y contenidos disponibles a través de la misma. Al acceder, registrarse o 
                utilizar nuestros servicios, usted acepta estar sujeto a estos términos en su totalidad.
              </p>
              <p className="text-gray5 leading-relaxed">
                <strong>Definiciones:</strong> Para los efectos de estos términos, se entenderá por "Usuario" toda 
                persona natural o jurídica que acceda o utilice la plataforma, por "Servicios" todas las funcionalidades 
                y herramientas disponibles en la plataforma, y por "Plataforma" el sistema informático y aplicaciones 
                web de INGENIT.
              </p>
            </div>

            {/* Descripción de Servicios */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Info className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  2. Descripción de Servicios
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">2.1 Servicios Principales</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Gestión integral de reservas y check-ins</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Administración de habitaciones y disponibilidad</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Gestión de precios y tarifas dinámicas</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Reportes y análisis de operaciones</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">2.2 Servicios Adicionales</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Integración con sistemas de pago (Webpay)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Gestión de personal y housekeeping</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Soporte técnico y capacitación</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Registro y Cuentas */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Users className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  3. Registro y Cuentas de Usuario
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.1 Requisitos de Registro</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Ser mayor de edad o contar con representación legal</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Proporcionar información veraz y actualizada</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Aceptar estos términos y la política de privacidad</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Verificar la dirección de correo electrónico</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.2 Responsabilidades de la Cuenta</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Mantener la confidencialidad de credenciales</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Notificar uso no autorizado inmediatamente</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>No compartir acceso con terceros no autorizados</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Responder por todas las actividades realizadas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Uso Aceptable */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <CheckCircle className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  4. Uso Aceptable de la Plataforma
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">4.1 Usos Permitidos</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Gestión de operaciones hoteleras legítimas</li>
                    <li>• Procesamiento de reservas y transacciones</li>
                    <li>• Generación de reportes y análisis</li>
                    <li>• Comunicación con clientes y personal</li>
                    <li>• Cumplimiento de obligaciones regulatorias</li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">4.2 Usos Prohibidos</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Actividades ilegales o fraudulentas</li>
                    <li>• Violación de derechos de propiedad intelectual</li>
                    <li>• Interferencia con el funcionamiento del sistema</li>
                    <li>• Distribución de malware o contenido dañino</li>
                    <li>• Uso para fines no autorizados</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Planes y Facturación */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <FileText className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  5. Planes de Suscripción y Facturación
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">5.1 Estructura de Planes</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Plan Básico:</strong> Funcionalidades esenciales</li>
                      <li>• <strong>Plan Profesional:</strong> Funcionalidades avanzadas</li>
                      <li>• <strong>Plan Empresarial:</strong> Funcionalidades premium</li>
                      <li>• <strong>Personalizaciones:</strong> Según necesidades específicas</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">5.2 Condiciones de Facturación</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• Facturación mensual o anual según plan</li>
                      <li>• Precios expresados en pesos chilenos + IVA</li>
                      <li>• Pago mediante transferencia bancaria o Webpay</li>
                      <li>• Renovación automática salvo cancelación</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Período de Prueba */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Calendar className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  6. Período de Prueba Gratuita
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <p className="text-gray5 leading-relaxed mb-4">
                  INGENIT ofrece un período de prueba gratuita de 14 días para nuevos usuarios, sujeto a las siguientes condiciones:
                </p>
                <ul className="space-y-3 text-gray5">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Duración:</span> 14 días naturales desde la activación de la cuenta
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Funcionalidades:</span> Acceso completo a todas las características del plan seleccionado
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Sin Compromiso:</span> No se requiere tarjeta de crédito ni pago inicial
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Conversión:</span> Al finalizar el período, se activará la suscripción seleccionada
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Propiedad Intelectual */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Shield className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  7. Propiedad Intelectual y Licencias
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">7.1 Derechos de INGENIT</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Propiedad exclusiva de la plataforma</li>
                    <li>• Derechos sobre software y código fuente</li>
                    <li>• Marcas comerciales y nombres registrados</li>
                    <li>• Documentación y materiales de capacitación</li>
                    <li>• Algoritmos y metodologías propietarias</li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">7.2 Licencia de Uso</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Licencia no exclusiva y revocable</li>
                    <li>• Uso únicamente para fines autorizados</li>
                    <li>• Prohibición de ingeniería inversa</li>
                    <li>• No transferible a terceros</li>
                    <li>• Sujeta a cumplimiento de términos</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Limitaciones de Responsabilidad */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <XCircle className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  8. Limitaciones de Responsabilidad
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <p className="text-gray5 leading-relaxed mb-4">
                  INGENIT se compromete a proporcionar servicios de la más alta calidad, sin embargo, establece las siguientes limitaciones:
                </p>
                <ul className="space-y-3 text-gray5">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Disponibilidad del Servicio:</span> No garantizamos disponibilidad 100% debido a 
                      mantenimientos programados, actualizaciones o eventos de fuerza mayor.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Pérdida de Datos:</span> El usuario es responsable de realizar copias de seguridad 
                      de su información crítica.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Daños Indirectos:</span> No nos responsabilizamos por pérdidas de beneficios, 
                      interrupción del negocio o daños consecuenciales.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Terminación */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Globe className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  9. Terminación del Servicio
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">9.1 Terminación por el Usuario</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• Cancelación con 30 días de anticipación</li>
                      <li>• Notificación por escrito o vía plataforma</li>
                      <li>• Acceso hasta el final del período facturado</li>
                      <li>• Exportación de datos antes de la cancelación</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">9.2 Terminación por INGENIT</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• Incumplimiento grave de estos términos</li>
                      <li>• Uso fraudulento o ilegal de la plataforma</li>
                      <li>• Impago de facturas por más de 30 días</li>
                      <li>• Cese de operaciones de la empresa</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Ley Aplicable y Jurisdicción */}
            <div className="mb-8">
              <div className="bg-blue7 rounded p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 font-title">
                  10. Ley Aplicable y Jurisdicción
                </h3>
                <p className="text-blue13 mb-4">
                  Estos términos se rigen por la legislación chilena y cualquier controversia será resuelta 
                  conforme a las siguientes disposiciones:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p><strong>Ley Aplicable:</strong></p>
                    <p>• Código Civil de Chile</p>
                    <p>• Ley de Protección al Consumidor</p>
                    <p>• Ley de Comercio Electrónico</p>
                    <p>• Normativas de protección de datos</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Resolución de Conflictos:</strong></p>
                    <p>• Tribunales de Justicia de Chile</p>
                    <p>• Mediación previa obligatoria</p>
                    <p>• Arbitraje según convenio</p>
                    <p>• Jurisdicción exclusiva chilena</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disposiciones Finales */}
            <div className="border-t border-gray3 pt-8">
              <h3 className="text-lg font-semibold text-blue5 mb-3">11. Disposiciones Finales</h3>
              <div className="space-y-3 text-gray5 text-sm">
                <p>
                  <strong>Modificaciones:</strong> Estos Términos y Condiciones pueden ser modificados por INGENIT SpA 
                  para adaptarse a cambios legales, tecnológicos o en las prácticas comerciales. Las modificaciones 
                  serán notificadas con al menos 30 días de anticipación.
                </p>
                <p>
                  <strong>Integridad del Acuerdo:</strong> Estos términos, junto con la Política de Privacidad y 
                  demás documentos referenciados, constituyen el acuerdo completo entre las partes.
                </p>
                <p>
                  <strong>Contacto:</strong> Para consultas sobre estos términos, puede contactarnos a través de 
                  gerencia@ingenit.cl o en la dirección corporativa de INGENIT SpA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}