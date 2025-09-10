"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  Building,
  QrCode,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import PermissionGate from "@/components/PermissionGate";
import { usePermissions } from "@/hooks/usePermissions";
import CredentialsModal from "@/components/ui/credentials-modal";
import QRGenerator from "@/components/ui/qr-generator";

interface Employee {
  id: string;
  business_id: string;
  user_id?: string;
  role_id: string;
  role_name: string;
  role_display_name: string;
  employee_code?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  is_active: boolean;
  created_by_name: string;
  created_at: string;
}

interface UserRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

export default function UsersManagement() {
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: '',
    department: '',
    position: ''
  });
  const [creating, setCreating] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [selectedEmployeeForQR, setSelectedEmployeeForQR] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
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

      // Cargar empleados
      const { data: employeesData } = await supabase
        .from('hl_employees_detailed')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      // Cargar roles disponibles
      const { data: rolesData } = await supabase
        .from('hl_user_roles')
        .select('*')
        .eq('is_system_role', false) // Solo roles no del sistema
        .order('display_name');

      setEmployees(employeesData || []);
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchToEmployee = async (employee: Employee) => {
    try {
      // Guardar sesión del dueño actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Crear sesión temporal del empleado
      const employeeSession = {
        employee_id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        role: employee.role_display_name,
        business_id: employee.business_id,
        permissions: [], // Se cargarán por usePermissions
        expires_at: Date.now() + (8 * 60 * 60 * 1000), // 8 horas
        original_user_id: user.id // Para poder volver
      };

      // Guardar en localStorage
      localStorage.setItem('employee_session', JSON.stringify(employeeSession));
      localStorage.setItem('original_user_session', JSON.stringify({
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email
      }));

      // Redirigir al dashboard como empleado
      window.location.href = '/hotel?employee_access=true';
    } catch (error) {
      console.error('Error switching to employee:', error);
      alert('Error al cambiar a empleado: ' + (error as Error).message);
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'reception': 'bg-blue-100 text-blue-800',
      'housekeeping': 'bg-green-100 text-green-800',
      'maintenance': 'bg-orange-100 text-orange-800',
      'management': 'bg-purple-100 text-purple-800',
      'accounting': 'bg-yellow-100 text-yellow-800'
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentLabel = (department: string) => {
    const labels = {
      'reception': 'Recepción',
      'housekeeping': 'Limpieza',
      'maintenance': 'Mantenimiento',
      'management': 'Gerencia',
      'accounting': 'Contabilidad'
    };
    return labels[department as keyof typeof labels] || department;
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || employee.role_id === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`¿Estás seguro de eliminar a ${employee.first_name} ${employee.last_name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch('/api/employees/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id,
          userId: employee.user_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar empleado');
      }

      alert('Empleado eliminado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error al eliminar empleado: ' + (error as Error).message);
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployeeForm.first_name || !newEmployeeForm.last_name || !newEmployeeForm.department) {
      alert('Por favor completa los campos obligatorios: Nombre, Apellido y Departamento');
      return;
    }

    try {
      setCreating(true);
      
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

      // Generar código de empleado único
      const employeeCode = `EMP${Date.now().toString().slice(-6)}`;

      // Crear empleado
      const { data: newEmployee, error } = await supabase
        .from('hl_employees')
        .insert({
          business_id: businessData.id,
          role_id: newEmployeeForm.role_id,
          employee_code: employeeCode,
          first_name: newEmployeeForm.first_name,
          last_name: newEmployeeForm.last_name,
          email: newEmployeeForm.email || null,
          phone: newEmployeeForm.phone || null,
          position: newEmployeeForm.position || null,
          department: newEmployeeForm.department || null,
          hire_date: new Date().toISOString().split('T')[0],
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        alert('Error al crear empleado: ' + error.message);
        return;
      }

      // Crear usuario con nombre de usuario (sin email)
      const username = `${newEmployeeForm.first_name.toLowerCase()}.${newEmployeeForm.last_name.toLowerCase()}`;
      const tempPassword = `Temp${Date.now().toString().slice(-6)}`;
      
      // Usar email proporcionado o generar uno temporal
      const userEmail = newEmployeeForm.email || `${username}@hotel.local`;
      
      // Crear cliente con Service Role Key para crear usuarios
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: `${newEmployeeForm.first_name} ${newEmployeeForm.last_name}`,
          employee_id: newEmployee.id,
          username: username
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        alert('Error al crear cuenta de usuario: ' + authError.message);
        return;
      }

      // Crear usuario en hl_user usando el cliente admin
      const { error: userError } = await supabaseAdmin
        .from('hl_user')
        .insert({
          id: authData.user.id,
          name: `${newEmployeeForm.first_name} ${newEmployeeForm.last_name}`,
          email: userEmail,
          role_id: newEmployeeForm.role_id,
          employee_id: newEmployee.id,
          email_verified: true
        });

      if (userError) {
        console.error('Error creating user record:', userError);
      }

      // Mostrar credenciales en modal
      setNewEmployeeCredentials({
        email: newEmployeeForm.email || username, // Mostrar email real o username
        password: tempPassword,
        name: `${newEmployeeForm.first_name} ${newEmployeeForm.last_name}`
      });
      setShowCredentialsModal(true);

      // Limpiar formulario y cerrar modal
      setNewEmployeeForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role_id: '',
        department: '',
        position: ''
      });
      setShowNewEmployeeModal(false);
      
      // Recargar datos
      loadData();
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error al crear empleado');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
          <p className="mt-4 text-gray4">Cargando usuarios...</p>
        </div>
      
    );
  }

  return (
    
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">Gestión de Usuarios</h1>
            <p className="text-gray4 font-body">Administrar empleados y permisos</p>
          </div>
          {hasPermission('users.create') && (
            <Button 
              onClick={() => setShowNewEmployeeModal(true)}
              className="bg-blue8 hover:bg-blue6 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Total Empleados</p>
                <p className="text-2xl font-bold text-blue1">{employees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Activos</p>
                <p className="text-2xl font-bold text-blue1">
                  {employees.filter(e => e.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Recepción</p>
                <p className="text-2xl font-bold text-blue1">
                  {employees.filter(e => e.department === 'reception' && e.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Limpieza</p>
                <p className="text-2xl font-bold text-blue1">
                  {employees.filter(e => e.department === 'housekeeping' && e.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
              >
                <option value="all">Todos los roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray8">
            <h2 className="text-xl font-semibold text-blue1">Empleados</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Empleado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Rol</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Departamento</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Contacto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray8">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray10">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue8 rounded-full flex items-center justify-center text-white font-semibold">
                          {employee.first_name[0]}{employee.last_name[0]}
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-blue1">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-gray4">
                            {employee.employee_code && `#${employee.employee_code}`}
                            {employee.position && ` • ${employee.position}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {employee.role_display_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {employee.department && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDepartmentColor(employee.department)}`}>
                          {getDepartmentLabel(employee.department)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {employee.email && (
                          <div className="flex items-center text-gray4">
                            <Mail className="h-3 w-3 mr-1" />
                            {employee.email}
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center text-gray4">
                            <Phone className="h-3 w-3 mr-1" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <PermissionGate permission="users.switch">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => switchToEmployee(employee)}
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            title="Acceder como este empleado"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permission="users.edit">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue8 text-blue8 hover:bg-blue15"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permission="users.delete">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEmployee(employee)}
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            title="Eliminar empleado"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray4 mx-auto mb-4" />
                <p className="text-gray4">No hay empleados que coincidan con los filtros</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Nuevo Empleado */}
        {showNewEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Empleado</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input 
                    type="text"
                    value={newEmployeeForm.first_name}
                    onChange={(e) => setNewEmployeeForm({...newEmployeeForm, first_name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input 
                    type="text"
                    value={newEmployeeForm.last_name}
                    onChange={(e) => setNewEmployeeForm({...newEmployeeForm, last_name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Apellido"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input 
                  type="email"
                  value={newEmployeeForm.email}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="email@ejemplo.com (opcional)"
                />
                <p className="text-xs text-gray-500 mt-1">Opcional - Si no se proporciona, se usará nombre.apellido@hotel.local</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input 
                  type="tel"
                  value={newEmployeeForm.phone}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento *
                </label>
                <select 
                  value={newEmployeeForm.department}
                  onChange={(e) => {
                    const department = e.target.value;
                    // Asignar rol automáticamente según el departamento
                    const roleMapping: { [key: string]: string } = {
                      'reception': 'reception',
                      'housekeeping': 'housekeeper', 
                      'maintenance': 'maintenance',
                      'management': 'manager',
                      'accounting': 'accounting'
                    };
                    const roleName = roleMapping[department];
                    const role = roles.find(r => r.name === roleName);
                    
                    setNewEmployeeForm({
                      ...newEmployeeForm, 
                      department: department,
                      role_id: role?.id || ''
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar departamento</option>
                  <option value="reception">Recepción</option>
                  <option value="housekeeping">Limpieza</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="management">Gerencia</option>
                  <option value="accounting">Contabilidad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol Asignado
                </label>
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                  {newEmployeeForm.role_id ? (
                    <span className="text-blue-600 font-medium">
                      {roles.find(r => r.id === newEmployeeForm.role_id)?.display_name || 'Rol no encontrado'}
                    </span>
                  ) : (
                    <span className="text-gray-400">Selecciona un departamento primero</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">El rol se asigna automáticamente según el departamento</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input 
                  type="text"
                  value={newEmployeeForm.position}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, position: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Ej: Recepcionista Senior"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowNewEmployeeModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateEmployee}
                disabled={creating}
                className="flex-1 bg-blue8 hover:bg-blue6 text-white disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Empleado'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Credenciales */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        email={newEmployeeCredentials.email}
        password={newEmployeeCredentials.password}
        employeeName={newEmployeeCredentials.name}
      />

      {/* Modal de Generador QR */}
      {selectedEmployeeForQR && (
        <QRGenerator
          employee={selectedEmployeeForQR}
          onClose={() => {
            setShowQRGenerator(false);
            setSelectedEmployeeForQR(null);
          }}
        />
        )}
      </div>
  );
}