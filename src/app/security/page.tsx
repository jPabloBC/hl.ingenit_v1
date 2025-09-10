import BaseLayout from "@/components/layout/base-layout";
import { Shield, AlertTriangle, Lock, Eye, Database, Users, Globe, Calendar, CheckCircle, XCircle, Key, Server, Network, FileText } from "lucide-react";

export default function SecurityPage() {
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
              Política de Seguridad
            </h1>
            <p className="text-lg sm:text-xl text-blue13 max-w-2xl mx-auto">
              Medidas de seguridad y protección de datos en la plataforma INGENIT
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
                    Esta Política de Seguridad constituye un documento legal vinculante que establece las medidas 
                    de protección y seguridad implementadas en la plataforma INGENIT. El uso de nuestros servicios 
                    implica la aceptación de estas medidas de seguridad.
                  </p>
                </div>
              </div>
            </div>

            {/* Introducción */}
            <div className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue5 mb-6 font-title">
                1. Compromiso con la Seguridad
              </h2>
              <p className="text-gray5 leading-relaxed mb-4">
                INGENIT SpA, sociedad por acciones constituida en Chile, con domicilio en Chile y RUT 78.000.171-2, 
                en su calidad de responsable del tratamiento de datos personales y operadora de la plataforma de 
                gestión hotelera INGENIT, se compromete a implementar y mantener las más altas medidas de seguridad 
                para proteger la información de nuestros usuarios.
              </p>
              <p className="text-gray5 leading-relaxed mb-4">
                La presente Política de Seguridad se rige por la Ley N° 19.628 sobre Protección de la Vida Privada 
                de Chile, el Reglamento General de Protección de Datos (GDPR) de la Unión Europea, la norma ISO 27001 
                sobre Gestión de Seguridad de la Información, y demás estándares internacionales de seguridad aplicables.
              </p>
              <p className="text-gray5 leading-relaxed">
                <strong>Definiciones:</strong> Para los efectos de esta política, se entenderá por "Seguridad de la 
                Información" la protección de datos contra amenazas internas y externas, por "Incidente de Seguridad" 
                cualquier evento que comprometa la confidencialidad, integridad o disponibilidad de la información, 
                y por "Medidas de Seguridad" todas las acciones técnicas, organizativas y legales implementadas.
              </p>
            </div>

            {/* Principios de Seguridad */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Shield className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  2. Principios Fundamentales de Seguridad
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray10 rounded p-4 sm:p-6 text-center">
                  <div className="bg-blue7 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white" strokeWidth={1} />
                  </div>
                  <h4 className="font-semibold text-blue5 mb-3">Confidencialidad</h4>
                  <p className="text-gray5 text-sm">
                    Garantizar que la información solo sea accesible a personas autorizadas y para fines legítimos.
                  </p>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6 text-center">
                  <div className="bg-blue7 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-white" strokeWidth={1} />
                  </div>
                  <h4 className="font-semibold text-blue5 mb-3">Integridad</h4>
                  <p className="text-gray5 text-sm">
                    Asegurar que la información sea precisa, completa y no haya sido alterada sin autorización.
                  </p>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6 text-center">
                  <div className="bg-blue7 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                    <Server className="h-8 w-8 text-white" strokeWidth={1} />
                  </div>
                  <h4 className="font-semibold text-blue5 mb-3">Disponibilidad</h4>
                  <p className="text-gray5 text-sm">
                    Mantener la información y servicios accesibles cuando sean requeridos por usuarios autorizados.
                  </p>
                </div>
              </div>
            </div>

            {/* Medidas Técnicas */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Key className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  3. Medidas Técnicas de Seguridad
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.1 Cifrado y Protección de Datos</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Cifrado SSL/TLS:</strong> Todas las comunicaciones utilizan cifrado de extremo a extremo con certificados de 256 bits</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Cifrado de Base de Datos:</strong> Datos sensibles almacenados con algoritmos AES-256</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Hashing de Contraseñas:</strong> Algoritmo bcrypt con salt único por usuario</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Tokens JWT:</strong> Autenticación mediante tokens seguros con expiración automática</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.2 Control de Acceso y Autenticación</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Autenticación Multi-Factor (MFA):</strong> Opcional para cuentas administrativas</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Control de Acceso Basado en Roles (RBAC):</strong> Permisos granulares por funcionalidad</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Políticas de Contraseñas:</strong> Mínimo 8 caracteres, mayúsculas, minúsculas y números</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Bloqueo de Cuentas:</strong> Después de 5 intentos fallidos de inicio de sesión</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">3.3 Seguridad de Infraestructura</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Firewalls de Aplicación (WAF):</strong> Protección contra ataques OWASP Top 10</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Detección de Intrusos (IDS/IPS):</strong> Monitoreo continuo de tráfico de red</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Segmentación de Red:</strong> Separación de entornos de desarrollo, testing y producción</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Backups Automatizados:</strong> Copias de seguridad diarias con retención de 30 días</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Medidas Organizativas */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Users className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  4. Medidas Organizativas de Seguridad
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">4.1 Políticas y Procedimientos</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Política de contraseñas corporativa</li>
                    <li>• Procedimientos de acceso a sistemas</li>
                    <li>• Protocolos de respuesta a incidentes</li>
                    <li>• Política de uso aceptable de recursos</li>
                    <li>• Procedimientos de backup y recuperación</li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">4.2 Capacitación y Concienciación</h4>
                  <ul className="space-y-2 text-gray5 text-sm">
                    <li>• Entrenamiento anual en seguridad</li>
                    <li>• Simulacros de phishing</li>
                    <li>• Actualizaciones sobre amenazas</li>
                    <li>• Certificaciones de seguridad</li>
                    <li>• Evaluaciones de conocimiento</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cumplimiento Normativo */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <FileText className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  5. Cumplimiento Normativo y Certificaciones
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">5.1 Estándares Internacionales</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>ISO 27001:</strong> Gestión de Seguridad de la Información</li>
                      <li>• <strong>ISO 27002:</strong> Controles de Seguridad de la Información</li>
                      <li>• <strong>PCI DSS:</strong> Estándar de Seguridad de Datos de la Industria de Tarjetas de Pago</li>
                      <li>• <strong>SOC 2 Type II:</strong> Reporte de Controles de Seguridad</li>
                      <li>• <strong>GDPR:</strong> Cumplimiento con Reglamento Europeo de Protección de Datos</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">5.2 Legislación Nacional</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Ley 19.628:</strong> Protección de la Vida Privada (Chile)</li>
                      <li>• <strong>Ley 20.575:</strong> Delitos Informáticos (Chile)</li>
                      <li>• <strong>Circular 3.500:</strong> Superintendencia de Bancos e Instituciones Financieras</li>
                      <li>• <strong>Resolución 1.386:</strong> Comisión para el Mercado Financiero</li>
                      <li>• <strong>Normas técnicas:</strong> Asociación Chilena de Seguridad</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoreo y Respuesta */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Network className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  6. Monitoreo Continuo y Respuesta a Incidentes
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">6.1 Monitoreo de Seguridad</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>SIEM (Security Information and Event Management):</strong> Agregación y correlación de logs de seguridad</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Monitoreo de Endpoints:</strong> Detección de malware y comportamientos anómalos</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Análisis de Tráfico:</strong> Detección de patrones de ataque y anomalías</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Vulnerability Assessment:</strong> Escaneos automáticos de vulnerabilidades</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray10 rounded p-4 sm:p-6">
                  <h4 className="font-semibold text-blue5 mb-3">6.2 Respuesta a Incidentes</h4>
                  <ul className="space-y-2 text-gray5">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Equipo CSIRT:</strong> Respuesta inmediata a incidentes de seguridad</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Procedimientos de Escalación:</strong> Notificación a autoridades y usuarios afectados</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Análisis Forense:</strong> Investigación detallada de incidentes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Lecciones Aprendidas:</strong> Mejora continua de procedimientos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Continuidad del Negocio */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-blue7 rounded-full p-2 mr-4">
                  <Calendar className="h-5 w-5 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue5 font-title">
                  7. Continuidad del Negocio y Recuperación
                </h3>
              </div>
              
              <div className="bg-gray10 rounded p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">7.1 Plan de Continuidad</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>RTO (Recovery Time Objective):</strong> 4 horas para servicios críticos</li>
                      <li>• <strong>RPO (Recovery Point Objective):</strong> 1 hora para pérdida de datos</li>
                      <li>• <strong>Sitios de Respaldo:</strong> Infraestructura redundante en múltiples ubicaciones</li>
                      <li>• <strong>Procedimientos de Failover:</strong> Cambio automático a sistemas de respaldo</li>
                      <li>• <strong>Comunicación de Crisis:</strong> Protocolos de comunicación con stakeholders</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue5 mb-3">7.2 Estrategias de Recuperación</h4>
                    <ul className="space-y-2 text-gray5 text-sm">
                      <li>• <strong>Backups Incrementales:</strong> Cada 4 horas para datos críticos</li>
                      <li>• <strong>Backups Completos:</strong> Diarios con retención de 30 días</li>
                      <li>• <strong>Replicación en Tiempo Real:</strong> Sincronización continua de datos</li>
                      <li>• <strong>Testing de Recuperación:</strong> Simulacros mensuales</li>
                      <li>• <strong>Documentación de Procedimientos:</strong> Manuales detallados de recuperación</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Auditorías y Evaluaciones */}
            <div className="mb-8">
              <div className="bg-blue7 rounded p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 font-title">
                  8. Auditorías de Seguridad y Evaluaciones
                </h3>
                <p className="text-blue13 mb-4">
                  INGENIT mantiene un programa continuo de auditorías y evaluaciones de seguridad para garantizar 
                  la efectividad de nuestras medidas de protección:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p><strong>Auditorías Internas:</strong></p>
                    <p>• <strong>Mensuales:</strong> Revisión de logs y alertas de seguridad</p>
                    <p>• <strong>Trimestrales:</strong> Evaluación de controles de acceso</p>
                    <p>• <strong>Semestrales:</strong> Revisión de políticas y procedimientos</p>
                    <p>• <strong>Anuales:</strong> Auditoría completa del sistema de gestión</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Auditorías Externas:</strong></p>
                    <p>• <strong>Penetration Testing:</strong> Análisis de vulnerabilidades</p>
                    <p>• <strong>Code Review:</strong> Revisión de seguridad del código</p>
                    <p>• <strong>Certificaciones:</strong> Renovación anual de estándares</p>
                    <p>• <strong>Compliance:</strong> Verificación de cumplimiento normativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disposiciones Finales */}
            <div className="border-t border-gray3 pt-8">
              <h3 className="text-lg font-semibold text-blue5 mb-3">9. Disposiciones Finales</h3>
              <div className="space-y-3 text-gray5 text-sm">
                <p>
                  <strong>Modificaciones:</strong> Esta Política de Seguridad puede ser modificada por INGENIT SpA 
                  para adaptarse a cambios en amenazas de seguridad, nuevas tecnologías o actualizaciones normativas. 
                  Las modificaciones serán notificadas con al menos 30 días de anticipación.
                </p>
                <p>
                  <strong>Contacto de Seguridad:</strong> Para reportar incidentes de seguridad, vulnerabilidades 
                  o consultas sobre esta política, puede contactarnos a través de gerencia@ingenit.cl para asuntos de protección de datos.
                </p>
                <p>
                  <strong>Reporte de Incidentes:</strong> En caso de detectar una vulnerabilidad o incidente de 
                  seguridad, por favor reporte inmediatamente a nuestro equipo de seguridad para una respuesta 
                  coordinada y efectiva.
                </p>
                <p>
                  <strong>Legislación Aplicable:</strong> Esta política se rige por la legislación chilena, 
                  estándares internacionales de seguridad y las mejores prácticas de la industria tecnológica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}