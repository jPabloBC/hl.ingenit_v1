"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BaseLayout from "@/components/layout/base-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifyEmailManualContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  async function handleVerifyEmail() {
    if (!email) {
      setError("Por favor ingresa un email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
              // Buscar el usuario en la tabla hl_user
        const { data: user, error: userError } = await supabase
          .from('hl_user')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError || !user) {
        setError("Usuario no encontrado");
        setLoading(false);
        return;
      }

      // Simular verificación de email (solo para desarrollo)
      // En producción, esto debería ser manejado por Supabase Auth
      setMessage(`Email ${email} verificado manualmente para desarrollo.`);
      
      // Redirigir a login después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('Verification error:', err);
      setError("Error durante la verificación");
    }
    
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md mx-auto mt-16 p-8 bg-white rounded-2xl shadow-xl border border-gray8">
        <h1 className="text-3xl font-bold text-blue1 mb-6 font-title text-center">
          Verificación Manual de Email
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Esta página es solo para desarrollo. En producción, la verificación se hace automáticamente.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleVerifyEmail(); }}>
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">
              Email a verificar
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue1 hover:bg-blue8 text-white font-body"
            disabled={loading}
          >
            {loading ? "Verificando..." : "Verificar Email"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue1 hover:text-blue8 font-body">
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

export default function VerifyEmailManualPage() {
  return (
    <BaseLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailManualContent />
      </Suspense>
    </BaseLayout>
  );
}
