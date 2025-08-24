# ShIngenit - Configuración Inicial

## Información de la Empresa

**INGENIT SpA**
- RUT: 78.000.171-2
- Correo: gerencia@ingenit.cl
- Webhook: https://ingenit.cl/api/webhook

### Cuentas Bancarias:
- **Scotiabank**: Cuenta Corriente 991937153
- **BancoEstado**: Chequera Electrónica 2573422701

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# INGENIT Configuration
NEXT_PUBLIC_COMPANY_NAME=INGENIT SpA
NEXT_PUBLIC_COMPANY_RUT=78.000.171-2
NEXT_PUBLIC_COMPANY_EMAIL=gerencia@ingenit.cl
NEXT_PUBLIC_WEBHOOK_URL=https://ingenit.cl/api/webhook
```

## Configuración de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la URL y la anon key del proyecto
4. Actualiza las variables de entorno

## Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Exportar para Capacitor
npm run export

# Agregar plataformas móviles
npx cap add ios
npx cap add android

# Sincronizar con móvil
npx cap sync
```

## Estructura del Proyecto

```
src/
├── app/                 # App Router (Next.js 15)
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI base
│   └── layout/         # Componentes de layout
├── lib/                # Utilidades y configuraciones
├── types/              # Tipos TypeScript
├── hooks/              # Custom hooks
└── utils/              # Funciones utilitarias
```

## Paleta de Colores INGENIT

### Azules:
- blue1: #001a33 (Azul oscuro principal)
- blue8: #0078ff (Azul principal)
- blue10: #3393ff (Azul claro)
- blue15: #cce4ff (Azul muy claro)

### Grises:
- gray1: #1a1a1a (Gris muy oscuro)
- gray4: #666666 (Gris medio)
- gray8: #cccccc (Gris claro)
- gray10: #f2f2f2 (Gris muy claro)

### Dorados:
- gold3: #daa520 (Dorado principal)
- gold7: #f8edd2 (Dorado claro)

