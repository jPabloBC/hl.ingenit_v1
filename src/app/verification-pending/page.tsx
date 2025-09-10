"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BaseLayout from "@/components/layout/base-layout";
import { Suspense } from "react";
import { Mail, CheckCircle, Clock, RefreshCw } from "lucide-react";

function VerificationPendingContent() {
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  const handleResendEmail = async () => {
    if (!email.trim()) {
      setResendError("Por favor ingresa tu email");
      return;
    }

    setIsResending(true);
    setResendError("");
    setResendSuccess(false);

    try {
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          name: 'Usuario' // Nombre genérico para reenvío
        }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setEmail("");
      } else {
        setResendError("Error al reenviar el email. Intenta nuevamente.");
      }
    } catch (err) {
      setResendError("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto mt-8 sm:mt-12 md:mt-16 p-4 sm:p-6 md:p-8 bg-white rounded shadow-xl border border-gray8">
      <div className="text-center">
        {/* Icono de verificación pendiente */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue5 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5}/>
        </div>

        {/* Título y mensaje principal */}
        <h1 className="text-2xl sm:text-3xl font-normal text-blue4 mb-3 sm:mb-4 font-title">
          ¡Cuenta Creada Exitosamente!
        </h1>
        
        <p className="text-gray4 mb-4 sm:mb-6 font-body text-sm sm:text-base">
          Tu cuenta ha sido creada correctamente. Ahora necesitas verificar tu dirección de email para activarla.
        </p>

        {/* Pasos a seguir */}
        <div className="bg-blue13 rounded p-4 sm:p-6 mb-6">
          <h3 className="font-semibold text-blue5 mb-3 font-title text-sm sm:text-base">Próximos pasos:</h3>
          <div className="space-y-2 text-left">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-blue8 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray4 font-body">Revisa tu bandeja de entrada</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-blue8 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray4 font-body">Haz clic en el enlace de verificación</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-blue8 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray4 font-body">Inicia sesión en tu cuenta</span>
            </div>
          </div>
        </div>

        {/* Reenviar email de verificación */}
        <div className="bg-gray10 rounded p-4 sm:p-6 mb-6">
          <h3 className="font-semibold text-blue5 mb-3 font-title text-sm sm:text-base flex items-center justify-center">
            <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5}/>
            ¿No recibiste el email?
          </h3>
          
          <div className="space-y-3">
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body lowercase text-sm sm:text-base"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full bg-blue4 hover:bg-blue6 text-white font-body text-sm sm:text-base py-2 sm:py-3"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Reenviar Email de Verificación
                </>
              )}
            </Button>

            {resendSuccess && (
              <div className="text-green-600 text-xs sm:text-sm font-body text-center">
                ✅ Email reenviado correctamente
              </div>
            )}

            {resendError && (
              <div className="text-red-600 text-xs sm:text-sm font-body text-center">
                ❌ {resendError}
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 sm:p-4 mb-6">
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-yellow-800 text-xs sm:text-sm font-body font-medium">
                Importante:
              </p>
              <p className="text-yellow-700 text-xs sm:text-sm font-body">
                El enlace de verificación expira en 24 horas. Si no lo recibes, revisa tu carpeta de spam.
              </p>
            </div>
          </div>
        </div>

        {/* Botón para ir al login */}
        <div className="space-y-3">
          <Link href="/login">
            <Button className="w-full bg-blue4 hover:bg-blue6 text-white font-body text-sm sm:text-base py-2 sm:py-3">
              Ir al Login
            </Button>
          </Link>
          
          <p className="text-base text-gray4 font-body">
            ¿Ya verificaste tu email? 
            <Link href="/login" className="text-blue5 hover:underline ml-1">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerificationPendingPage() {
  return (
    <BaseLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <VerificationPendingContent />
      </Suspense>
    </BaseLayout>
  );
}