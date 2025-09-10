-- Agregar campo para comprobante de transferencia
ALTER TABLE app_hl.hl_user_subscriptions 
ADD COLUMN transfer_receipt_url TEXT;

-- Comentario para el campo
COMMENT ON COLUMN app_hl.hl_user_subscriptions.transfer_receipt_url IS 'URL del comprobante de transferencia bancaria subido por el usuario';
