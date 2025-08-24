# 🏨 ShIngenit - Plataforma de Alojamientos y Servicios

Una plataforma moderna y multiplataforma para hoteles, hospedajes, moteles, restaurantes, bares y servicios turísticos.

## 🚀 Tecnologías

- **Frontend**: Next.js 15.5.0 + React 19.1.1
- **Backend**: Supabase
- **Deploy**: Vercel
- **Multiplataforma**: Capacitor 7.4.3
- **UI**: Tailwind CSS + Radix UI
- **Iconos**: Lucide React
- **Tipado**: TypeScript

## ✨ Características

- 🌐 **Web App** - Aplicación web moderna y responsive
- 📱 **iOS App** - Aplicación nativa para iPhone/iPad
- 🤖 **Android App** - Aplicación nativa para Android
- 🔐 **Autenticación** - Sistema de login/registro con Supabase
- 🗄️ **Base de Datos** - PostgreSQL con Supabase
- 🎨 **UI Moderna** - Diseño limpio y profesional
- ⚡ **Rendimiento** - Optimizado para velocidad

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sh.ingenit_v1
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 📱 Desarrollo Móvil

### Agregar plataformas móviles
```bash
# iOS
npx cap add ios

# Android
npx cap add android
```

### Sincronizar cambios
```bash
npm run build
npx cap sync
```

### Abrir en IDEs nativos
```bash
# iOS (Xcode)
npm run cap:ios

# Android (Android Studio)
npm run cap:android
```

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Exportar para Capacitor
npm run export

# Linting
npm run lint

# Sincronizar con móvil
npm run cap:sync
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Dashboard de negocios
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI base
│   └── layout/           # Componentes de layout
├── lib/                  # Utilidades y configuraciones
│   ├── supabase.ts       # Cliente Supabase
│   ├── supabase-server.ts # Supabase SSR
│   └── utils.ts          # Utilidades generales
├── types/                # Tipos TypeScript
├── hooks/                # Custom hooks
└── utils/                # Funciones utilitarias
```

## 🎯 Próximos Pasos

- [ ] Configurar Supabase y crear tablas
- [ ] Implementar autenticación
- [ ] Crear sistema de reservas
- [ ] Agregar mapas y geolocalización
- [ ] Implementar sistema de pagos
- [ ] Crear dashboard para negocios
- [ ] Agregar sistema de reviews
- [ ] Implementar notificaciones push

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Email**: contacto@shingenit.com
- **Website**: https://shingenit.com
- **Twitter**: [@shingenit](https://twitter.com/shingenit)

---

Desarrollado con ❤️ por el equipo de ShIngenit
