# Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Webpay Plus (Transbank)
# Para ambiente de integración (testing)
WEBPAY_COMMERCE_CODE=597055555532
WEBPAY_API_KEY=579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C

# Para ambiente de producción (reemplazar con credenciales reales)
# WEBPAY_COMMERCE_CODE=your_production_commerce_code
# WEBPAY_API_KEY=your_production_api_key
# WEBPAY_ENVIRONMENT=production
```

## Notas Importantes:

1. **Ambiente de Integración**: Las credenciales incluidas son para testing de Transbank
2. **Producción**: Debes obtener credenciales reales de Transbank para producción
3. **URL de la App**: Cambiar por tu dominio en producción
