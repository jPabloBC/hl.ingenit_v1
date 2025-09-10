"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Star, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import PaymentModal from "./PaymentModal";

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  planDetails?: {
    name: string;
    maxRooms: number;
    price: string;
  };
}

export default function TrialExpiredModal({ isOpen, onClose, planName, planDetails }: TrialExpiredModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    // El pago fue exitoso, recargar la página para actualizar el estado
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      // Cerrar sesión
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => e.preventDefault()}
      >
        <div 
          className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Período de Prueba Expirado
            </h2>
            
            <p className="text-gray-600 mb-6">
              Tu período de prueba de 14 días ha terminado. Para continuar usando la plataforma, 
              necesitas actualizar a un plan de suscripción.
            </p>
            
            {planDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Plan Actual: {planDetails.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>
                    <span className="font-medium">Habitaciones:</span> {planDetails.maxRooms === -1 ? 'Ilimitadas' : planDetails.maxRooms}
                  </div>
                  <div>
                    <span className="font-medium">Precio:</span> {planDetails.price}/mes
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex-1"
              >
                Cerrar Sesión
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
