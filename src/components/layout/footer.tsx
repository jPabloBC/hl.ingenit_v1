import { APP_CONFIG, COMPANY_INFO } from "@/lib/constants";
import Logo from "@/components/ui/logo";

export default function Footer() {
  return (
    <footer className="bg-blue1 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Logo variant="white" size="md" showLink={false} />
            </div>
            <p className="text-blue11 font-body text-sm sm:text-base">
              Plataforma desarrollada por INGENIT SpA para gestión de negocios de hospedaje y gastronomía.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 font-title text-sm sm:text-base">Soluciones</h3>
            <ul className="space-y-2 text-blue11 font-body text-xs sm:text-sm">
              <li>Hoteles</li>
              <li>Restaurantes</li>
              <li>Bares</li>
              <li>Cafeterías</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 font-title text-sm sm:text-base">Empresa</h3>
            <ul className="space-y-2 text-blue11 font-body text-xs sm:text-sm">
              <li>Sobre INGENIT</li>
              <li>Contacto</li>
              <li>Desarrollo</li>
              <li>Soporte</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 font-title text-sm sm:text-base">Contacto</h3>
            <ul className="space-y-2 text-blue11 font-body text-xs sm:text-sm">
              <li>{COMPANY_INFO.email}</li>
              <li>RUT: {COMPANY_INFO.rut}</li>
              <li>Chile</li>
              <li>Webhook: {COMPANY_INFO.webhook}</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue3 mt-8 pt-8 text-center text-blue11">
          <p className="font-body text-sm sm:text-base">&copy; 2024 {APP_CONFIG.name}. Todos los derechos reservados.</p>
          <p className="text-xs sm:text-sm mt-2 font-body">{COMPANY_INFO.name} - RUT: {COMPANY_INFO.rut}</p>
        </div>
      </div>
    </footer>
  );
}
