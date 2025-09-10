import jsPDF from 'jspdf';
import { formatCLP } from './currency';

// Tipos de documentos SII Chile
export const DOCUMENT_TYPES = {
  BOLETA_ELECTRONICA: {
    code: 39,
    name: 'Boleta Electrónica',
    prefix: 'BE'
  },
  FACTURA_ELECTRONICA: {
    code: 33,
    name: 'Factura Electrónica',
    prefix: 'FE'
  },
  NOTA_CREDITO: {
    code: 61,
    name: 'Nota de Crédito Electrónica',
    prefix: 'NC'
  },
  NOTA_DEBITO: {
    code: 56,
    name: 'Nota de Débito Electrónica',
    prefix: 'ND'
  }
};

// Configuración IVA Chile
export const IVA_RATE = 0.19; // 19%

// Interface para documento
export interface DocumentData {
  // Emisor
  emisor: {
    rut: string;
    razonSocial: string;
    giro: string;
    direccion: string;
    comuna: string;
    ciudad: string;
    actividadEconomica: string;
  };
  
  // Receptor (opcional para boletas)
  receptor?: {
    rut: string;
    razonSocial: string;
    direccion?: string;
    giro?: string;
  };
  
  // Documento
  documento: {
    tipo: number;
    folio: number;
    fechaEmision: string;
  };
  
  // Detalle
  detalle: {
    numeroLinea: number;
    codigoItem?: string;
    nombreItem: string;
    descripcion?: string;
    cantidad: number;
    unidadMedida: string;
    precioUnitario: number;
    descuentoPorcentaje?: number;
    descuentoMonto?: number;
    montoNeto: number;
  }[];
  
  // Totales
  totales: {
    montoNeto: number;
    montoIVA: number;
    montoTotal: number;
  };
  
  // Observaciones
  observaciones?: string;
  glosa?: string;
}

// Utilidades de cálculo
export const calculateIVA = (montoNeto: number): number => {
  return Math.round(montoNeto * IVA_RATE);
};

export const calculateNeto = (montoTotal: number): number => {
  return Math.round(montoTotal / (1 + IVA_RATE));
};

export const calculateTotals = (detalle: DocumentData['detalle']) => {
  const montoNeto = detalle.reduce((sum, item) => sum + item.montoNeto, 0);
  const montoIVA = calculateIVA(montoNeto);
  const montoTotal = montoNeto + montoIVA;
  
  return {
    montoNeto: Math.round(montoNeto),
    montoIVA: Math.round(montoIVA),
    montoTotal: Math.round(montoTotal)
  };
};

// Validar RUT chileno
export const validateRUT = (rut: string): boolean => {
  if (!rut) return false;
  
  const cleanRUT = rut.replace(/[.-]/g, '');
  if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;
  
  const rutBody = cleanRUT.slice(0, -1);
  const rutDV = cleanRUT.slice(-1).toLowerCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = remainder === 0 ? '0' : remainder === 1 ? 'k' : (11 - remainder).toString();
  
  return dv === rutDV;
};

// Formatear RUT
export const formatRUT = (rut: string): string => {
  if (!rut) return '';
  
  const cleanRUT = rut.replace(/[.-]/g, '');
  if (cleanRUT.length < 8) return rut;
  
  const rutBody = cleanRUT.slice(0, -1);
  const rutDV = cleanRUT.slice(-1);
  
  return `${rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${rutDV}`;
};

// Formatear moneda chilena
export const formatCurrency = (amount: number): string => {
  return formatCLP(amount);
};

