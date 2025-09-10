import BaseLayout from "@/components/layout/base-layout";
import { Shield, Eye, Lock, Database, Users, Globe, Calendar, FileText, AlertTriangle } from "lucide-react";

export default function PrivacyPage() {
  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue7 to-blue5 text-white py-16 sm:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 rounded-full p-4">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-gold4" strokeWidth={1} />
              </div>
            </div>
            <h1 className="text-blue13 text-3xl sm:text-4xl lg:text-5xl font-normal mb-4 font-title">
              Política de Privacidad
            </h1>
            <p className="text-lg sm:text-xl text-blue13 max-w-2xl mx-auto">
              Protección y transparencia en el tratamiento de datos personales
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
                    Esta Política de Privacidad constituye un documento legal vinculante entre INGENIT SpA y los usuarios de la plataforma. 
                    El uso de nuestros servicios implica la aceptación expresa de los términos aquí establecidos.
                  </p>
                </div>
              </div>
            </div>

            {/* Introducción */}
            <div className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue5 mb-6 font-title">
                1. Declaración de Principios
              </h2>
              <p className="text-gray5 leading-relaxed mb-4">
                INGENIT SpA, sociedad por acciones constituida en Chile, con domicilio en Chile y RUT 78.000.171-2, 
                en su calidad de responsable del tratamiento de datos personales, se compromete a respetar y proteger 
                la privacidad de todos los usuarios de su plataforma de gestión hotelera.
              </p>
              <p className="text-gray5 leading-relaxed mb-4">
                La presente Política de Privacidad se rige por la Ley N° 19.628 sobre Protección de la Vida Privada 
                de Chile, el Reglamento General de Protección de Datos (GDPR) de la Unión Europea, y demás normativas 
                aplicables en materia de protección de datos personales.
              </p>
              <p className="text-gray5 leading-relaxed">
                <strong>Definiciones:</strong> Para los efectos de esta política, se entenderá por "Datos Personales" 
                toda información relativa a una persona natural identificada o identificable, y por "Tratamiento" 
                cualquier operación o conjunto de operaciones realizadas sobre datos personales.
              </p>
            </div>

            {/* Información que Recopilamos */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Database className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  2. Categorías de Datos Personales Objeto de Tratamiento
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">2.1 Datos de Identificación Personal</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Nombres y apellidos completos</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Dirección de correo electrónico corporativo</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Número de teléfono de contacto</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Información de la entidad comercial representada</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">2.2 Datos de Carácter Comercial</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Información de facturación y datos de pago</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Datos operacionales del establecimiento hotelero</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Información de personal autorizado para el sistema</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">2.3 Datos de Carácter Técnico</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Dirección IP y registros de acceso al sistema</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Información del dispositivo y navegador utilizado</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Cookies y tecnologías de seguimiento autorizadas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Finalidades del Tratamiento */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Eye className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  3. Finalidades del Tratamiento de Datos Personales
                </h3>
              </div>
              
              <p className="text-gray5 leading-relaxed mb-6">
                Los datos personales recopilados serán tratados exclusivamente para las siguientes finalidades legítimas:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.1 Finalidades Principales</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Prestación de servicios de gestión hotelera</li>
                    <li>• Procesamiento de transacciones comerciales</li>
                    <li>• Administración de cuentas de usuario</li>
                    <li>• Comunicaciones contractuales obligatorias</li>
                    <li>• Cumplimiento de obligaciones legales</li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.2 Finalidades Secundarias</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Mejora continua de la plataforma</li>
                    <li>• Análisis estadísticos agregados</li>
                    <li>• Desarrollo de nuevas funcionalidades</li>
                    <li>• Personalización de la experiencia del usuario</li>
                    <li>• Investigación y desarrollo tecnológico</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Base Legal */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <FileText className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  4. Base Legal del Tratamiento
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <p className="text-gray5 leading-relaxed mb-4">
                  El tratamiento de datos personales se fundamenta en las siguientes bases legales:
                </p>
                <ul className="space-y-3 text-gray5">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Ejecución de Contrato:</span> Para la prestación de servicios 
                      de gestión hotelera conforme al acuerdo de servicios suscrito.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Interés Legítimo:</span> Para la mejora de servicios, 
                      seguridad del sistema y prevención de fraudes.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Cumplimiento Legal:</span> Para satisfacer obligaciones 
                      fiscales, contables y regulatorias aplicables.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Consentimiento Explícito:</span> Para finalidades 
                      específicas que requieran autorización previa del titular.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Compartir Información */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Users className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  5. Cesión y Transferencia de Datos
                </h3>
              </div>
              
              <p className="text-gray5 leading-relaxed mb-4">
                <strong>Principio de No Cesión:</strong> INGENIT SpA no comercializa, alquila ni transfiere datos 
                personales a terceros con fines comerciales. La cesión de datos solo se realiza en los siguientes supuestos:
              </p>
              
              <div className="bg-gray10 rounded p-4 sm:p-6">
                <ul className="space-y-3 text-gray5">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Proveedores de Servicios Técnicos:</span> Empresas que prestan 
                      servicios de infraestructura, hosting, procesamiento de pagos y análisis, bajo acuerdos de 
                      confidencialidad estrictos.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Autoridades Competentes:</span> Cuando sea requerido por 
                      disposición legal, orden judicial o autoridad administrativa competente.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Consentimiento Previo:</span> Únicamente con autorización 
                      expresa del titular de los datos para finalidades específicas.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Seguridad de Datos */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Lock className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  6. Medidas de Seguridad y Confidencialidad
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">6.1 Medidas Técnicas</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Encriptación SSL/TLS de extremo a extremo</li>
                    <li>• Control de acceso basado en roles (RBAC)</li>
                    <li>• Monitoreo continuo de seguridad 24/7</li>
                    <li>• Copias de seguridad automáticas y seguras</li>
                    <li>• Firewalls y sistemas de detección de intrusiones</li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">6.2 Cumplimiento Normativo</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Cumplimiento con GDPR (Reglamento UE 2016/679)</li>
                    <li>• Cumplimiento con LGPD (Lei Geral de Proteção de Dados)</li>
                    <li>• Estándares ISO 27001 de seguridad informática</li>
                    <li>• Auditorías de seguridad independientes</li>
                    <li>• Certificaciones de cumplimiento vigentes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Derechos ARCO */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Globe className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  7. Derechos del Titular de los Datos
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <p className="text-gray5 leading-relaxed mb-4">
                  Conforme a la normativa vigente, el titular de los datos personales tiene los siguientes derechos:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">7.1 Derechos ARCO</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Acceso:</strong> Conocer qué datos se tratan y cómo</li>
                      <li>• <strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                      <li>• <strong>Cancelación:</strong> Eliminar datos del sistema</li>
                      <li>• <strong>Oposición:</strong> Oponerse al tratamiento de datos</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">7.2 Derechos Adicionales</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Portabilidad:</strong> Recibir datos en formato estructurado</li>
                      <li>• <strong>Limitación:</strong> Restringir el tratamiento</li>
                      <li>• <strong>Revocación:</strong> Retirar consentimiento otorgado</li>
                      <li>• <strong>Reclamación:</strong> Presentar denuncias ante autoridades</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Retención de Datos */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Calendar className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  8. Período de Conservación de Datos
                </h3>
              </div>
              
              <p className="text-gray5 leading-relaxed mb-4">
                Los datos personales se conservarán únicamente durante el tiempo necesario para cumplir con las 
                finalidades para las que fueron recopilados, respetando los períodos legales de prescripción:
              </p>
              
              <div className="bg-gray10 rounded p-4 sm:p-6">
                <ul className="space-y-3 text-gray5">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Datos de Cuenta Activa:</span> Durante la vigencia del 
                      contrato de servicios y hasta 2 años después de su terminación.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Datos de Facturación:</span> 7 años conforme a obligaciones 
                      fiscales y contables aplicables.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <span className="font-semibold">Datos de Seguridad:</span> Hasta 5 años para fines de 
                      auditoría y cumplimiento normativo.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contacto y Ejercicio de Derechos */}
            <div className="mb-8">
              <div className="bg-blue7 rounded p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 font-title">
                  9. Ejercicio de Derechos y Contacto
                </h3>
                <p className="text-blue13 mb-4">
                  Para ejercer cualquiera de los derechos reconocidos en esta política o realizar consultas 
                  sobre el tratamiento de datos personales, puede contactarnos a través de los siguientes medios:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p><strong>Oficina de Protección de Datos:</strong></p>
                    <p><strong>Email:</strong> gerencia@ingenit.cl</p>
                    <p><strong>Teléfono:</strong> +56 9 9020 6618</p>
                    <p><strong>Horario:</strong> Lunes a Viernes 9:00 - 18:00</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Información de la Empresa:</strong></p>
                    <p><strong>Razón Social:</strong> INGENIT SpA</p>
                    <p><strong>RUT:</strong> 78.000.171-2</p>
                    <p><strong>Domicilio:</strong> Chile</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disposiciones Finales */}
            <div className="border-t border-gray3 pt-8">
              <h3 className="text-lg font-semibold text-blue5 mb-3">10. Disposiciones Finales</h3>
              <div className="space-y-3 text-gray5 text-sm">
                <p>
                  <strong>Modificaciones:</strong> Esta Política de Privacidad puede ser modificada por INGENIT SpA 
                  para adaptarse a cambios normativos o en las prácticas de tratamiento de datos. Las modificaciones 
                  serán notificadas con al menos 30 días de anticipación.
                </p>
                <p>
                  <strong>Legislación Aplicable:</strong> Esta política se rige por la legislación chilena y, 
                  en su caso, por las normativas internacionales aplicables en materia de protección de datos personales.
                </p>
                <p>
                  <strong>Jurisdicción:</strong> Cualquier controversia derivada de esta política será resuelta 
                  por los tribunales competentes de Chile, salvo disposición legal en contrario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}