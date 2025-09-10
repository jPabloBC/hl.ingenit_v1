"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import BaseLayout from "@/components/layout/base-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password"
    });
    setLoading(false);
    if (error) {
      setError("No se pudo enviar el correo de recuperación. ¿El correo está registrado?");
    } else {
      setInfo("Se ha enviado un correo para restablecer tu contraseña.");
    }
  }

  return (
    <BaseLayout>
      <div className="w-full max-w-md mx-auto mt-16 p-8 bg-white rounded-2xl shadow-xl border border-gray8">
        <h1 className="text-3xl font-bold text-blue1 mb-6 font-title text-center">Recuperar Contraseña</h1>
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
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
          {error && <div className="text-red-600 font-body text-sm mt-2">{error}</div>}
          {info && <div className="text-green-600 font-body text-sm mt-2">{info}</div>}
          <Button type="submit" className="w-full bg-blue8 hover:bg-blue6 text-white font-body" disabled={loading}>
            {loading ? "Enviando..." : "Enviar correo de recuperación"}
          </Button>
        </form>
        <div className="text-center mt-4">
          <Link href="/login">
            <span className="text-blue8 hover:underline font-body cursor-pointer">Volver a Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </BaseLayout>
  );
}