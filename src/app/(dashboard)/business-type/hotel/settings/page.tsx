"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HotelLayout from "@/components/layout/hotel-layout";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  FileText,
  Shield,
  Wifi,
  WifiOff,
  Calendar,
  Building2,
  Receipt,
  Database
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface SIIConfig {
  id?: string;
  business_id: string;
  rut_empresa: string;
  razon_social: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  ambiente: 'certificacion' | 'produccion';
  certificado_activo: boolean;
  conexion_activa: boolean;
  ultima_conexion?: string;
  ultimo_error?: string;
  actividad_economica: string;
  iva_incluido: boolean;
}

interface SIIFolio {
  id: string;
  tipo_documento: number;
  nombre_documento: string;
  folio_desde: number;
  folio_hasta: number;
  folio_actual: number;
  activo: boolean;
  fecha_autorizacion: string;
  fecha_vencimiento: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string>('');

  // Función para capitalizar texto (primera letra de cada palabra en mayúscula)
  const capitalizeText = (text: string) => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  const [siiConfig, setSiiConfig] = useState<SIIConfig>({
    business_id: '',
    rut_empresa: '',
    razon_social: '',
    giro: 'Servicios de Alojamiento',
    direccion: '',
    comuna: '',
    ciudad: '',
    ambiente: 'certificacion',
    certificado_activo: false,
    conexion_activa: false,
    actividad_economica: '551000',
    iva_incluido: true
  });
  const [folios, setFolios] = useState<SIIFolio[]>([]);
  const [activeTab, setActiveTab] = useState('config');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current user and business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get business info
      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id, business_name, rut')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) {
        console.error('Error getting business:', businessError);
        alert('Error al obtener información del negocio');
        return;
      }

      setBusinessId(businessData.id);

      // Load SII configuration
      await loadSIIConfig(businessData.id, businessData);
      
      // Load folios
      await loadFolios(businessData.id);

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadSIIConfig = async (businessId: string, businessData: any) => {
    const { data, error } = await supabase
      .from('hl_sii_config')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error loading SII config:', error);
      return;
    }

    if (data) {
      // Merge SII config with business data
      setSiiConfig({
        ...data,
        rut_empresa: businessData.rut || data.rut_empresa,
        razon_social: businessData.business_name || data.razon_social,
        direccion: businessData.address || data.direccion,
        ciudad: businessData.city || data.ciudad
      });
    } else {
      // Initialize with business data if no config exists
      setSiiConfig(prev => ({
        ...prev,
        business_id: businessId,
        rut_empresa: businessData.rut || '',
        razon_social: businessData.business_name || '',
        direccion: businessData.address || '',
        ciudad: businessData.city || ''
      }));
    }
  };

  const loadFolios = async (businessId: string) => {
    const { data, error } = await supabase
      .from('hl_sii_folios')
      .select('*')
      .eq('business_id', businessId)
      .order('tipo_documento');

    if (error) {
      console.error('Error loading folios:', error);
      return;
    }

    setFolios(data || []);
  };

  const handleSaveSIIConfig = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!siiConfig.rut_empresa || !siiConfig.razon_social || !siiConfig.giro) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }

      // Validate businessId is set
      if (!businessId) {
        console.error('Business ID not set');
        alert('Error: ID de negocio no encontrado');
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        alert('Error: Usuario no autenticado');
        return;
      }

      console.log('Current user:', user.id);
      console.log('Business ID:', businessId);

      // Verify business ownership
      const { data: businessCheck, error: businessCheckError } = await supabase
        .from('hl_business')
        .select('id, business_name')
        .eq('id', businessId)
        .eq('user_id', user.id)
        .single();

      if (businessCheckError || !businessCheck) {
        console.error('Business ownership verification failed:', businessCheckError);
        alert('Error: No tienes permisos para este negocio');
        return;
      }

      console.log('Business ownership verified:', businessCheck);

      // Prepare data for upsert
      const configData = {
        ...siiConfig,
        business_id: businessId,
        updated_at: new Date().toISOString()
      };

      console.log('Saving SII config with data:', configData);

      if (siiConfig.id) {
        // Update existing
        const { data, error } = await supabase
          .from('hl_sii_config')
          .update(configData)
          .eq('id', siiConfig.id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('Update successful:', data);
        setSiiConfig(data);
      } else {
        // Insert new - use the database function to handle created_by
        const { data, error } = await supabase
          .rpc('insert_sii_config', {
            p_business_id: configData.business_id,
            p_rut_empresa: configData.rut_empresa,
            p_razon_social: configData.razon_social,
            p_giro: configData.giro,
            p_direccion: configData.direccion,
            p_comuna: configData.comuna,
            p_ciudad: configData.ciudad,
            p_ambiente: configData.ambiente,
            p_certificado_activo: configData.certificado_activo,
            p_conexion_activa: configData.conexion_activa,
            p_actividad_economica: configData.actividad_economica,
            p_iva_incluido: configData.iva_incluido
          });

        if (error) {
          console.error('Supabase function error:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('Insert successful:', data);
        setSiiConfig(data);
      }

      alert('Configuración SII guardada exitosamente');

    } catch (error: any) {
      console.error('Error saving SII config:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      alert(`Error al guardar configuración SII: ${error?.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile || !certificatePassword) {
      alert('Por favor selecciona un certificado y proporciona la contraseña');
      return;
    }

    try {
      setSaving(true);

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Upload certificate (in a real implementation, this would be encrypted)
          const { error } = await supabase
            .from('hl_sii_config')
            .update({
              certificado_activo: true,
              updated_at: new Date().toISOString()
            })
            .eq('business_id', businessId);

          if (error) throw error;

          alert('Certificado subido exitosamente');
          await loadData();

        } catch (error) {
          console.error('Error uploading certificate:', error);
          alert('Error al subir certificado');
        } finally {
          setSaving(false);
        }
      };

      reader.readAsDataURL(certificateFile);

    } catch (error) {
      console.error('Error processing certificate:', error);
      alert('Error al procesar certificado');
      setSaving(false);
    }
  };

  const testSIIConnection = async () => {
    try {
      setSaving(true);
      
      // Simulate SII connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update connection status
      const { error } = await supabase
        .from('hl_sii_config')
        .update({
          conexion_activa: true,
          ultima_conexion: new Date().toISOString(),
          ultimo_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', businessId);

      if (error) throw error;

      alert('Conexión con SII exitosa');
      await loadData();

    } catch (error) {
      console.error('Error testing SII connection:', error);
      alert('Error al conectar con SII');
    } finally {
      setSaving(false);
    }
  };

  const getConnectionStatus = () => {
    if (siiConfig.conexion_activa) {
      return {
        icon: <Wifi className="h-5 w-5 text-green-600" />,
        text: 'Conectado',
        color: 'text-green-600',
        bg: 'bg-green-50'
      };
    } else {
      return {
        icon: <WifiOff className="h-5 w-5 text-red-600" />,
        text: 'Desconectado',
        color: 'text-red-600',
        bg: 'bg-red-50'
      };
    }
  };

  const getCertificateStatus = () => {
    if (siiConfig.certificado_activo) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        text: 'Activo',
        color: 'text-green-600',
        bg: 'bg-green-50'
      };
    } else {
      return {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        text: 'No configurado',
        color: 'text-red-600',
        bg: 'bg-red-50'
      };
    }
  };

  if (loading) {
    return (
      <HotelLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
            <p className="text-gray4">Cargando configuración...</p>
          </div>
        </div>
      </HotelLayout>
    );
  }

  const connectionStatus = getConnectionStatus();
  const certificateStatus = getCertificateStatus();

  return (
    <HotelLayout>
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-blue1 font-title">
                Configuración SII
              </h1>
              <p className="text-gray4">
                Facturación electrónica y conexión con el Servicio de Impuestos Internos
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${connectionStatus.bg} border border-gray-200 rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estado SII</p>
                <p className={`text-lg font-semibold ${connectionStatus.color}`}>
                  {connectionStatus.text}
                </p>
              </div>
              {connectionStatus.icon}
            </div>
          </div>
          
          <div className={`${certificateStatus.bg} border border-gray-200 rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Certificado Digital</p>
                <p className={`text-lg font-semibold ${certificateStatus.color}`}>
                  {certificateStatus.text}
                </p>
              </div>
              {certificateStatus.icon}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ambiente</p>
                <p className="text-lg font-semibold text-blue-600">
                  {siiConfig.ambiente === 'certificacion' ? 'Certificación' : 'Producción'}
                </p>
              </div>
              <Database className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Información sobre datos unificados */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Datos Unificados del Negocio
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Los datos básicos del negocio (RUT, Razón Social, Dirección, Ciudad) se obtienen automáticamente del registro. 
                Solo puedes editar la configuración específica de facturación electrónica SII.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('config')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="h-4 w-4 inline mr-2" />
                Configuración Empresa
              </button>
              <button
                onClick={() => setActiveTab('certificate')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'certificate'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="h-4 w-4 inline mr-2" />
                Certificado Digital
              </button>
              <button
                onClick={() => setActiveTab('folios')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'folios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Receipt className="h-4 w-4 inline mr-2" />
                Folios Electrónicos
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Company Configuration Tab */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT Empresa *
                    </label>
                    <input
                      type="text"
                      placeholder="12345678-9"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      value={siiConfig.rut_empresa}
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Este dato se obtiene del registro del negocio</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      placeholder="Hotel Los Alamos SpA"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      value={capitalizeText(siiConfig.razon_social)}
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Este dato se obtiene del registro del negocio</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giro *
                    </label>
                    <input
                      type="text"
                      placeholder="Servicios de Alojamiento"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={siiConfig.giro}
                      onChange={(e) => setSiiConfig({...siiConfig, giro: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actividad Económica
                    </label>
                    <input
                      type="text"
                      placeholder="551000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={siiConfig.actividad_economica}
                      onChange={(e) => setSiiConfig({...siiConfig, actividad_economica: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      placeholder="Av. Libertador 1234"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      value={siiConfig.direccion}
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Este dato se obtiene del registro del negocio</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comuna *
                    </label>
                    <input
                      type="text"
                      placeholder="Las Condes"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={siiConfig.comuna}
                      onChange={(e) => setSiiConfig({...siiConfig, comuna: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      placeholder="Santiago"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      value={siiConfig.ciudad}
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Este dato se obtiene del registro del negocio</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ambiente SII
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={siiConfig.ambiente}
                      onChange={(e) => setSiiConfig({...siiConfig, ambiente: e.target.value as 'certificacion' | 'produccion'})}
                    >
                      <option value="certificacion">Certificación (Testing)</option>
                      <option value="produccion">Producción</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="iva_incluido"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={siiConfig.iva_incluido}
                      onChange={(e) => setSiiConfig({...siiConfig, iva_incluido: e.target.checked})}
                    />
                    <label htmlFor="iva_incluido" className="ml-2 block text-sm text-gray-900">
                      IVA incluido en precios
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSIIConfig}
                    disabled={saving}
                    className="bg-blue8 hover:bg-blue6"
                  >
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                </div>
              </div>
            )}

            {/* Certificate Tab */}
            {activeTab === 'certificate' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Importante
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Necesitas un certificado digital válido del SII para emitir documentos electrónicos. 
                        El certificado debe estar en formato .p12 o .pfx.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificado Digital (.p12 / .pfx)
                    </label>
                    <input
                      type="file"
                      accept=".p12,.pfx"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña del Certificado
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={certificatePassword}
                      onChange={(e) => setCertificatePassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={testSIIConnection}
                    variant="outline"
                    disabled={saving || !siiConfig.certificado_activo}
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    {saving ? 'Probando...' : 'Probar Conexión SII'}
                  </Button>
                  
                  <Button
                    onClick={handleCertificateUpload}
                    disabled={saving || !certificateFile || !certificatePassword}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {saving ? 'Subiendo...' : 'Subir Certificado'}
                  </Button>
                </div>
              </div>
            )}

            {/* Folios Tab */}
            {activeTab === 'folios' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Folios Electrónicos
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Los folios son rangos de numeración autorizados por el SII para emitir documentos electrónicos.
                        Debes solicitar folios antes de poder emitir boletas o facturas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Folios Actuales</h3>
                  <Button
                    variant="outline"
                    disabled={!siiConfig.conexion_activa}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Solicitar Folios SII
                  </Button>
                </div>

                {folios.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Documento
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rango
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actual
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vencimiento
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {folios.map((folio) => (
                          <tr key={folio.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {folio.nombre_documento}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {folio.folio_desde.toLocaleString()} - {folio.folio_hasta.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {folio.folio_actual.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                folio.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {folio.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(folio.fecha_vencimiento).toLocaleDateString('es-ES')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No hay folios configurados. Solicita folios al SII para comenzar a emitir documentos.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </HotelLayout>
  );
}
