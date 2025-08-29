"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import BaseLayout from "@/components/layout/base-layout";
import { Button } from "@/components/ui/button";
import ResendActivation from "./resend";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending"|"success"|"error">("pending");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no proporcionado.");
      return;
    }
    
    // Verificación directa desde el cliente como fallback
    async function verifyDirectly() {
      try {
        console.log('Verificando token directamente:', token);
        
        const { supabase } = await import('@/lib/supabase');
        
        const { data: users, error } = await supabase
          .from('hl_user')
          .select('*')
          .eq('email_verification_token', token);
        
        console.log('Resultado búsqueda:', { users, error });
        
        if (error) {
          setStatus("error");
          setMessage("Error de base de datos al verificar el correo.");
          return;
        }
        
        if (!users || users.length === 0) {
          setStatus("error");
          setMessage("Token no válido o expirado.");
          return;
        }
        
        const user = users[0];
        console.log('Usuario encontrado:', user.email);
        
        const { error: updateError } = await supabase
          .from('hl_user')
          .update({ 
            email_verified: true, 
            email_verification_token: null 
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.log('Error actualización:', updateError);
          setStatus("error");
          setMessage("Error al actualizar el estado de verificación.");
          return;
        }
        
        console.log('¡Usuario verificado exitosamente!');
        setStatus("success");
        setMessage("¡Correo verificado exitosamente! Ya puedes iniciar sesión.");
        setCountdown(5); // Iniciar countdown
        
      } catch (err) {
        console.error('Error en verificación directa:', err);
        setStatus("error");
        setMessage("Error inesperado al verificar el correo.");
      }
    }
    
    verifyDirectly();
  }, [token]);

  // Countdown y redirección automática cuando hay éxito
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (status === "success" && countdown === 0) {
      router.push('/login');
    }
  }, [status, countdown, router]);

  return (
    <BaseLayout>
      <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold text-blue1 mb-6 font-title text-center">Verificación de Correo</h1>
        {status === "pending" && (
          <div className="text-blue8 font-body text-base text-center bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 shadow-sm w-full">Verificando...</div>
        )}
        {status === "success" && (
          <div className="text-green-700 font-body text-base text-center bg-green-50 border border-green-200 rounded-lg px-6 py-4 shadow-sm w-full mb-4">
            <div>{message}</div>
            <div className="mt-2 text-sm text-green-600">
              Redirigiendo al login en {countdown} segundos...
            </div>
          </div>
        )}
        {status === "error" && (
          <>
            <div className="text-red-700 font-body text-base text-center bg-red-50 border border-red-200 rounded-lg px-6 py-4 shadow-sm w-full mb-4">{message}</div>
            {showResend && (
              <div className="w-full max-w-xs mx-auto mt-2">
                <label className="block text-sm font-medium text-blue1 mb-2 font-title text-center">Correo electrónico</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body lowercase text-center"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
                <ResendActivation email={email} />
              </div>
            )}
          </>
        )}
        <Link href="/login">
          <Button className="mt-6 bg-blue8 hover:bg-blue6 text-white font-body w-full">Ir a Iniciar Sesión</Button>
        </Link>
      </div>
    </BaseLayout>
  );
}
