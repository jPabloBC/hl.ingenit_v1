# 📁 Estructura del Proyecto - RH.INGENIT

## 🧹 Limpieza Completada

**Antes:** 162 archivos SQL de debugging/testing  
**Después:** 10 archivos SQL funcionales únicamente

---

## 📂 Archivos SQL Funcionales (Root)

### 🔧 Scripts de Configuración Principal
- `SETUP-DATABASE.md` - Documentación de configuración de base de datos
- `create-rh-passengers.sql` - Creación de tabla y funciones de pasajeros
- `create-rh-reservations.sql` - Creación de sistema de reservas
- `create-room-availability-system.sql` - Sistema de disponibilidad de habitaciones

### 🛠️ Scripts de Funcionalidades
- `create-reservations-query-function.sql` - Funciones para consultar reservas
- `create-guests-functions.sql` - Funciones para gestión de huéspedes
- `fix-guests-functions-simple.sql` - Versión simplificada de funciones de huéspedes

### 🔨 Scripts de Corrección
- `fix-room-availability-complete.sql` - Corrección completa del sistema de disponibilidad
- `fix-reservations-group-by-error.sql` - Corrección de errores SQL en reservas
- `fix-syntax-error.sql` - Corrección de errores de sintaxis
- `fix-final-reservation-issues.sql` - Solución final para problemas de reservas

---

## 🗂️ Estructura de Directorios

```
rh.ingenit_v1/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── business-type/
│   │   │       └── hotel/
│   │   │           ├── page.tsx              # Dashboard principal
│   │   │           ├── rooms/page.tsx        # Gestión de habitaciones
│   │   │           ├── reservations/page.tsx # Gestión de reservas
│   │   │           ├── guests/page.tsx       # Gestión de huéspedes
│   │   │           ├── sales/page.tsx        # Venta de habitaciones
│   │   │           └── admin/page.tsx        # Administración
│   │   ├── login/page.tsx                    # Página de login
│   │   ├── register/page.tsx                 # Página de registro
│   │   └── globals.css                       # Estilos globales
│   ├── components/
│   │   ├── layout/
│   │   │   ├── hotel-layout.tsx             # Layout principal del hotel
│   │   │   └── base-layout.tsx              # Layout base
│   │   └── ui/
│   │       └── button.tsx                   # Componente de botón
│   └── lib/
│       └── supabase.ts                      # Configuración de Supabase
├── public/                                  # Archivos estáticos
├── node_modules/                           # Dependencias
├── *.sql                                   # Scripts SQL funcionales (10 archivos)
├── package.json                            # Configuración del proyecto
├── next.config.ts                          # Configuración de Next.js
├── tailwind.config.ts                      # Configuración de Tailwind
├── tsconfig.json                           # Configuración de TypeScript
└── README.md                               # Documentación del proyecto
```

---

## 🚀 Archivos Eliminados

Se eliminaron **~152 archivos** de debugging y testing que no eran funcionales:
- `check-*.sql` (archivos de verificación)
- `debug-*.sql` (archivos de debugging)
- `test-*.sql` (archivos de testing)
- `fix-*-old.sql` (versiones obsoletas)
- `diagnose-*.sql` (archivos de diagnóstico)
- `test-*.js` (scripts de testing JavaScript)
- Y muchos otros archivos temporales de desarrollo

---

## ✅ Estado Actual

**El proyecto está ahora limpio y organizado con:**
- ✅ Solo archivos funcionales en el root
- ✅ Estructura de código clara en `/src`
- ✅ Scripts SQL esenciales mantenidos
- ✅ Archivos de configuración preservados
- ✅ Sin archivos de debugging/testing innecesarios

**Total de archivos SQL:** De 162 → 10 (reducción del 94%)





