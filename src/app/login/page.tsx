"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BaseLayout from "@/components/layout/base-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "";

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
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

      // Determinar la ruta de redirección basada en el tipo de negocio
      let redirectPath = "/business-type"; // Ruta por defecto
      
      if (businessData?.business_type === 'hotel') {
        redirectPath = "/business-type/hotel";
      } else if (businessData?.business_type === 'restaurant') {
        redirectPath = "/business-type/restaurant";
      } else if (type) {
        // Si no hay business_type pero hay un tipo en la URL, usar ese
        redirectPath = `/business-type/${type}`;
      }

      // Redirige al dashboard correspondiente
      router.push(redirectPath);
      
    } catch (err) {
      console.error('Login error:', err);
      setError("Error inesperado durante el inicio de sesión. Por favor, intenta nuevamente.");
      setLoading(false);
    }
  }

  return (
    <BaseLayout>
      <div className="w-full max-w-md mx-auto mt-16 p-8 bg-white rounded-2xl shadow-xl border border-gray8">
        <h1 className="text-3xl font-bold text-blue1 mb-6 font-title text-center">Iniciar Sesión</h1>
        {type && (
          <div className="mb-4 text-center text-blue8 font-semibold font-body">
            Tipo de negocio seleccionado: {type === 'hotel' ? 'Hotel/Hospedaje' : type === 'restaurant' ? 'Restaurante/Bar' : type}
          </div>
        )}
  <form className="space-y-6" onSubmit={handleLogin} autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body lowercase"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value.toLowerCase())}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">Contraseña</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
              placeholder="Tu contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-600 font-body text-sm mt-2 text-center">
              {error}
              {error.includes('no está registrado') && (
                <div className="mt-2">
                  <Link href="/register">
                    <span className="text-blue8 hover:underline font-body cursor-pointer">Crear cuenta</span>
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
          <Button type="submit" className="w-full bg-blue8 hover:bg-blue6 text-white font-body" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
        <div className="text-center mt-4">
          <span className="text-gray4 font-body">¿No tienes cuenta?</span>{" "}
          <Link href="/register">
            <span className="text-blue8 hover:underline font-body cursor-pointer">Regístrate</span>
          </Link>
        </div>
      </div>
    </BaseLayout>
  );
}