// Generar XML DTE (básico - para implementación completa se necesita firma digital)
export const generateDTEXML = (data: DocumentData): string => {
  const { emisor, receptor, documento, detalle, totales } = data;
  
  // Esto es una estructura básica - en producción necesita firma digital del SII
  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="T${documento.tipo}F${documento.folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${documento.tipo}</TipoDTE>
        <Folio>${documento.folio}</Folio>
        <FchEmis>${documento.fechaEmision}</FchEmis>
      </IdDoc>
      <Emisor>
        <RUTEmisor>${emisor.rut}</RUTEmisor>
        <RznSoc>${emisor.razonSocial}</RznSoc>
        <GiroEmis>${emisor.giro}</GiroEmis>
        <Acteco>${emisor.actividadEconomica}</Acteco>
        <DirOrigen>${emisor.direccion}</DirOrigen>
        <CmnaOrigen>${emisor.comuna}</CmnaOrigen>
        <CiudadOrigen>${emisor.ciudad}</CiudadOrigen>
      </Emisor>
      ${receptor ? `
      <Receptor>
        <RUTRecep>${receptor.rut}</RUTRecep>
        <RznSocRecep>${receptor.razonSocial}</RznSocRecep>
        ${receptor.direccion ? `<DirRecep>${receptor.direccion}</DirRecep>` : ''}
        ${receptor.giro ? `<GiroRecep>${receptor.giro}</GiroRecep>` : ''}
      </Receptor>
      ` : ''}
      <Totales>
        <MntNeto>${totales.montoNeto}</MntNeto>
        <TasaIVA>19</TasaIVA>
        <IVA>${totales.montoIVA}</IVA>
        <MntTotal>${totales.montoTotal}</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>
      ${detalle.map(item => `
      <DteDet>
        <NroLinDet>${item.numeroLinea}</NroLinDet>
        ${item.codigoItem ? `<CdgItem><TpoCodigo>INT1</TpoCodigo><VlrCodigo>${item.codigoItem}</VlrCodigo></CdgItem>` : ''}
        <NmbItem>${item.nombreItem}</NmbItem>
        ${item.descripcion ? `<DscItem>${item.descripcion}</DscItem>` : ''}
        <QtyItem>${item.cantidad}</QtyItem>
        <UnmdItem>${item.unidadMedida}</UnmdItem>
        <PrcItem>${item.precioUnitario}</PrcItem>
        ${item.descuentoMonto ? `<DescuentoMonto>${item.descuentoMonto}</DescuentoMonto>` : ''}
        <MontoItem>${item.montoNeto}</MontoItem>
      </DteDet>
      `).join('')}
    </Detalle>
  </Documento>
</DTE>`;

  return xml;
};

// Generar PDF del documento
export const generateDocumentPDF = (data: DocumentData): jsPDF => {
  const doc = new jsPDF();
  const { emisor, receptor, documento, detalle, totales } = data;
  
  // Configuración inicial
  doc.setFont('helvetica');
  let yPosition = 20;
  
  // Header - Tipo de documento
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const docName = DOCUMENT_TYPES[documento.tipo === 39 ? 'BOLETA_ELECTRONICA' : 'FACTURA_ELECTRONICA']?.name || 'Documento';
  doc.text(docName, 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Folio
  doc.setFontSize(14);
  doc.text(`N° ${documento.folio}`, 105, yPosition, { align: 'center' });
  yPosition += 20;
  
  // Emisor
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EMISOR:', 20, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${emisor.razonSocial}`, 20, yPosition);
  yPosition += 6;
  doc.text(`RUT: ${formatRUT(emisor.rut)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Giro: ${emisor.giro}`, 20, yPosition);
  yPosition += 6;
  doc.text(`${emisor.direccion}`, 20, yPosition);
  yPosition += 6;
  doc.text(`${emisor.comuna}, ${emisor.ciudad}`, 20, yPosition);
  yPosition += 15;
  
  // Receptor (si existe)
  if (receptor) {
    doc.setFont('helvetica', 'bold');
    doc.text('RECEPTOR:', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${receptor.razonSocial}`, 20, yPosition);
    yPosition += 6;
    doc.text(`RUT: ${formatRUT(receptor.rut)}`, 20, yPosition);
    yPosition += 15;
  }
  
  // Fecha
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA EMISIÓN:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(documento.fechaEmision).toLocaleDateString('es-CL'), 80, yPosition);
  yPosition += 20;
  
  // Detalle
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE:', 20, yPosition);
  yPosition += 10;
  
  // Headers tabla
  doc.setFontSize(10);
  doc.text('Cant.', 20, yPosition);
  doc.text('Descripción', 40, yPosition);
  doc.text('P. Unit.', 130, yPosition);
  doc.text('Total', 160, yPosition);
  yPosition += 5;
  
  // Línea separadora
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;
  
  // Items
  doc.setFont('helvetica', 'normal');
  detalle.forEach(item => {
    if (yPosition > 250) { // Nueva página si es necesario
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(item.cantidad.toString(), 20, yPosition);
    doc.text(item.nombreItem, 40, yPosition);
    doc.text(formatCurrency(item.precioUnitario), 130, yPosition);
    doc.text(formatCurrency(item.montoNeto), 160, yPosition);
    yPosition += 8;
    
    if (item.descripcion) {
      doc.setFontSize(8);
      doc.text(item.descripcion, 40, yPosition);
      doc.setFontSize(10);
      yPosition += 6;
    }
  });
  
  yPosition += 10;
  
  // Totales
  doc.line(130, yPosition, 190, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Neto:', 130, yPosition);
  doc.text(formatCurrency(totales.montoNeto), 160, yPosition);
  yPosition += 8;
  
  doc.text('IVA (19%):', 130, yPosition);
  doc.text(formatCurrency(totales.montoIVA), 160, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  doc.text('TOTAL:', 130, yPosition);
  doc.text(formatCurrency(totales.montoTotal), 160, yPosition);
  
  return doc;
};

// Crear documento desde reserva
export const createDocumentFromReservation = (
  reservationData: any,
  emisorConfig: any,
  documentType: number,
  folio: number
): DocumentData => {
  const fechaEmision = new Date().toISOString().split('T')[0];
  
  // Calcular totales
  const montoTotal = reservationData.total_amount || 0;
  const montoNeto = calculateNeto(montoTotal);
  const montoIVA = calculateIVA(montoNeto);
  
  return {
    emisor: {
      rut: emisorConfig.rut_empresa,
      razonSocial: emisorConfig.razon_social,
      giro: emisorConfig.giro,
      direccion: emisorConfig.direccion,
      comuna: emisorConfig.comuna,
      ciudad: emisorConfig.ciudad,
      actividadEconomica: emisorConfig.actividad_economica
    },
    receptor: reservationData.guest_rut ? {
      rut: reservationData.guest_rut,
      razonSocial: reservationData.guest_name,
      direccion: reservationData.guest_address
    } : undefined,
    documento: {
      tipo: documentType,
      folio: folio,
      fechaEmision: fechaEmision
    },
    detalle: [{
      numeroLinea: 1,
      codigoItem: 'ALJ001',
      nombreItem: `Alojamiento Habitación ${reservationData.room_number}`,
      descripcion: `Check-in: ${reservationData.check_in_date} | Check-out: ${reservationData.check_out_date}`,
      cantidad: reservationData.total_nights || 1,
      unidadMedida: 'NOCHE',
      precioUnitario: reservationData.room_price_per_night || 0,
      montoNeto: montoNeto
    }],
    totales: {
      montoNeto: Math.round(montoNeto),
      montoIVA: Math.round(montoIVA),
      montoTotal: Math.round(montoTotal)
    },
    observaciones: reservationData.special_requests,
    glosa: `Reserva N° ${reservationData.id}`
  };
};