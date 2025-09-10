"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, User, Lock, ArrowLeft, Users, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionGate from "@/components/PermissionGate";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  role_id: string;
  hl_user_roles: {
    name: string;
    display_name: string;
  };
}

export default function SwitchUserPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      // Obtener business_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: businessData } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (!businessData) return;

      // Cargar empleados con roles
      const { data: employeesData } = await supabase
        .from('hl_employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          department,
          position,
          role_id,
          hl_user_roles (
            name,
            display_name
          )
        `)
        .eq('business_id', businessData.id)
        .not('email', 'is', null)
        .order('first_name');

      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setSwitching(true);
    setError("");

    try {
      // Intentar login con las credenciales del empleado
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: selectedEmployee.email,
        password: password,
      });

      if (authError) {
        setError("Contraseña incorrecta para este empleado");
        return;
      }

      if (!data.user) {
        setError("Error al cambiar de usuario");
        return;
      }

      // Verificar que el empleado tiene rol asignado
      const { data: userData, error: userError } = await supabase
        .from('hl_user')
        .select(`
          id,
          role_id,
          is_owner,
          hl_user_roles (
            name,
            display_name
          )
        `)
        .eq('id', data.user.id)
        .single();

      if (userError || !userData || userData.is_owner) {
        setError("Usuario no válido para cambio de rol");
        await supabase.auth.signOut();
        return;
      }

      // Cambio exitoso - redirigir al dashboard
      router.push('/hotel');
      
    } catch (error) {
      console.error('Error switching user:', error);
      setError("Error interno del servidor");
    } finally {
      setSwitching(false);
    }
  };

  const handleBackToOwner = async () => {
    // Volver al login principal para que el owner se autentique nuevamente
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4">Cargando empleados...</p>
        </div>
      
    );
  }

  return (
    
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">Cambiar a Empleado</h1>
            <p className="text-gray4 font-body">Accede al sistema como uno de tus empleados</p>
          </div>
          <Button 
            onClick={handleBackToOwner}
            variant="outline"
            className="border-blue8 text-blue8 hover:bg-blue15"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Propietario
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Empleados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Seleccionar Empleado
              </CardTitle>
              <CardDescription>
                Elige el empleado al que quieres acceder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => setSelectedEmployee(employee)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmployee?.id === employee.id
                        ? 'border-blue8 bg-blue15'
                        : 'border-gray8 hover:border-blue8 hover:bg-gray10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue1">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <p className="text-sm text-gray4">{employee.email}</p>
                        <p className="text-sm text-gray4">
                          {employee.department} • {employee.position}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue15 text-blue8">
                          <Shield className="h-3 w-3 mr-1" />
                          {employee.hl_user_roles?.display_name || 'Sin rol'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {employees.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray4 mx-auto mb-4" />
                  <p className="text-gray4">No hay empleados con acceso al sistema</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulario de Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle>Confirmar Acceso</CardTitle>
              <CardDescription>
                Ingresa la contraseña del empleado seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <form onSubmit={handleSwitchUser} className="space-y-4">
                  <div className="bg-blue15 border border-blue8 rounded-lg p-4">
                    <h3 className="font-semibold text-blue1 mb-2">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h3>
                    <p className="text-sm text-gray4">{selectedEmployee.email}</p>
                    <p className="text-sm text-gray4">
                      {selectedEmployee.department} • {selectedEmployee.position}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue8 text-white mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      {selectedEmployee.hl_user_roles?.display_name || 'Sin rol'}
                    </span>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña del Empleado</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña del empleado"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue8 hover:bg-blue6 text-white"
                    disabled={switching}
                  >
                    {switching ? "Cambiando..." : "Acceder como Empleado"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray4 mx-auto mb-4" />
                  <p className="text-gray4">Selecciona un empleado para continuar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Información Importante</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Al cambiar a un empleado, tendrás acceso limitado según su rol</li>
                <li>• Para volver a ser propietario, usa el botón "Volver a Propietario"</li>
                <li>• Solo puedes acceder a empleados de tu negocio</li>
                <li>• Necesitas la contraseña del empleado para acceder</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}
