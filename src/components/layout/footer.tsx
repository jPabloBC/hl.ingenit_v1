import { APP_CONFIG, COMPANY_INFO } from "@/lib/constants";
import Logo from "@/components/ui/logo";
import { Building2, Mail, Phone, MapPin, Clock, Shield, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue1 text-white mt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <Logo variant="white" size="md" showLink={false} />
            </div>
            <p className="text-blue11 font-body text-sm sm:text-base mb-4 max-w-md">
              Plataforma de gestión hotelera desarrollada por INGENIT SpA. 
              Optimiza las operaciones de tu hotel con tecnología y soporte local.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center text-blue11 text-sm">
                <Shield className="h-4 w-4 mr-2 text-blue8" />
                <span>Certificado SII Chile</span>
              </div>
              <div className="flex items-center text-blue11 text-sm">
                <Users className="h-4 w-4 mr-2 text-blue8" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
          
          {/* Solutions */}
          <div>
            <h3 className="font-semibold mb-4 font-title text-base flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-blue10" strokeWidth={1}/>
              Soluciones Hoteleras
            </h3>
            <ul className="space-y-2 text-blue11 font-body text-sm">
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Planes y Precios
                </Link>
              </li>
              <li>
                <Link href="/register?type=hotel" className="hover:text-white transition-colors">
                  Demo Gratuito
                </Link>
              </li>
              <li>
                <Link href="/summary/hotel" className="hover:text-white transition-colors">
                  Características
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Integraciones
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 font-title text-base flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-blue10" strokeWidth={1}/>
              Empresa
            </h3>
            <ul className="space-y-2 text-blue11 font-body text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Sobre INGENIT
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Carreras
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog Hotelero
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact & Support Section */}
        <div className="bg-blue2 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center">
              <div className="bg-blue8 rounded-full p-2 mr-3">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-blue11 text-xs font-body">Email</p>
                <p className="text-white text-sm font-normal">{COMPANY_INFO.email}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-blue8 rounded-full p-2 mr-3">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-blue11 text-xs font-body">Teléfono</p>
                <p className="text-white text-sm font-normal">+56 9 9020 6618</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-green-600 rounded-full p-2 mr-3">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </div>
              <div>
                <p className="text-blue11 text-xs font-body">WhatsApp</p>
                <p className="text-white text-sm font-normal">+56 9 9020 6618</p>
                <p className="text-white text-sm font-normal">+56 9 7538 5487</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-blue8 rounded-full p-2 mr-3">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-blue11 text-xs font-body">Ubicación</p>
                <p className="text-white text-sm font-normal">Chile</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-blue3 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="font-body text-sm text-blue11">
                &copy; 2024 {APP_CONFIG.name}. Todos los derechos reservados.
              </p>
              <p className="text-xs text-blue11 mt-1 font-body">
                {COMPANY_INFO.name}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-xs text-blue11">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
              <Link href="/security" className="hover:text-white transition-colors">
                Seguridad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}