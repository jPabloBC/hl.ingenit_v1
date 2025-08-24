import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BaseLayout from "@/components/layout/base-layout";

export default function RegisterPage() {
  return (
    <BaseLayout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link href="/business-type">
              <Button variant="ghost" className="text-blue1 hover:text-blue8 font-body">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-blue1 mb-4 font-title">
            Registro de Establecimiento
          </h1>
          <p className="text-xl text-gray4 font-body">
            Completa los datos de tu negocio para acceder a la plataforma de gestión de INGENIT.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray8">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Nombre del Establecimiento
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  placeholder="Hotel Paradise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  RUT del Establecimiento
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  placeholder="12.345.678-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Nombre del Responsable
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  placeholder="contacto@hotel.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Ciudad
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  placeholder="Santiago"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                Dirección
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                placeholder="Av. Principal 123, Las Condes"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Tipo de Negocio
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body">
                  <option value="">Seleccionar...</option>
                  <option value="hotel">Hotel</option>
                  <option value="restaurant">Restaurant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Número de Habitaciones/Mesas
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  placeholder="25"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                Comentarios Adicionales
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                placeholder="Describe cualquier necesidad específica de tu negocio..."
              ></textarea>
            </div>

            <div className="bg-blue15 p-4 rounded-lg">
              <h3 className="font-semibold text-blue1 mb-2 font-title">
                ¿Qué sucede después del registro?
              </h3>
              <ul className="text-sm text-blue1 font-body space-y-1">
                <li>• Acceso inmediato a tu plataforma de gestión</li>
                <li>• Configuración automática según tu tipo de negocio</li>
                <li>• Tutorial interactivo para comenzar</li>
                <li>• Soporte técnico 24/7 de INGENIT SpA</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/admin">
                <Button
                  type="button"
                  size="lg"
                  className="bg-blue8 hover:bg-blue6 text-white font-body flex-1"
                >
                  Completar Registro y Acceder
                </Button>
              </Link>
              <Link href="/business-type">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="border-blue8 text-blue8 hover:bg-blue15 font-body w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </BaseLayout>
  );
}
