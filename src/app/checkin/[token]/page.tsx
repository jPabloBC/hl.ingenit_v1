"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  Hotel,
  Calendar,
  Users,
  Upload,
  Check,
  Clock,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  Upload as UploadIcon
} from "lucide-react";

interface CheckinInfo {
  checkin_id: string;
  reservation_id: string;
  business_id: string;
  business_name: string;
  status: string;
  expires_at: string;
  guest_name: string;
  guest_email: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  total_guests: number;
  all_passengers: any[];
}

interface PassengerData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  document_id: string;
  nationality: string;
  address: string;
  document_front?: File | null;
  document_back?: File | null;
}

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [checkinInfo, setCheckinInfo] = useState<CheckinInfo | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadCheckinInfo();
    }
  }, [token]);

  const loadCheckinInfo = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_checkin_by_token', {
          p_token: token
        });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setError('Check-in no encontrado o expirado');
        return;
      }

      const info = data[0];
      setCheckinInfo(info);

      // Inicializar datos de pasajeros
      const passengersData = info.all_passengers || [];
      const initialPassengers = passengersData.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        document_id: p.document_id || '',
        nationality: p.nationality || 'Chile',
        address: p.address || '',
        document_front: null,
        document_back: null
      }));

      // Si no hay pasajeros, crear uno vacío
      if (initialPassengers.length === 0) {
        initialPassengers.push({
          name: info.guest_name || '',
          email: info.guest_email || '',
          phone: '',
          document_id: '',
          nationality: 'Chile',
          address: '',
          document_front: null,
          document_back: null
        });
      }

      setPassengers(initialPassengers);

    } catch (error) {
      console.error('Error loading check-in info:', error);
      setError('Error al cargar información del check-in');
    } finally {
      setLoading(false);
    }
  };

  const updatePassenger = (index: number, field: keyof PassengerData, value: any) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = (index: number, field: 'document_front' | 'document_back', file: File) => {
    updatePassenger(index, field, file);
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      // Validar datos de huéspedes
      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        if (!passenger.name || !passenger.email || !passenger.document_id) {
          setError(`Por favor completa todos los datos del huésped ${i + 1}`);
          return false;
        }
      }
    } else if (currentStep === 2) {
      // Validar documentos subidos
      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        if (!passenger.document_front) {
          setError(`Por favor sube el documento del huésped ${i + 1}`);
          return false;
        }
      }
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const submitCheckin = async () => {
    if (!validateCurrentStep()) return;

    try {
      setSubmitting(true);

      // Aquí iría la lógica para subir documentos y actualizar datos
      // Por ahora, solo actualizamos el estado
      
      const { error } = await supabase
        .rpc('update_checkin_process_status', {
          p_token: token,
          p_new_status: 'completed',
          p_staff_notes: 'Check-in digital completado por el huésped'
        });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setCurrentStep(3);

    } catch (error) {
      console.error('Error submitting check-in:', error);
      setError('Error al completar el check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeRemaining = () => {
    if (!checkinInfo) return '';
    
    const now = new Date();
    const expires = new Date(checkinInfo.expires_at);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
    } else {
      return `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del check-in...</p>
        </div>
      </div>
    );
  }

  if (error && !checkinInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check-in No Disponible</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Ir al Inicio
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Check-in Completado!</h1>
          <p className="text-gray-600 mb-6">
            Tu check-in digital ha sido completado exitosamente. Al llegar al hotel, solo necesitas presentarte en recepción.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Información de tu estadía:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Hotel:</strong> {checkinInfo?.business_name}</p>
              <p><strong>Habitación:</strong> {checkinInfo?.room_number} ({checkinInfo?.room_type})</p>
              <p><strong>Check-in:</strong> {checkinInfo ? formatDate(checkinInfo.check_in_date) : ''}</p>
            </div>
          </div>
          <Button onClick={() => router.push('/')} className="w-full">
            Finalizar
          </Button>
        </div>
      </div>
    );
  }

  if (!checkinInfo) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Hotel className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Check-in Digital</h1>
                <p className="text-gray-600">{checkinInfo.business_name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {getTimeRemaining()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              Datos de Huéspedes
            </span>
            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              Documentos
            </span>
            <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
              Completado
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep - 1) * 50}%` }}
            ></div>
          </div>
        </div>

        {/* Reservation Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de tu Reserva</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Huésped Principal</p>
                <p className="font-medium">{checkinInfo.guest_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-medium">{formatDate(checkinInfo.check_in_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Huéspedes</p>
                <p className="font-medium">{checkinInfo.total_guests} persona{checkinInfo.total_guests > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Hotel className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Habitación</p>
                <p className="font-medium">{checkinInfo.room_number} - {checkinInfo.room_type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Datos de Huéspedes</h2>
            
            {passengers.map((passenger, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Huésped {index + 1} {index === 0 && '(Principal)'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={passenger.email}
                      onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={passenger.phone}
                      onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+56 9 xxxx xxxx"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento de Identidad *
                    </label>
                    <input
                      type="text"
                      value={passenger.document_id}
                      onChange={(e) => updatePassenger(index, 'document_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="RUT o Pasaporte"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nacionalidad
                    </label>
                    <select
                      value={passenger.nationality}
                      onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Chile">Chile</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Perú">Perú</option>
                      <option value="Bolivia">Bolivia</option>
                      <option value="Brasil">Brasil</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={passenger.address}
                      onChange={(e) => updatePassenger(index, 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button onClick={nextStep} className="flex items-center space-x-2">
                <span>Continuar</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Subir Documentos</h2>
            
            {passengers.map((passenger, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Documentos de {passenger.name}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento (Frente) *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <UploadIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Sube una foto del frente de tu documento
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(index, 'document_front', file);
                        }}
                        className="hidden"
                        id={`front-${index}`}
                      />
                      <label htmlFor={`front-${index}`} className="cursor-pointer">
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                          Seleccionar Archivo
                        </span>
                      </label>
                      {passenger.document_front && (
                        <p className="text-green-600 text-sm mt-2">
                          ✓ {passenger.document_front.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento (Reverso)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <UploadIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Sube una foto del reverso (opcional)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(index, 'document_back', file);
                        }}
                        className="hidden"
                        id={`back-${index}`}
                      />
                      <label htmlFor={`back-${index}`} className="cursor-pointer">
                        <span className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
                          Seleccionar Archivo
                        </span>
                      </label>
                      {passenger.document_back && (
                        <p className="text-green-600 text-sm mt-2">
                          ✓ {passenger.document_back.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
              >
                Anterior
              </Button>
              <Button 
                onClick={submitCheckin}
                disabled={submitting}
                className="flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Completando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completar Check-in</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
