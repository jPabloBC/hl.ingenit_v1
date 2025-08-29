"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import BaseLayout from "@/components/layout/base-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
    } else {
      setInfo("¡Contraseña actualizada! Ahora puedes iniciar sesión.");
    }
  }

  return (
    <BaseLayout>
      <div className="w-full max-w-md mx-auto mt-16 p-8 bg-white rounded-2xl shadow-xl border border-gray8">
        <h1 className="text-3xl font-bold text-blue1 mb-6 font-title text-center">Restablecer Contraseña</h1>
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">Nueva Contraseña</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
              placeholder="Nueva contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">Repetir Contraseña</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
              placeholder="Repite la contraseña"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-600 font-body text-sm mt-2">{error}</div>}
          {info && <div className="text-green-600 font-body text-sm mt-2">{info}</div>}
          <Button type="submit" className="w-full bg-blue8 hover:bg-blue6 text-white font-body" disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
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
