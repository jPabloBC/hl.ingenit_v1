import { WebpayPlus, Options, Environment } from 'transbank-sdk';

const INTEGRATION_COMMERCE_CODE = '597055555532';
const INTEGRATION_API_KEY =
  '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

export const isProduction = () => process.env.NODE_ENV === 'production';

export const getTransbankOptions = () => {
  const commerce =
    process.env.WEBPAY_COMMERCE_CODE || INTEGRATION_COMMERCE_CODE;
  const apiKey = process.env.WEBPAY_API_KEY || INTEGRATION_API_KEY;

  // Forzar ambiente de integración para testing con credenciales de desarrollo
  const env = Environment.Integration;

  return new Options(commerce, apiKey, env);
};

export const getWebpayUrls = () => {
  // Para producción, usar la URL de la app desplegada
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hl.ingenit.cl';
  return {
    returnUrl: `${baseUrl}/api/webpay/return`,
    finalSuccessUrl: `${baseUrl}/hotel?payment=success`,
    finalCancelUrl: `${baseUrl}/hotel?payment=error&message=Pago cancelado`,
    baseUrl,
  };
};

export const validateTransbankConfig = () => {
  if (isProduction()) {
    const missing = ['WEBPAY_COMMERCE_CODE', 'WEBPAY_API_KEY']
      .filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
    }
  }
  return true;
};

export const createWebpayPlus = () => {
  validateTransbankConfig();
  return new WebpayPlus.Transaction(getTransbankOptions());
};