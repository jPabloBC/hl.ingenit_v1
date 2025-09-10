"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BaseLayout from "@/components/layout/base-layout";
import { Suspense } from "react";
import { Clock, Star, Shield, AlertCircle } from "lucide-react";
import { usePlanSelection } from "@/hooks/usePlanSelection";

function RegisterContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+56");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedPlan, loading: planLoading } = usePlanSelection();

  useEffect(() => {
    // Verificar que se haya seleccionado un plan
    if (!planLoading && !selectedPlan) {
      setError("Debes seleccionar un plan antes de registrarte. Redirigiendo...");
      setTimeout(() => {
        router.push('/pricing');
      }, 3000);
    }
  }, [selectedPlan, planLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setError("El nombre completo es requerido");
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError("El teléfono es requerido");
      setLoading(false);
      return;
    }

    // Validar formato del teléfono según el código de país
    const phoneNumber = phone.trim();
    let isValidPhone = false;
    
    switch (countryCode) {
      case '+56': // Chile
        isValidPhone = /^[9][0-9]{8}$/.test(phoneNumber);
        if (!isValidPhone) {
          setError("Teléfono chileno debe ser 9 dígitos comenzando con 9");
          setLoading(false);
          return;
        }
        break;
      case '+54': // Argentina
        isValidPhone = /^[0-9]{10,11}$/.test(phoneNumber);
        if (!isValidPhone) {
          setError("Teléfono argentino debe ser 10-11 dígitos");
          setLoading(false);
          return;
        }
        break;
      case '+57': // Colombia
        isValidPhone = /^[0-9]{10}$/.test(phoneNumber);
        if (!isValidPhone) {
          setError("Teléfono colombiano debe ser 10 dígitos");
          setLoading(false);
          return;
        }
        break;
      case '+51': // Perú
        isValidPhone = /^[0-9]{9}$/.test(phoneNumber);
        if (!isValidPhone) {
          setError("Teléfono peruano debe ser 9 dígitos");
          setLoading(false);
          return;
        }
        break;
      default:
        isValidPhone = phoneNumber.length >= 7 && phoneNumber.length <= 15;
        if (!isValidPhone) {
          setError("Teléfono debe tener entre 7 y 15 dígitos");
          setLoading(false);
          return;
        }
    }

    try {
      // Verificar que se haya seleccionado un plan
      if (!selectedPlan) {
        setError("Debes seleccionar un plan antes de registrarte");
        setLoading(false);
        return;
      }

      // Registrar usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Crear registro del usuario en hl_user
        const { error: userError } = await supabase
          .from('hl_user')
          .insert({
            id: authData.user.id,
            name: name.trim(),
            email: email.toLowerCase(),
            phone: `${countryCode}${phone.trim()}`,
            password_hash: '', // Se maneja por Supabase Auth
            status: 'active',
            email_verified: false,
            email_verification_token: '',
            role: 'customer', // Mantener para compatibilidad
            role_id: '02899044-3aae-4325-8eda-a3340fb1d85c', // ID del rol owner
            is_owner: true, // Marcar como owner
            created_at: new Date().toISOString()
          });

        if (userError) {
          throw userError;
        }

        // Esperar un momento para que se establezca la sesión
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Obtener la sesión actual para el token
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Sesión obtenida:', session ? 'Sí' : 'No');
        console.log('🔍 Token disponible:', session?.access_token ? 'Sí' : 'No');
        console.log('🔍 Plan seleccionado:', selectedPlan);
        console.log('🔍 Plan ID a enviar:', selectedPlan?.planId);
        
        // Crear suscripción con el plan seleccionado
        try {
          const subscriptionResponse = await fetch('/api/subscriptions/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token && {
                'Authorization': `Bearer ${session.access_token}`
              })
            },
            body: JSON.stringify({
              planId: selectedPlan.planId
            })
          });

          if (subscriptionResponse.ok) {
            console.log('✅ Suscripción creada exitosamente durante el registro');
          } else {
            console.error('❌ Error HTTP:', subscriptionResponse.status, subscriptionResponse.statusText);
            try {
              const errorData = await subscriptionResponse.json();
              console.error('❌ Error creando suscripción:', errorData);
            } catch (jsonError) {
              console.error('❌ Error parseando respuesta JSON:', jsonError);
              const textResponse = await subscriptionResponse.text();
              console.error('❌ Respuesta de texto:', textResponse);
            }
            // No fallar el registro por error de suscripción
          }
        } catch (subscriptionError) {
          console.error('❌ Error creando suscripción:', subscriptionError);
          // No fallar el registro por error de suscripción
        }

        // Enviar email de verificación
        try {
          const response = await fetch('/api/send-verification-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.toLowerCase(),
              name: name.trim()
            }),
          });

          if (!response.ok) {
            console.warn('No se pudo enviar el email de verificación');
          }
        } catch (emailError) {
          console.warn('Error enviando email de verificación:', emailError);
        }

        setSuccess(true);
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          router.push('/verification-pending');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
        setError("Este email ya está registrado. Por favor, inicia sesión o usa un email diferente.");
      } else if (err.message?.includes('Invalid email')) {
        setError("El formato del email no es válido.");
      } else if (err.message?.includes('Password')) {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(`Error: ${err.message || 'Error inesperado durante el registro'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded shadow-xl border border-gray8 p-6 sm:p-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-blue5 mb-3 sm:mb-4 font-title">¡Usuario Registrado!</h2>
              <p className="text-gray4 mb-4 sm:mb-6 font-body text-sm sm:text-base">
                Tu cuenta de usuario ha sido creada correctamente. Te hemos enviado un email de verificación.
              </p>
              <p className="text-xs sm:text-sm text-blue8 font-body">
                Redirigiendo a la página de verificación pendiente...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4 font-body">Cargando información del plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado Izquierdo - Formulario de Registro */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-xl">
          {/* Plan Seleccionado */}
          {selectedPlan && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 mb-8 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-600 rounded-full p-2 mr-3">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 font-title">Plan Seleccionado</h3>
                    <p className="text-sm text-blue-600 font-body">Tu plan de suscripción</p>
                  </div>
                </div>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ACTIVO
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="text-xl font-bold text-gray-800 mb-2 font-title">
                  {selectedPlan.planName}
                </h4>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>
                      {selectedPlan.limits.maxRooms === -1 
                        ? 'Habitaciones: Ilimitadas' 
                        : `Hasta ${selectedPlan.limits.maxRooms} habitaciones`
                      }
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Precio mensual:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedPlan.limits.price === 0 
                        ? 'Contactar' 
                        : `$${selectedPlan.limits.price.toLocaleString()} ${selectedPlan.limits.currency}`
                      }
                    </span>
                  </div>
                  {selectedPlan.limits.price > 0 && (
                    <p className="text-base text-gray-500 mt-1 text-right">
                      + IVA
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded shadow-xl border border-gray8 p-4 sm:p-6 lg:p-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray7 mb-4 sm:mb-6 font-title text-center">Crear Cuenta</h1>
            
            <form className="space-y-3 sm:space-y-4 lg:space-y-6" onSubmit={handleRegister} autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-blue5 mb-1 sm:mb-2 font-title">Nombre Completo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body capitalize text-sm sm:text-base"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue5 mb-1 sm:mb-2 font-title">Teléfono</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body bg-white text-sm sm:text-base"
                  >
                    <option value="+56">🇨🇱 +56</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+595">🇵🇾 +595</option>
                    <option value="+598">🇺🇾 +598</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+34">🇪🇸 +34</option>
                  </select>
                  <input
                    type="tel"
                    className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body text-sm sm:text-base"
                    placeholder={countryCode === '+56' ? '9 1234 5678' : 'Número local'}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue5 mb-1 sm:mb-2 font-title">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body lowercase text-sm sm:text-base"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value.toLowerCase())}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue5 mb-1 sm:mb-2 font-title">Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body text-sm sm:text-base"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue5 mb-1 sm:mb-2 font-title">Confirmar Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body text-sm sm:text-base"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 font-body text-xs sm:text-sm mt-2 text-center">
                  {error}
                  {error.includes('ya está registrado') && (
                    <div className="mt-2">
                      <a href="/login" className="text-blue8 hover:underline font-body cursor-pointer text-xs sm:text-sm">
                        Ir al Login
                      </a>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue6 hover:bg-blue4 text-white font-body text-sm sm:text-base py-2 sm:py-3" disabled={loading}>
                {loading ? "Registrando..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="text-center mt-4 sm:mt-6">
              <span className="text-gray4 font-body text-sm sm:text-base">¿Ya tienes cuenta?</span>{" "}
              <a href="/login" className="text-blue8 hover:underline font-body cursor-pointer text-sm sm:text-base">
                Iniciar Sesión
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Disclaimers y Beneficios */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue5 to-blue6 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 rounded">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg text-blue11 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-normal mb-6 sm:mb-8 font-title">¡Únete a INGENIT!</h2>
          
          {/* Disclaimers */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Servicio Gratuito por 14 días */}
            <div className="bg-white/10 rounded p-3 sm:p-4 lg:p-5 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gold4 flex-shrink-0 mx-auto sm:mx-0 sm:mt-0.5" strokeWidth={1} />
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Prueba Gratuita de 14 Días</h3>
                  <p className="text-xs sm:text-sm text-gray9 leading-relaxed">
                    Accede a todas las funcionalidades sin compromiso. Sin tarjeta de crédito requerida.
                  </p>
                </div>
              </div>
            </div>

            {/* Precio de Suscripción Inicial */}
            <div className="bg-white/10 rounded p-3 sm:p-4 lg:p-5 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-gold4 flex-shrink-0 mx-auto sm:mx-0 sm:mt-0.5" strokeWidth={1} />
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Precio Especial por 6 Meses</h3>
                  <p className="text-xs sm:text-sm text-gray9 leading-relaxed">
                    Después de la prueba gratuita, disfruta de un precio especial de $10.000 + IVA/mes durante los primeros 6 meses.
                  </p>
                </div>
              </div>
            </div>

            {/* Garantía */}
            <div className="bg-white/10 rounded p-3 sm:p-4 lg:p-5 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-gold4 flex-shrink-0 mx-auto sm:mx-0 sm:mt-0.5" strokeWidth={1} />
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Cancelación en Cualquier Momento</h3>
                  <p className="text-xs sm:text-sm text-gray9 leading-relaxed">
                    Sin contratos a largo plazo. Cancela tu suscripción cuando quieras sin penalizaciones.
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficios Adicionales */}
            <div className="bg-white/10 rounded p-3 sm:p-4 lg:p-5 border border-white/20">
              <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Beneficios Incluidos</h3>
              <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Soporte técnico 24/7</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Actualizaciones automáticas</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Backup automático de datos</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Integración con Webpay</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray9">
              ¿Tienes dudas? <a href="/contact" className="text-gold4 hover:underline">Contáctanos</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <BaseLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterContent />
      </Suspense>
    </BaseLayout>
  );
}