-- Sistema de Facturación Electrónica SII Multi-Empresa
-- Cada hotel maneja sus propios certificados y configuración SII

-- 1) Configuración SII por empresa
CREATE TABLE IF NOT EXISTS app_hl.hl_sii_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES app_hl.hl_business(id) ON DELETE CASCADE UNIQUE,
  
  -- Datos de la empresa
  rut_empresa VARCHAR(12) NOT NULL, -- 12345678-9
  razon_social VARCHAR(255) NOT NULL,
  giro VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL,
  comuna VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  
  -- Configuración SII
  ambiente VARCHAR(20) NOT NULL DEFAULT 'certificacion' CHECK (ambiente IN ('certificacion', 'produccion')),
  
  -- Certificado digital (encriptado)
  certificado_digital BYTEA, -- Archivo .p12 encriptado
  certificado_password_hash VARCHAR(255), -- Password encriptado
  certificado_fecha_vencimiento DATE,
  certificado_activo BOOLEAN DEFAULT FALSE,
  
  -- Estado de conexión SII
  conexion_activa BOOLEAN DEFAULT FALSE,
  ultima_conexion TIMESTAMPTZ,
  ultimo_error TEXT,
  
  -- Configuración de documentos
  actividad_economica VARCHAR(10) DEFAULT '551000', -- Código SII para hoteles
  iva_incluido BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- 2) Folios electrónicos por empresa y tipo de documento
CREATE TABLE IF NOT EXISTS app_hl.hl_sii_folios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES app_hl.hl_business(id) ON DELETE CASCADE,
  
  -- Tipo de documento
  tipo_documento INTEGER NOT NULL, -- 39=Boleta, 33=Factura, etc.
  nombre_documento VARCHAR(50) NOT NULL, -- 'Boleta Electrónica', 'Factura Electrónica'
  
  -- Rango de folios
  folio_desde BIGINT NOT NULL,
  folio_hasta BIGINT NOT NULL,
  folio_actual BIGINT NOT NULL DEFAULT 0, -- Próximo folio a usar
  
  -- Estado del rango
  activo BOOLEAN DEFAULT TRUE,
  fecha_autorizacion DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  
  -- CAF (Código de Autorización de Folios) del SII
  caf_xml TEXT NOT NULL, -- XML completo del CAF
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_folio_range CHECK (folio_hasta >= folio_desde),
  CONSTRAINT valid_current_folio CHECK (folio_actual >= folio_desde AND folio_actual <= folio_hasta)
);

-- 3) Documentos tributarios emitidos
CREATE TABLE IF NOT EXISTS app_hl.hl_documentos_tributarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES app_hl.hl_business(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES app_hl.hl_reservations(id) ON DELETE SET NULL,
  
  -- Identificación del documento
  tipo_documento INTEGER NOT NULL,
  folio BIGINT NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Datos del receptor
  rut_receptor VARCHAR(12), -- Puede ser null para boletas sin RUT
  razon_social_receptor VARCHAR(255),
  direccion_receptor TEXT,
  giro_receptor VARCHAR(255),
  
  -- Montos
  monto_neto DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_iva DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_total DECIMAL(12,2) NOT NULL,
  
  -- Detalle del documento
  glosa TEXT,
  observaciones TEXT,
  
  -- Estado SII
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' 
    CHECK (estado IN ('pendiente', 'enviado', 'aceptado', 'rechazado', 'anulado')),
  track_id BIGINT, -- ID de seguimiento SII
  fecha_envio TIMESTAMPTZ,
  fecha_respuesta TIMESTAMPTZ,
  respuesta_sii TEXT,
  
  -- Archivos generados
  xml_dte TEXT, -- XML del DTE firmado
  pdf_path VARCHAR(500), -- Ruta del PDF generado
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  UNIQUE(business_id, tipo_documento, folio)
);

-- 4) Detalle de documentos tributarios
CREATE TABLE IF NOT EXISTS app_hl.hl_documentos_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES app_hl.hl_documentos_tributarios(id) ON DELETE CASCADE,
  
  -- Línea del detalle
  numero_linea INTEGER NOT NULL,
  
  -- Producto/Servicio
  codigo_item VARCHAR(50),
  nombre_item VARCHAR(200) NOT NULL,
  descripcion TEXT,
  
  -- Cantidades y precios
  cantidad DECIMAL(10,3) NOT NULL DEFAULT 1,
  unidad_medida VARCHAR(10) DEFAULT 'UN',
  precio_unitario DECIMAL(12,2) NOT NULL,
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
  descuento_monto DECIMAL(12,2) DEFAULT 0,
  
  -- Montos calculados
  monto_neto DECIMAL(12,2) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(documento_id, numero_linea)
);

-- 5) Log de eventos SII
CREATE TABLE IF NOT EXISTS app_hl.hl_sii_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES app_hl.hl_business(id) ON DELETE CASCADE,
  documento_id UUID REFERENCES app_hl.hl_documentos_tributarios(id) ON DELETE SET NULL,
  
  -- Evento
  evento VARCHAR(50) NOT NULL, -- 'conexion', 'envio', 'respuesta', 'error'
  descripcion TEXT NOT NULL,
  
  -- Datos técnicos
  request_data JSONB,
  response_data JSONB,
  error_code VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6) Índices para performance
