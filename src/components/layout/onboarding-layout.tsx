"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    // Verificar que el usuario esté autenticado
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue15 via-white to-blue10">
      {/* Solo logo minimalista en la esquina superior */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue8 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">I</span>
          </div>
          <span className="ml-2 text-lg font-semibold text-blue1 font-title">INGENIT</span>
        </div>
      </div>

      {/* Contenido principal centrado */}
      <main className="flex items-center justify-center min-h-screen px-4">
        {children}
      </main>
    </div>
  );
}