"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Header from "./header";
import Footer from "./footer";

interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function BaseLayout({ children, className = "" }: BaseLayoutProps) {
  const pathname = usePathname();
  const isOnboarding = pathname === '/onboarding';

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header del Onboarding - Estático */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo INGENIT */}
              <div className="flex items-center">
                <Image
                  src="/assets/icon_ingenIT.png"
                  alt="INGENIT Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </div>
              
              {/* Indicador de progreso */}
              <div className="text-3xl text-gray8 font-body">
                Configuración
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal centrado con padding-top para el header fijo */}
        <main className="flex items-center justify-center min-h-screen px-4 py-16 pt-24 w-full">
          {children}
        </main>

        {/* Footer del Onboarding */}
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">

              </div>
              <p className="text-sm text-gray-400 font-body">
                © 2024 INGENIT - Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray9 font-body ${className}`}>
      <Header />
      <main className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}