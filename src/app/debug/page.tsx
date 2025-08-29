"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import BaseLayout from "@/components/layout/base-layout";

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    async function getDebugInfo() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Get debug info
        const info = {
          nodeEnv: process.env.NODE_ENV,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        };

        setDebugInfo(info);
      } catch (error) {
        console.error('Debug error:', error);
      } finally {
        setLoading(false);
      }
    }

    getDebugInfo();
  }, []);

  if (loading) {
    return (
      <BaseLayout>
        <div className="w-full max-w-4xl mx-auto mt-16 p-8">
          <h1 className="text-2xl font-bold mb-4">Cargando información de debug...</h1>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="w-full max-w-4xl mx-auto mt-16 p-8">
        <h1 className="text-3xl font-bold text-blue1 mb-6 font-title">
          Información de Debug
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Información del Usuario</h2>
            {user ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Email Confirmado:</strong> {user.email_confirmed_at ? 'Sí' : 'No'}</p>
                <p><strong>Creado:</strong> {new Date(user.created_at).toLocaleString()}</p>
                <p><strong>Último Login:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca'}</p>
              </div>
            ) : (
              <p className="text-gray-600">No hay usuario autenticado</p>
            )}
          </div>

          {/* Environment Info */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Información del Entorno</h2>
            <div className="space-y-2">
              <p><strong>NODE_ENV:</strong> {debugInfo.nodeEnv}</p>
              <p><strong>Supabase URL:</strong> {debugInfo.supabaseUrl ? 'Configurado' : 'No configurado'}</p>
              <p><strong>Anon Key:</strong> {debugInfo.hasAnonKey ? 'Configurado' : 'No configurado'}</p>
              <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
            </div>
          </div>

          {/* Email Verification Status */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Estado de Verificación</h2>
            <div className="space-y-2">
              <p><strong>Verificación Requerida:</strong> {debugInfo.nodeEnv === 'production' ? 'Sí' : 'No (Desarrollo)'}</p>
              <p><strong>Usuario Verificado:</strong> {user?.email_confirmed_at ? 'Sí' : 'No'}</p>
              <p><strong>Puede Hacer Login:</strong> {user?.email_confirmed_at || debugInfo.nodeEnv !== 'production' ? 'Sí' : 'No'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Acciones</h2>
            <div className="space-y-2">
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
