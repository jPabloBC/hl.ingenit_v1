"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Copy, Mail, Building2, CreditCard, FileText, Upload, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  userEmail: string;
}

export default function BankTransferModal({ 
  isOpen, 
  onClose, 
  planName, 
  planPrice, 
  userEmail 
}: BankTransferModalProps) {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos bancarios de INGENIT
  const bankData = {
    bankName: "BancoEstado",
    accountType: "Chequera Electrónica / Vista",
    accountNumber: "2573422701",
    rut: "78.000.171-2",
    accountHolder: "INGENIT SpA",
    email: "gerencia@ingenit.cl"
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías agregar una notificación de que se copió
  };

  const copyAllBankData = () => {
    const bankDataText = `Datos Bancarios de INGENIT SpA

Banco: ${bankData.bankName}
Tipo de Cuenta: ${bankData.accountType}
Número de Cuenta: ${bankData.accountNumber}
RUT: ${bankData.rut}
Titular: ${bankData.accountHolder}

Plan: ${planName}
Monto: $${planPrice.toLocaleString('es-CL')} CLP

Para consultas: ${bankData.email}`;

    navigator.clipboard.writeText(bankDataText);
    alert('Datos bancarios copiados al portapapeles');
  };

  const sendBankDetailsEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/send-bank-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          planName,
          planPrice,
          bankData
        })
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        throw new Error('Error al enviar el correo');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar el correo. Por favor, contacta a soporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setUploadingReceipt(true);
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Subir archivo a storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/receipts/transfer-receipt-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hotel')
        .upload(fileName, file, {
          upsert: false,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Error uploading receipt:', uploadError);
        alert(`Error al subir el comprobante: ${uploadError.message}`);
        return;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('hotel')
        .getPublicUrl(fileName);

      // Actualizar la suscripción con la URL del comprobante usando SQL directo
      const { error: updateError } = await supabase
        .from('hl_user_subscriptions')
        .update({ 
          transfer_receipt_url: publicUrl
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        alert(`Error al guardar el comprobante: ${updateError.message}`);
        return;
      }

      setReceiptUploaded(true);
      alert('Comprobante subido exitosamente. Tu pago será procesado en un plazo máximo de 24 horas.');

    } catch (error) {
      console.error('Error handling receipt upload:', error);
      alert('Error al procesar el comprobante');
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transferencia Bancaria</h2>
            <p className="text-gray-600 mt-1">Datos bancarios para realizar el pago</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Info */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <div className="w-2 h-2 bg-blue7 rounded-full mr-2"></div>
              Plan Seleccionado
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{planName}</span>
              <span className="font-bold text-blue1 text-lg">${planPrice.toLocaleString('es-CL')} CLP</span>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-blue13 border border-gray-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <div className="w-8 h-8 bg-blue7 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                Datos Bancarios de INGENIT
              </h3>
              <Button
                onClick={copyAllBankData}
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-400 hover:bg-gray-100 hover:border-gray-500 transition-colors"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Datos
              </Button>
            </div>
            
            <div className="space-y-3 bg-white bg-opacity-80 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Banco:</span>
                <span className="font-semibold text-gray-800">{bankData.bankName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Tipo de Cuenta:</span>
                <span className="font-semibold text-gray-800">{bankData.accountType}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Número de Cuenta:</span>
                <span className="font-bold font-mono text-blue1 text-lg px-3 py-1 border-gray-300">{bankData.accountNumber}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">RUT:</span>
                <span className="font-bold font-mono text-blue1 px-3 py-1 border-gray-300">{bankData.rut}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Titular:</span>
                <span className="font-semibold text-gray-800">{bankData.accountHolder}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue13 border border-gray-300 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-8 h-8 bg-blue7 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Instrucciones
            </h3>
            <div className="bg-white bg-opacity-80 rounded-lg p-3 border border-gray-200">
              <ul className="text-gray-700 text-sm space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Realiza la transferencia por el monto exacto: <strong className="text-blue1">${planPrice.toLocaleString('es-CL')} CLP</strong></span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>En el concepto, incluye tu email: <strong className="text-blue1">{userEmail}</strong></span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Una vez realizada la transferencia, sube el comprobante aquí o envíalo a: <strong className="text-blue1">{bankData.email}</strong></span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue7 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Tu suscripción se activará en un plazo máximo de 24 horas</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Email Section */}
          <div className="bg-blue13 border border-gray-300 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-8 h-8 bg-blue7 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <Mail className="h-4 w-4 text-white" />
              </div>
              Envío de Datos por Correo
            </h3>
            <div className="bg-white bg-opacity-80 rounded-lg p-3 mb-3 border border-gray-200">
              <p className="text-gray-700 text-sm">
                Te enviaremos estos datos bancarios a tu correo registrado: <strong className="text-blue1">{userEmail}</strong>
              </p>
            </div>
            
            {emailSent ? (
              <div className="flex items-center text-blue6 rounded-lg p-3 border border-gray-300">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">¡Correo enviado exitosamente!</span>
              </div>
            ) : (
              <Button
                onClick={sendBankDetailsEmail}
                disabled={loading}
                className="bg-blue7 hover:bg-blue7 text-white shadow-md transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Enviar Datos por Correo
              </Button>
            )}
          </div>

          {/* Receipt Upload Section */}
          <div className="bg-blue13 border border-gray-300 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-8 h-8 bg-blue7 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <Upload className="h-4 w-4 text-white" />
              </div>
              Subir Comprobante de Transferencia
            </h3>
            <div className="bg-white bg-opacity-80 rounded-lg p-3 mb-3 border border-gray-200">
              <p className="text-gray-700 text-sm">
                Una vez realizada la transferencia, sube el comprobante para acelerar el proceso de activación.
              </p>
            </div>
            
            {receiptUploaded ? (
              <div className="flex items-center text-blue6 rounded-lg p-3 border border-gray-300">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">¡Comprobante subido exitosamente!</span>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleReceiptUpload(file);
                    }
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingReceipt}
                  className="bg-blue7 hover:bg-blue7 text-white shadow-md transition-all duration-200"
                >
                  {uploadingReceipt ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploadingReceipt ? 'Subiendo...' : 'Seleccionar Comprobante'}
                </Button>
                <p className="text-sm text-gray4 rounded px-2 py-1 border border-gray-300">
                  Formatos aceptados: JPG, PNG, PDF (máximo 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
