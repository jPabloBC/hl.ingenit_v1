import { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } from 'transbank-sdk';

// Configuración para ambiente de integración (sandbox)
// En producción cambiar por credenciales reales
const commerceCode = IntegrationCommerceCodes.WEBPAY_PLUS;
const apiKey = IntegrationApiKeys.WEBPAY;
const environment = Environment.Integration; // Cambiar a Environment.Production en producción

// Configurar Webpay Plus
const tx = new WebpayPlus.Transaction(new Options(commerceCode, apiKey, environment));

export { tx as webpayTransaction };

// Tipos para TypeScript
export interface WebpayCreateResponse {
  token: string;
  url: string;
}

export interface WebpayCommitResponse {
  vci: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail: {
    card_number: string;
  };
  accounting_date: string;
  transaction_date: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_number: number;
}

// Utilidades para formatear montos
export const formatAmount = (amount: number): number => {
  // Webpay requiere montos en pesos chilenos sin decimales
  return Math.round(amount);
};

// Generar orden única
export const generateBuyOrder = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RH-${timestamp}-${random}`;
};

// URLs de retorno (configurar según tu dominio)
export const getReturnUrls = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    returnUrl: `${baseUrl}/api/webpay/return`,
    finalUrl: `${baseUrl}/business-type/hotel/payments/success`
  };
};





