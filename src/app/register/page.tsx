"use client";
// Validador de RUT chileno
function validarRut(rut: string): boolean {
  rut = rut.replace(/[^\dkK]/gi, '').toUpperCase();
  if (!/^\d{7,8}[\dkK]$/.test(rut)) return false;
  let cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1);
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  let dvEsperadoNum = 11 - (suma % 11);
  let dvEsperado = dvEsperadoNum === 11 ? '0' : dvEsperadoNum === 10 ? 'K' : dvEsperadoNum.toString();
  return dv === dvEsperado;
}
import { Button } from "@/components/ui/button";
import { useState } from "react";
// Ejemplo simple de datos de países, regiones y ciudades
const countries = [
  { code: "CL", name: "Chile", phone: "+56", regions: [
    { name: "Región Metropolitana", cities: ["Santiago", "Puente Alto", "Maipú"] },
    { name: "Antofagasta", cities: ["Antofagasta", "Calama"] },
  ]},
  { code: "AR", name: "Argentina", phone: "+54", regions: [
    { name: "Buenos Aires", cities: ["Buenos Aires", "La Plata"] },
    { name: "Córdoba", cities: ["Córdoba", "Villa Carlos Paz"] },
  ]},
  { code: "PE", name: "Perú", phone: "+51", regions: [
    { name: "Lima", cities: ["Lima", "Miraflores"] },
    { name: "Arequipa", cities: ["Arequipa"] },
  ]},
  // Agrega más países de América según necesidad
];
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BaseLayout from "@/components/layout/base-layout";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  // Permitir ambos: ?type=restaurant y ?businessType=restaurant
  const type = searchParams.get("type") || searchParams.get("businessType") || "hotel";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setPasswordError("");
    setLoading(true);
    
    if (password !== password2) {
      setPasswordError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    // Obtener datos del formulario
    const form = e.currentTarget;
    const name = (form.querySelector('input[placeholder="Juan Pérez"], input[placeholder="Nombre del Responsable"]') as HTMLInputElement)?.value || "";
    const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";
    
    // Obtener código de país seleccionado
    const countryObj = countries.find(c => c.code === country);
    let phoneValue = phone;
    if (countryObj && phone) {
      // Concatenar código de país (sin +) y número, solo dígitos
      const code = countryObj.phone.replace('+', '');
      const digits = phone.replace(/\D/g, '');
      phoneValue = code + digits;
    }
    
    const businessName = (form.querySelector('input[placeholder="Restaurante Ejemplo"], input[placeholder="Hotel Paradise"]') as HTMLInputElement)?.value || "";
    const rut = (form.querySelector('input[placeholder="12.345.678-9"]') as HTMLInputElement)?.value || "";
    const address = (form.querySelector('input[placeholder^="Av. Principal"]') as HTMLInputElement)?.value || "";
    const roomsCount = type === "hotel" ? parseInt((form.querySelector('input[placeholder="25"]') as HTMLInputElement)?.value || "0") : 0;
    const businessType = type;
    const countryValue = country;
    const regionValue = region;
    const cityValue = city;

    // Validar RUT chileno
    if (!validarRut(rut)) {
      setError("El RUT del establecimiento no es válido. Por favor verifica el número.");
      setLoading(false);
      return;
    }

    try {
      // ENFOQUE ALTERNATIVO: Crear usuario sin metadata primero
      console.log('Intentando registro con:', { email, password: '***', name, phoneValue });
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
          data: { 
            display_name: name, 
            phone: phoneValue, // Phone in metadata
            business_name: businessName,
            business_type: businessType,
            rut: rut,
            address: address,
            country: countryValue,
            region: regionValue,
            city: cityValue,
            role: 'customer' // Add default role to metadata
          }
        }
      });

      console.log('Respuesta de Supabase Auth:', { signUpData, signUpError });

      if (signUpError) {
        console.error('Error de Supabase Auth:', signUpError);
        setError("Error al crear usuario: " + signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData?.user) {
        console.log("Usuario registrado exitosamente:", signUpData.user.id);
        
        // Since we now use UUIDs, we can use the auth.users ID directly
        console.log("Using auth user ID for business:", signUpData.user.id);

        // Crear la entrada en la tabla de negocios usando el UUID de auth.users directamente
        const { error: businessError } = await supabase
          .from('hl_business')
          .insert({
            user_id: signUpData.user.id, // Usar el UUID de auth.users directamente
            business_type: businessType,
            business_name: businessName, // Cambiar name a business_name para consistencia
            rut: rut,
            address: address,
            country: countryValue,
            region: regionValue,
            city: cityValue,
            rooms_count: roomsCount,
            status: 'active'
          });

        if (businessError) {
          console.error('Error creating business record:', businessError);
          setError("Error al crear el perfil de negocio: " + businessError.message);
          setLoading(false);
          return;
        }

        console.log("Negocio creado exitosamente para usuario:", signUpData.user.id);

        // Enviar email de verificación personalizado
        try {
          const verificationResponse = await fetch('/api/send-verification-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              name: name
            })
          });

          if (verificationResponse.ok) {
            const responseData = await verificationResponse.json();
            if (responseData.emailSent) {
              setInfo("¡Registro exitoso! Revisa tu correo para verificar tu cuenta antes de iniciar sesión. El correo puede tardar unos minutos en llegar.");
            } else if (responseData.verificationUrl) {
              setInfo(`¡Registro exitoso! Para desarrollo: Copia y pega esta URL en tu navegador para verificar tu email: ${responseData.verificationUrl}`);
            } else {
              setInfo("¡Registro exitoso! Revisa tu correo para verificar tu cuenta antes de iniciar sesión.");
            }
          } else {
            const errorData = await verificationResponse.json().catch(() => ({}));
            console.error('Email verification error:', errorData);
            setInfo(`¡Registro exitoso! Sin embargo, hubo un problema enviando el email de verificación: ${errorData.error || 'Error desconocido'}`);
          }
        } catch (verificationError) {
          console.error('Error sending verification email:', verificationError);
          setInfo("¡Registro exitoso! Sin embargo, hubo un problema enviando el email de verificación. Contacta soporte.");
        }
        
        // Redireccionar a login después de 7 segundos
        setTimeout(() => {
          router.push('/login');
        }, 7000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError("Error inesperado durante el registro. Por favor, intenta nuevamente.");
    }
    
    setLoading(false);
  }

  return (
    <BaseLayout>
  <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8">
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
            {type === "restaurant" ? "Registro de Restaurante" : "Registro de Hotel"}
          </h1>
          <p className="text-xl text-gray4 font-body">
            {type === "restaurant"
              ? "Completa los datos de tu restaurante para acceder a la plataforma de gestión de INGENIT."
              : "Completa los datos de tu hotel para acceder a la plataforma de gestión de INGENIT."}
          </p>
        </div>

  <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 border border-gray8">
          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            {type === "restaurant" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    Nombre del Restaurante
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body capitalize"
                    placeholder="Restaurante Ejemplo"
                    style={{ textTransform: 'capitalize' }}
                    autoCapitalize="words"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    RUT del Restaurante
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body rut-input"
                    placeholder="12.345.678-9"
                    pattern="^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$"
                    title="Formato: 12.345.678-9"
                    onInput={e => {
                      let value = e.currentTarget.value.replace(/[^\dkK]/g, '');
                      if (value.length > 1) value = value.replace(/(\d{1,2})(\d{1,3})(\d{1,3})([\dkK]?)/, '$1.$2.$3-$4');
                      e.currentTarget.value = value;
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    Nombre del Establecimiento
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body capitalize"
                    placeholder="Hotel Paradise"
                    style={{ textTransform: 'capitalize' }}
                    autoCapitalize="words"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    RUT del Establecimiento
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body rut-input"
                    placeholder="12.345.678-9"
                    pattern="^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$"
                    title="Formato: 12.345.678-9"
                    onInput={e => {
                      let value = e.currentTarget.value.replace(/[^\dkK]/g, '');
                      if (value.length > 1) value = value.replace(/(\d{1,2})(\d{1,3})(\d{1,3})([\dkK]?)/, '$1.$2.$3-$4');
                      e.currentTarget.value = value;
                    }}
                  />
                </div>
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Nombre del Responsable
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body capitalize"
                  placeholder="Juan Pérez"
                  style={{ textTransform: 'capitalize' }}
                  autoCapitalize="words"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                  Email de Contacto
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body lowercase"
                  placeholder="contacto@hotel.com"
                  style={{ textTransform: 'lowercase' }}
                  autoCapitalize="none"
                  onInput={e => { e.currentTarget.value = e.currentTarget.value.toLowerCase(); }}
                />
              </div>
            </div>


            {/* Teléfono y contraseñas en filas separadas */}

            {/* Teléfono, contraseña y verificación en una sola fila */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">Teléfono</label>
                <div className="flex">
                  <select
                    className="border border-gray-300 rounded-l-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body bg-white"
                    value={country ? countries.find(c => c.code === country)?.phone : ""}
                    onChange={() => {}} // Solo visual, no cambia el país de dirección
                  >
                    <option value="+56">🇨🇱 +56</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="other">Otro</option>
                  </select>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                    placeholder="9 1234 5678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Contraseña
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body pr-10"
                    placeholder="Crea una contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="absolute right-2 top-2" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Verificar Contraseña
                </label>
                <div className="relative">
                  <input
                    name="password2"
                    type={showPassword2 ? "text" : "password"}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body pr-10"
                    placeholder="Repite la contraseña"
                    value={password2}
                    onChange={e => setPassword2(e.target.value)}
                  />
                  <button type="button" className="absolute right-2 top-2" tabIndex={-1} onClick={() => setShowPassword2(v => !v)}>
                    {showPassword2 ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                {passwordError && <div className="text-red-600 font-body text-sm mt-1">{passwordError}</div>}
              </div>
            </div>

            {/* País, región y ciudad para la dirección del negocio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">País</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  value={country}
                  onChange={e => {
                    setCountry(e.target.value);
                    setRegion("");
                    setCity("");
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">Departamento / Región</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  value={region}
                  onChange={e => {
                    setRegion(e.target.value);
                    setCity("");
                  }}
                  disabled={!country}
                >
                  <option value="">Seleccionar...</option>
                  {country && countries.find(c => c.code === country)?.regions.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue1 mb-2 font-title">Ciudad / Comuna</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  disabled={!region}
                >
                  <option value="">Seleccionar...</option>
                  {country && region && countries.find(c => c.code === country)?.regions.find(r => r.name === region)?.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
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

            {type === "restaurant" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    Tipo de Restaurante
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body" id="tipo-restaurante" onChange={e => {
                    const otherInput = document.getElementById('otro-restaurante');
                    if (otherInput) otherInput.style.display = e.target.value === 'otro' ? 'block' : 'none';
                  }}>
                    <option value="">Seleccionar...</option>
                    <option value="bar">Bar</option>
                    <option value="cafeteria">Cafetería</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="foodtruck">Food Truck</option>
                    <option value="otro">Otros</option>
                  </select>
                  <input id="otro-restaurante" style={{display:'none',marginTop:8}} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body" placeholder="Especifique otro tipo de restaurante" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    Número de Mesas
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                    placeholder="20"
                    min="1"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    Tipo de Hospedaje
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body" id="tipo-hospedaje" onChange={e => {
                    const otherInput = document.getElementById('otro-hospedaje');
                    if (otherInput) otherInput.style.display = e.target.value === 'otro' ? 'block' : 'none';
                  }}>
                    <option value="">Seleccionar...</option>
                    <option value="hotel">Hotel</option>
                    <option value="hostal">Hostal</option>
                    <option value="residencial">Residencial</option>
                    <option value="apartHotel">Apart Hotel</option>
                    <option value="cabañas">Cabañas</option>
                    <option value="camping">Camping</option>
                    <option value="otro">Otros</option>
                  </select>
                  <input id="otro-hospedaje" style={{display:'none',marginTop:8}} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body" placeholder="Especifique otro tipo de hospedaje" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue1 mb-2 font-title">
                    Número de Habitaciones
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                    placeholder="25"
                    min="1"
                  />
                </div>
              </div>
            )}

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
              <Button
                type="submit"
                size="lg"
                className="bg-blue8 hover:bg-blue6 text-white font-body flex-1"
                disabled={loading}
              >
                {loading ? "Registrando..." : "Completar Registro y Acceder"}
              </Button>
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
            {error && <div className="text-red-600 font-body text-sm mt-2 text-center">{error}</div>}
            {info && (
              <div className="text-yellow-600 font-body text-base mt-4 text-center w-full bg-yellow-50 border border-yellow-200 rounded-lg px-6 py-2 shadow-sm">
                {info}
              </div>
            )}
          </form>
        </div>
      </div>
    </BaseLayout>
  );
}
