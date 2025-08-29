import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray8 mt-0 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Logo variant="default" size="md" />
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-blue1 hover:text-blue8 font-body text-sm sm:text-base">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/business-type">
              <Button className="bg-blue8 hover:bg-blue6 text-white font-body text-sm sm:text-base px-3 sm:px-4">
                Registrar mi Negocio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
