import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  createDocumentFromReservation, 
  generateDTEXML, 
  generateDocumentPDF,
  DOCUMENT_TYPES 
} from '@/lib/sii-documents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reservationId, 
      documentType, 
      businessId,
      receptorData // Optional - for facturas
    } = body;

    // Validate required fields
    if (!reservationId || !documentType || !businessId) {
      return NextResponse.json(
        { error: 'Datos incompletos: reservationId, documentType y businessId son requeridos' },
        { status: 400 }
      );
    }

    // Get business SII configuration
    const { data: siiConfig, error: configError } = await supabase
      .from('hl_sii_config')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (configError || !siiConfig) {
      return NextResponse.json(
        { error: 'Configuración SII no encontrada. Configure primero en Configuración SII.' },
        { status: 400 }
      );
    }

    if (!siiConfig.certificado_activo || !siiConfig.conexion_activa) {
      return NextResponse.json(
        { error: 'Certificado SII no activo o sin conexión. Verifique configuración.' },
        { status: 400 }
      );
    }

    // Get active folio for document type
    const { data: folioData, error: folioError } = await supabase
      .from('hl_sii_folios')
      .select('*')
      .eq('business_id', businessId)
      .eq('tipo_documento', documentType)
      .eq('activo', true)
      .single();

    if (folioError || !folioData) {
      return NextResponse.json(
        { error: `No hay folios activos para el tipo de documento ${documentType}` },
        { status: 400 }
      );
    }

    // Check if folio is within range
    if (folioData.folio_actual > folioData.folio_hasta) {
      return NextResponse.json(
        { error: 'Folios agotados. Solicite nuevos folios al SII.' },
        { status: 400 }
      );
    }

    // Get reservation data
    const { data: reservationData, error: reservationError } = await supabase
      .from('hl_reservations')
      .select(`
        *,
        hl_rooms!inner(room_number, room_type),
        hl_reservation_guests!inner(
          hl_passengers!inner(name, email, document, address)
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservationData) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Get current folio and increment
    const currentFolio = folioData.folio_actual + 1;

    // Check if document already exists
    const { data: existingDoc } = await supabase
      .from('hl_documentos_tributarios')
      .select('id')
      .eq('business_id', businessId)
      .eq('reservation_id', reservationId)
      .eq('tipo_documento', documentType)
      .single();

    if (existingDoc) {
      return NextResponse.json(
        { error: 'Ya existe un documento de este tipo para esta reserva' },
        { status: 400 }
      );
    }

    // Prepare reservation data for document creation
    const processedReservationData = {
      ...reservationData,
      room_number: reservationData.hl_rooms.room_number,
      guest_name: reservationData.hl_reservation_guests[0]?.hl_passengers?.name || 'Cliente',
      guest_rut: receptorData?.rut || null,
      guest_address: reservationData.hl_reservation_guests[0]?.hl_passengers?.address || null,
      total_nights: reservationData.total_nights || 1
    };

    // Create document data
    const documentData = createDocumentFromReservation(
      processedReservationData,
      siiConfig,
      documentType,
      currentFolio
    );

    // Generate XML and PDF
    const xmlDTE = generateDTEXML(documentData);
    const pdfDoc = generateDocumentPDF(documentData);
    
    // Save PDF (in a real implementation, you'd save to storage)
    const pdfPath = `/documents/${businessId}/${documentType}_${currentFolio}.pdf`;

    // Insert document in database
    const { data: newDocument, error: insertError } = await supabase
      .from('hl_documentos_tributarios')
      .insert([
        {
          business_id: businessId,
          reservation_id: reservationId,
          tipo_documento: documentType,
          folio: currentFolio,
          fecha_emision: new Date().toISOString().split('T')[0],
          rut_receptor: receptorData?.rut || null,
          razon_social_receptor: documentData.receptor?.razonSocial || documentData.detalle[0].nombreItem,
          direccion_receptor: receptorData?.direccion || null,
          giro_receptor: receptorData?.giro || null,
          monto_neto: documentData.totales.montoNeto,
          monto_iva: documentData.totales.montoIVA,
          monto_total: documentData.totales.montoTotal,
          glosa: documentData.glosa,
          observaciones: documentData.observaciones,
          estado: 'pendiente', // Will be updated when sent to SII
          xml_dte: xmlDTE,
          pdf_path: pdfPath,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting document:', insertError);
      return NextResponse.json(
        { error: 'Error al crear documento en base de datos' },
        { status: 500 }
      );
    }

    // Insert document details
    const detailsPromises = documentData.detalle.map(item => 
      supabase
        .from('hl_documentos_detalle')
        .insert([
          {
            documento_id: newDocument.id,
            numero_linea: item.numeroLinea,
            codigo_item: item.codigoItem,
            nombre_item: item.nombreItem,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            unidad_medida: item.unidadMedida,
            precio_unitario: item.precioUnitario,
            descuento_porcentaje: item.descuentoPorcentaje || 0,
            descuento_monto: item.descuentoMonto || 0,
            monto_neto: item.montoNeto
          }
        ])
    );

    await Promise.all(detailsPromises);

    // Update folio counter
    const { error: folioUpdateError } = await supabase
      .from('hl_sii_folios')
      .update({ 
        folio_actual: currentFolio,
        updated_at: new Date().toISOString()
      })
      .eq('id', folioData.id);

    if (folioUpdateError) {
      console.error('Error updating folio:', folioUpdateError);
    }

    // Log the event
    await supabase
      .from('hl_sii_logs')
      .insert([
        {
          business_id: businessId,
          documento_id: newDocument.id,
          evento: 'documento_creado',
          descripcion: `${DOCUMENT_TYPES[documentType === 39 ? 'BOLETA_ELECTRONICA' : 'FACTURA_ELECTRONICA'].name} N° ${currentFolio} creada`,
          request_data: { reservationId, documentType, receptorData },
          created_by: (await supabase.auth.getUser()).data.user?.id
        }
      ]);

    // Return success response
    return NextResponse.json({
      success: true,
      document: {
        id: newDocument.id,
        tipo: documentType,
        folio: currentFolio,
        total: documentData.totales.montoTotal,
        estado: 'pendiente'
      },
      pdf: pdfDoc.output('datauristring'), // Return PDF as data URI for download
      message: `${DOCUMENT_TYPES[documentType === 39 ? 'BOLETA_ELECTRONICA' : 'FACTURA_ELECTRONICA'].name} N° ${currentFolio} creada exitosamente`
    });

  } catch (error) {
    console.error('Error creating SII document:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al crear documento' },
      { status: 500 }
    );
  }
}
