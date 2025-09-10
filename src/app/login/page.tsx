"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BaseLayout from "@/components/layout/base-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Star, Clock, Shield } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "";
  
  // Detectar si viene de PIN de empleado
  const employeeId = searchParams.get("employee_id");
  const employeeName = searchParams.get("employee_name");
  const employeeRole = searchParams.get("role");
  const isEmployeeLogin = !!employeeId;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(isEmployeeLogin ? `empleado.${employeeId}@hotel.local` : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);

        async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Si es login de empleado, usar flujo simplificado
      if (isEmployeeLogin) {
        // Crear sesión temporal del empleado sin autenticación
        localStorage.setItem('employee_session', JSON.stringify({
          employee_id: employeeId,
          name: employeeName,
          role: employeeRole,
          business_id: 'temp', // Se obtendrá del contexto
          permissions: [], // Se cargarán después
          expires_at: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
        }));
        
        router.push('/hotel?employee_access=true');
        return;
      }
      // Verificar si el email existe en nuestra tabla personalizada y obtener información del negocio
      const { data: userRows, error: userFetchError } = await supabase
        .from('hl_user')
        .select('id, email_verified')
        .eq('email', email)
        .single();
        
      if (userFetchError || !userRows) {
        setLoading(false);
        setError("El correo no está registrado. ¿Deseas crear una cuenta?");
        return;
      }

      // Verificar si el email está verificado en nuestra tabla
      if (!userRows.email_verified) {
        setError("Debes validar tu correo antes de acceder. Revisa tu email y haz clic en el enlace de verificación.");
        setLoading(false);
        return;
      }

      // Intentar login con Supabase Auth
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      setLoading(false);
      
      if (loginError || !data?.user) {
        setFailCount(failCount + 1);
        if (failCount + 1 >= 3) {
          setError("Demasiados intentos fallidos. ¿Olvidaste tu contraseña?");
        } else {
          setError("Email o contraseña incorrectos");
        }
        return;
      }

      // Obtener información del negocio para determinar el tipo
      const { data: businessData } = await supabase
        .from('hl_business')
        .select('business_type')
        .eq('user_id', data.user.id)
        .single();

      // Determinar la ruta de redirección
      if (businessData?.business_type) {
        // Usuario ya tiene negocio configurado, redirigir al dashboard
        let redirectPath = "/hotel";
        
        if (businessData.business_type === 'hotel') {
                      redirectPath = "/hotel";
        } else {
                      redirectPath = `/hotel`; // Por defecto hoteles
        }
        
        router.push(redirectPath);
      } else {
        // Usuario nuevo, redirigir al onboarding
        router.push('/onboarding');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError("Error inesperado durante el inicio de sesión. Por favor, intenta nuevamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado Izquierdo - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-sm sm:max-w-lg lg:max-w-xl">
          <div className="bg-white rounded shadow-xl border border-gray8 p-4 sm:p-6 lg:p-8">
            {isEmployeeLogin ? (
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray7 mb-4 font-title text-center">Acceso Empleado</h1>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">✅ PIN Validado</h3>
                  <p className="text-blue-800 font-medium">{employeeName}</p>
                  <p className="text-blue-700 text-sm">{employeeRole}</p>
                  <p className="text-green-700 text-sm mt-2">Presiona "Ingresar" para acceder</p>
                </div>
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray7 mb-4 sm:mb-6 font-title text-center">Iniciar Sesión</h1>
            )}
            
            {type && !isEmployeeLogin && (
              <div className="mb-4 text-center text-blue8 font-semibold font-body text-sm sm:text-base">
                Tipo de negocio seleccionado: Hotel/Hospedaje
              </div>
            )}
            
            <form className="space-y-3 sm:space-y-4 lg:space-y-6" onSubmit={handleLogin} autoComplete="off">
              {!isEmployeeLogin && (
                <>
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
                  <div>
                    <label className="block text-sm font-medium text-blue5 mb-1 sm:mb-2 font-title">Contraseña</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body text-sm sm:text-base"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              
              {error && (
                <div className="text-red-600 font-body text-sm mt-2 text-center">
                  {error}
                  {error.includes('no está registrado') && (
                    <div className="mt-2">
                      <Link href="/pricing">
                        <span className="text-blue8 hover:underline font-body cursor-pointer">Elegir plan</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              {failCount >= 3 && (
                <div className="text-center mt-2">
                  <Link href="/forgot-password">
                    <span className="text-blue8 hover:underline font-body cursor-pointer">Recuperar contraseña</span>
                  </Link>
                </div>
              )}
              
              <Button type="submit" className="w-full bg-blue6 hover:bg-blue4 text-white font-body text-sm sm:text-base py-2 sm:py-3" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
            
            <div className="text-center mt-4 sm:mt-6">
              <span className="text-gray4 font-body text-sm sm:text-base">¿No tienes cuenta?</span>{" "}
              <Link href="/pricing">
                <span className="text-blue8 hover:underline font-body cursor-pointer text-sm sm:text-base">Elegir plan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Mensaje de Bienvenida */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue5 to-blue6 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 rounded">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg text-blue11 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-nornal mb-6 sm:mb-8 font-title">¡Bienvenido!</h2>
          
          <div className="space-y-4 sm:space-y-6 lg:space-y-6">
            {/* Mensaje de Bienvenida */}
            <div className="bg-white/10 rounded p-4 sm:p-5 lg:p-6 border border-white/20">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gold4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">Accede a tu Dashboard</h3>
              <p className="text-xs sm:text-sm text-gray9 leading-relaxed">
                Gestiona tu hotel, reservas, habitaciones y más desde tu panel personalizado.
              </p>
            </div>

            {/* Características del Sistema */}
            <div className="bg-white/10 rounded p-4 sm:p-5 lg:p-6 border border-white/20">
              <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">¿Qué puedes hacer?</h3>
              <div className="space-y-2 sm:space-y-3 text-left">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Gestionar habitaciones y disponibilidad</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Ver reservas y check-ins</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Administrar precios y tarifas</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold4 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray9">Generar reportes y estadísticas</span>
                </div>
              </div>
            </div>

            {/* Enlace a Registro */}
            <div className="bg-white/10 rounded p-4 sm:p-5 lg:p-6 border border-white/20">
              <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">¿No tienes cuenta?</h3>
              <p className="text-xs sm:text-sm text-gray9 mb-3 sm:mb-4">
                Únete a INGENIT y transforma la gestión de tu hotel.
              </p>
              <Link href="/pricing" className="inline-block">
                <div className="bg-white text-blue6 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray10 transition-colors duration-300 text-sm sm:text-base">
                  Elegir Plan
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <BaseLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </BaseLayout>
  );
}