CREATE INDEX IF NOT EXISTS idx_sii_config_business ON app_hl.hl_sii_config(business_id);
CREATE INDEX IF NOT EXISTS idx_sii_folios_business_tipo ON app_hl.hl_sii_folios(business_id, tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_business_fecha ON app_hl.hl_documentos_tributarios(business_id, fecha_emision);
CREATE INDEX IF NOT EXISTS idx_documentos_folio ON app_hl.hl_documentos_tributarios(tipo_documento, folio);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON app_hl.hl_documentos_tributarios(estado);
CREATE INDEX IF NOT EXISTS idx_documentos_detalle ON app_hl.hl_documentos_detalle(documento_id);
CREATE INDEX IF NOT EXISTS idx_sii_logs_business ON app_hl.hl_sii_logs(business_id, created_at);

-- 7) Triggers para updated_at
CREATE OR REPLACE TRIGGER trg_sii_config_updated_at
  BEFORE UPDATE ON app_hl.hl_sii_config
  FOR EACH ROW
  EXECUTE FUNCTION app_hl.set_updated_at();

CREATE OR REPLACE TRIGGER trg_sii_folios_updated_at
  BEFORE UPDATE ON app_hl.hl_sii_folios
  FOR EACH ROW
  EXECUTE FUNCTION app_hl.set_updated_at();

CREATE OR REPLACE TRIGGER trg_documentos_updated_at
  BEFORE UPDATE ON app_hl.hl_documentos_tributarios
  FOR EACH ROW
  EXECUTE FUNCTION app_hl.set_updated_at();

-- 8) Vistas públicas para frontend
CREATE OR REPLACE VIEW public.hl_sii_config AS
SELECT 
  id,
  business_id,
  rut_empresa,
  razon_social,
  giro,
  direccion,
  comuna,
  ciudad,
  ambiente,
  certificado_activo,
  conexion_activa,
  ultima_conexion,
  ultimo_error,
  actividad_economica,
  iva_incluido,
  created_at,
  updated_at,
  created_by
FROM app_hl.hl_sii_config;

CREATE OR REPLACE VIEW public.hl_sii_folios AS
SELECT 
  id,
  business_id,
  tipo_documento,
  nombre_documento,
  folio_desde,
  folio_hasta,
  folio_actual,
  activo,
  fecha_autorizacion,
  fecha_vencimiento,
  created_at,
  updated_at
FROM app_hl.hl_sii_folios;

CREATE OR REPLACE VIEW public.hl_documentos_tributarios AS
SELECT 
  id,
  business_id,
  reservation_id,
  tipo_documento,
  folio,
  fecha_emision,
  rut_receptor,
  razon_social_receptor,
  monto_neto,
  monto_iva,
  monto_total,
  glosa,
  observaciones,
  estado,
  track_id,
  fecha_envio,
  fecha_respuesta,
  pdf_path,
  created_at,
  updated_at,
  created_by
FROM app_hl.hl_documentos_tributarios;

CREATE OR REPLACE VIEW public.hl_documentos_detalle AS
SELECT 
  id,
  documento_id,
  numero_linea,
  codigo_item,
  nombre_item,
  descripcion,
  cantidad,
  unidad_medida,
  precio_unitario,
  descuento_porcentaje,
  descuento_monto,
  monto_neto,
  created_at
FROM app_hl.hl_documentos_detalle;

-- 9) RLS (Row Level Security)
ALTER TABLE app_hl.hl_sii_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_hl.hl_sii_folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_hl.hl_documentos_tributarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_hl.hl_documentos_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_hl.hl_sii_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para SII Config
CREATE POLICY "Users can view their business SII config" ON app_hl.hl_sii_config
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM app_hl.hl_business 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their business SII config" ON app_hl.hl_sii_config
  FOR ALL USING (
    business_id IN (
      SELECT id FROM app_hl.hl_business 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas para Folios
CREATE POLICY "Users can view their business folios" ON app_hl.hl_sii_folios
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM app_hl.hl_business 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their business folios" ON app_hl.hl_sii_folios
  FOR ALL USING (
    business_id IN (
      SELECT id FROM app_hl.hl_business 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas para Documentos Tributarios
CREATE POLICY "Users can view their business documents" ON app_hl.hl_documentos_tributarios
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM app_hl.hl_business 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their business documents" ON app_hl.hl_documentos_tributarios
  FOR ALL USING (
    business_id IN (
      SELECT id FROM app_hl.hl_business 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas para Detalle de Documentos
CREATE POLICY "Users can view their business document details" ON app_hl.hl_documentos_detalle
  FOR SELECT USING (
    documento_id IN (
      SELECT dt.id FROM app_hl.hl_documentos_tributarios dt
      JOIN app_hl.hl_business b ON dt.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their business document details" ON app_hl.hl_documentos_detalle
  FOR ALL USING (
    documento_id IN (
      SELECT dt.id FROM app_hl.hl_documentos_tributarios dt
      JOIN app_hl.hl_business b ON dt.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Políticas para Logs SII
CREATE POLICY "Users can view their business SII logs" ON app_hl.hl_sii_logs
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM app_hl.hl_business 
      WHERE user_id = auth.uid()
    )
  );

-- 10) Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON app_hl.hl_sii_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_hl.hl_sii_folios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_hl.hl_documentos_tributarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_hl.hl_documentos_detalle TO authenticated;
GRANT SELECT, INSERT ON app_hl.hl_sii_logs TO authenticated;

GRANT SELECT ON public.hl_sii_config TO authenticated;
GRANT SELECT ON public.hl_sii_folios TO authenticated;
GRANT SELECT ON public.hl_documentos_tributarios TO authenticated;
GRANT SELECT ON public.hl_documentos_detalle TO authenticated;

-- Success message
SELECT 'SII Multi-Empresa system created successfully' as status;
