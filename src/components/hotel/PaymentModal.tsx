"use client";

import { useState, useEffect, useRef } from "react";
import { X, CreditCard, CheckCircle, Star, Clock, Users, Building2, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { formatCLP } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import BankTransferModal from "./BankTransferModal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  maxRooms: number;
  maxUsers: number;
  features: string[];
  popular?: boolean;
  icon: any;
  color: string;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Hoteles Pequeños',
    description: 'Perfecto para hoteles pequeños y hostales',
    price: 9990,
    currency: 'CLP',
    maxRooms: 20,
    maxUsers: 5,
    features: [
      'Hasta 20 habitaciones',
      'Hasta 5 usuarios',
      'Gestión básica de reservas',
      'Reportes básicos',
      'Soporte por email'
    ],
    icon: Building2,
    color: 'bg-blue-500'
  },
  {
    id: 'professional',
    name: 'Hoteles Medianos',
    description: 'Ideal para hoteles medianos con más funcionalidades',
    price: 19990,
    currency: 'CLP',
    maxRooms: 50,
    maxUsers: 10,
    features: [
      'Hasta 50 habitaciones',
      'Hasta 10 usuarios',
      'Channel Manager integrado',
      'Multi-usuario avanzado',
      'Reportes ejecutivos',
      'Housekeeping avanzado',
      'API para integraciones',
      'Soporte prioritario 24/7'
    ],
    popular: true,
    icon: Star,
    color: 'bg-purple-500'
  },
  {
    id: 'business',
    name: 'Hoteles Grandes',
    description: 'Para hoteles grandes con necesidades empresariales',
    price: 29990,
    currency: 'CLP',
    maxRooms: 80,
    maxUsers: 20,
    features: [
      'Hasta 80 habitaciones',
      'Hasta 20 usuarios',
      'Todas las funcionalidades Professional',
      'Integraciones avanzadas',
      'Reportes personalizados',
      'Soporte dedicado',
      'Capacitación incluida'
    ],
    icon: Zap,
    color: 'bg-orange-500'
  },
  {
    id: 'enterprise',
    name: 'Hoteles Enterprise',
    description: 'Solución completa para cadenas hoteleras',
    price: 49990,
    currency: 'CLP',
    maxRooms: -1,
    maxUsers: -1,
    features: [
      'Habitaciones ilimitadas',
      'Usuarios ilimitados',
      'Multi-propiedad',
      'API completa',
      'Integraciones personalizadas',
      'Soporte 24/7 dedicado',
      'Capacitación premium',
      'SLA garantizado'
    ],
    icon: Users,
    color: 'bg-green-500'
  }
];

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const { subscription, limits, reload } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'webpay' | 'transfer'>('webpay');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [paymentMessage, setPaymentMessage] = useState<string>('');
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const searchParams = useSearchParams();
  const processedParamsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && subscription) {
      // Seleccionar el plan actual como predeterminado
      const currentPlan = plans.find(plan => plan.id === subscription.plan_id);
      if (currentPlan) {
        setSelectedPlan(currentPlan);
      }
    } else if (!isOpen) {
      // Limpiar el ref cuando se cierre el modal
      processedParamsRef.current.clear();
      setPaymentStatus('idle');
      setPaymentMessage('');
    }
  }, [isOpen, subscription]);

  // Obtener email del usuario
  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  // Manejar parámetros de URL para mostrar mensajes de pago
  useEffect(() => {
    const payment = searchParams.get('payment');
    const message = searchParams.get('message');
    const plan = searchParams.get('plan');
    
    // Si no hay parámetros de pago, no hacer nada
    if (!payment) {
      return;
    }
    
    // Crear una clave única para estos parámetros
    const paramsKey = `${payment}-${message}-${plan}`;
    
    // Si ya procesamos estos parámetros, no hacer nada
    if (processedParamsRef.current.has(paramsKey)) {
      return;
    }

    // Marcar como procesado ANTES de procesar
    processedParamsRef.current.add(paramsKey);

    if (payment === 'success') {
      setPaymentStatus('success');
      setPaymentMessage(`¡Pago exitoso! Tu plan ${plan} ha sido activado.`);
      
      // Limpiar parámetros de URL INMEDIATAMENTE
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('message');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
      
      // Luego recargar y ejecutar callback
      setTimeout(() => {
        reload();
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }, 100);
      
    } else if (payment === 'error') {
      setPaymentStatus('error');
      setPaymentMessage(message || 'Error en el pago. Por favor, inténtalo de nuevo.');
      
      // Limpiar parámetros de URL INMEDIATAMENTE
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('message');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, reload, onPaymentSuccess]);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    if (paymentMethod === 'transfer') {
      // Mostrar modal de transferencia bancaria
      setShowBankTransferModal(true);
      return;
    }

    setLoading(true);
    try {
      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Token completo:', session?.access_token);
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      // Inicializar pago con Webpay
      const response = await fetch('/api/webpay/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount: selectedPlan.price,
          currency: selectedPlan.currency
        })
      });

      const data = await response.json();
      console.log('🔍 API Response:', { status: response.status, data });

      if (!response.ok) {
        console.error('❌ API Error:', data);
        console.error('❌ Full Error Details:', data.fullError);
        throw new Error(data.error || 'Error al inicializar el pago');
      }

      // Redirigir a Webpay
      if (data.token && data.url) {
        // Crear formulario para redirigir a Webpay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.url;
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token_ws';
        tokenInput.value = data.token;
        
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error('No se recibió token de Webpay');
      }

    } catch (error) {
      console.error('Error en el pago:', error);
      alert(`Error al procesar el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanIndex = () => {
    if (!subscription) return -1;
    return plans.findIndex(plan => plan.id === subscription.plan_id);
  };

  const canUpgradeTo = (planIndex: number) => {
    const currentIndex = getCurrentPlanIndex();
    return planIndex > currentIndex;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Actualizar Plan de Suscripción</h2>
            <p className="text-gray-600 mt-1">Elige el plan que mejor se adapte a tu hotel</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Payment Status Messages */}
        {paymentStatus === 'success' && (
          <div className="p-6 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">{paymentMessage}</p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="text-red-800 font-medium">{paymentMessage}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setPaymentStatus('idle');
                  setPaymentMessage('');
                }}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Current Plan Status */}
        {subscription && (
          <div className="p-6 bg-gray10 border-b border-gray-300">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue7 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800">
                  Plan Actual: {subscription.plan_name}
                </h3>
                <p className="text-xs text-gray-600">
                  {subscription.status === 'trial' ? 'Período de prueba' : 'Suscripción activa'}
                  {subscription.trial_days_remaining && subscription.trial_days_remaining > 0 && (
                    <> - {subscription.trial_days_remaining} días restantes</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const isCurrentPlan = subscription?.plan_id === plan.id;
              const canUpgrade = canUpgradeTo(index);
              const isSelected = selectedPlan?.id === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all shadow-sm ${
                    isSelected
                      ? 'border-blue7 bg-gray10'
                      : isCurrentPlan
                      ? 'border-green-500 bg-green-50'
                      : canUpgrade
                      ? 'border-gray-300 hover:border-blue7 hover:shadow-lg bg-gray-50'
                      : 'border-gray-300 bg-gray-100 opacity-60'
                  }`}
                  onClick={() => canUpgrade && setSelectedPlan(plan)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue8 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Más Popular
                      </span>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Plan Actual
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue7 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <plan.icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-800">
                        {formatCLP(plan.price)}
                      </span>
                      <span className="text-gray-600">/mes</span>
                    </div>

                    <div className="space-y-2 mb-6 bg-white bg-opacity-80 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center text-sm text-gray-700">
                        <Building2 className="h-4 w-4 mr-2 text-blue7" />
                        {plan.maxRooms === -1 ? 'Habitaciones ilimitadas' : `Hasta ${plan.maxRooms} habitaciones`}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="h-4 w-4 mr-2 text-blue7" />
                        {plan.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${plan.maxUsers} usuarios`}
                      </div>
                    </div>

                    {isCurrentPlan ? (
                      <div className="flex items-center justify-center text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Plan Actual
                      </div>
                    ) : canUpgrade ? (
                      <Button
                        className={`w-full ${isSelected ? 'bg-blue7 hover:bg-blue7' : 'bg-gray-600 hover:bg-gray-700'} shadow-md transition-all duration-200`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
                        }}
                      >
                        {isSelected ? 'Seleccionado' : 'Seleccionar'}
                      </Button>
                    ) : (
                      <div className="text-gray-500 text-sm bg-gray-100 rounded px-3 py-2">
                        Plan inferior
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Selection */}
        {selectedPlan && (
          <div className="p-6 border-t border-gray-300 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Método de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all shadow-sm ${
                  paymentMethod === 'webpay'
                    ? 'border-blue7 bg-gray10'
                    : 'border-gray-300 hover:border-blue7 bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('webpay')}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue7 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Webpay Plus</h4>
                    <p className="text-sm text-gray-600">Tarjeta de crédito o débito</p>
                  </div>
                </div>
              </div>
              
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all shadow-sm ${
                  paymentMethod === 'transfer'
                    ? 'border-blue7 bg-gray10'
                    : 'border-gray-300 hover:border-blue7 bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('transfer')}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Transferencia Bancaria</h4>
                    <p className="text-sm text-gray-600">Pago directo a cuenta</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray10 rounded-lg p-4 mb-6 border border-gray-300 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-3">Resumen del Pago</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-300">
                  <span className="text-gray-600">Plan {selectedPlan.name}</span>
                  <span className="font-semibold text-gray-800">
                    {formatCLP(selectedPlan.price)}/mes
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Método de pago</span>
                  <span className="text-gray-800 font-medium">
                    {paymentMethod === 'webpay' ? 'Webpay Plus' : 'Transferencia Bancaria'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-300 bg-gray-50">
          <div className="text-sm text-gray-600">
            <p>• Pago mensual recurrente</p>
            <p>• Puedes cambiar de plan en cualquier momento</p>
            <p>• Cancelación sin compromiso</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-400 text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={!selectedPlan || loading}
              className="bg-blue7 hover:bg-blue7 text-white shadow-md transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar {selectedPlan && formatCLP(selectedPlan.price)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Transferencia Bancaria */}
      {selectedPlan && (
        <BankTransferModal
          isOpen={showBankTransferModal}
          onClose={() => setShowBankTransferModal(false)}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}