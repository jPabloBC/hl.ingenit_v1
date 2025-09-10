"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bed, 
  Users, 
  Calendar, 
  CheckCircle,
  Sparkles, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Filter,
  Plus,
  Search,
  MapPin,
  Star,
  Clipboard,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  status: string;
  current_task?: HousekeepingTask;
}

interface HousekeepingTask {
  id: string;
  business_id: string;
  room_id: string;
  reservation_id?: string;
  room_number: string;
  room_type: string;
  floor: number;
  task_type: 'checkout' | 'stayover' | 'deep_cleaning' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  assigned_to?: string;
  assigned_name?: string;
  assigned_user_name?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  estimated_duration: number; // en minutos
  actual_duration?: number;
  notes?: string;
  checkout_date?: string;
  guest_name?: string;
  special_requests?: string;
      check_in_date?: string;
    check_out_date?: string;
  reservation_guests?: number;
  total_checklist_items: number;
  completed_checklist_items: number;
  checklist_progress: number;
  minutes_in_progress?: number;
  checklist_items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  task_id: string;
  description: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

interface StaffMember {
  id: string;
  business_id: string;
  name: string;
  role: string;
  total_tasks: number;
  completed_tasks: number;
  verified_tasks: number;
  avg_duration?: number;
  today_tasks: number;
  today_completed: number;
  current_workload: number;
}

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);

  useEffect(() => {
    loadHousekeepingData();
  }, []);

  const loadHousekeepingData = async () => {
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

      // Cargar habitaciones
      const { data: roomsData } = await supabase
        .from('hl_rooms')
        .select('id, room_number, room_type, floor, status')
        .eq('business_id', businessData.id)
        .order('room_number');

      // Cargar tareas de housekeeping con información detallada
      const { data: tasksData } = await supabase
        .from('hl_housekeeping_tasks_detailed')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      // Cargar rendimiento del personal
      const { data: staffData } = await supabase
        .from('hl_housekeeping_staff_performance')
        .select('*')
        .eq('business_id', businessData.id);

      // Cargar checklist para cada tarea
      const tasksWithChecklist = await Promise.all(
        (tasksData || []).map(async (task) => {
          const { data: checklistData } = await supabase
            .from('hl_housekeeping_checklist')
            .select('*')
            .eq('task_id', task.id)
            .order('order_index');

          return {
            ...task,
            checklist_items: checklistData || []
          };
        })
      );

      setRooms(roomsData || []);
      setTasks(tasksWithChecklist);
      setStaff(staffData || []);

    } catch (error) {
      console.error('Error loading housekeeping data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeLabel = (type: string) => {
    const labels = {
      'checkout': 'Check-out',
      'stayover': 'Mantenimiento',
      'deep_cleaning': 'Limpieza Profunda',
      'maintenance': 'Mantenimiento'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'verified': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'verified': return <Star className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = selectedFilter === 'all' || task.status === selectedFilter;
    const matchesSearch = task.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assigned_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total_tasks: tasks.length,
    pending_tasks: tasks.filter(t => t.status === 'pending').length,
    in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
    completed_tasks: tasks.filter(t => t.status === 'completed').length,
    verified_tasks: tasks.filter(t => t.status === 'verified').length,
    completed_today: tasks.filter(t => 
      t.status === 'completed' && 
      t.completed_at?.startsWith(new Date().toISOString().split('T')[0])
    ).length,
    urgent_tasks: tasks.filter(t => t.priority === 'urgent').length,
    active_staff: staff.filter(s => s.current_workload > 0).length
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('hl_housekeeping_tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (!error) {
        loadHousekeepingData();
      }
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('hl_housekeeping_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (!error) {
        loadHousekeepingData();
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleVerifyTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('hl_housekeeping_tasks')
        .update({
          status: 'verified'
        })
        .eq('id', taskId);

      if (!error) {
        loadHousekeepingData();
      }
    } catch (error) {
      console.error('Error verifying task:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto"></div>
        <p className="mt-4 text-gray4">Cargando sistema de housekeeping...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">Housekeeping</h1>
            <p className="text-gray4 font-body">Gestión de limpieza y mantenimiento</p>
          </div>
          <Button 
            onClick={() => setShowNewTaskModal(true)}
            className="bg-blue8 hover:bg-blue6 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue15 rounded-lg">
                <Clipboard className="h-6 w-6 text-blue8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Total Tareas</p>
                <p className="text-2xl font-bold text-blue1">{stats.total_tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Pendientes</p>
                <p className="text-2xl font-bold text-blue1">{stats.pending_tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">En Progreso</p>
                <p className="text-2xl font-bold text-blue1">{stats.in_progress_tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Completadas Hoy</p>
                <p className="text-2xl font-bold text-blue1">{stats.completed_today}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray4">Urgentes</p>
                <p className="text-2xl font-bold text-blue1">{stats.urgent_tasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="Buscar por habitación o personal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
              >
                <option value="all">Todas las tareas</option>
                <option value="pending">Pendientes</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completadas</option>
                <option value="verified">Verificadas</option>
              </select>
              
              <Button
                onClick={loadHousekeepingData}
                variant="outline"
                className="border-blue8 text-blue8 hover:bg-blue15"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray8">
            <h2 className="text-xl font-semibold text-blue1">Tareas de Housekeeping</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Habitación</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Prioridad</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Asignado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Duración</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray1">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray8">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray10">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 text-blue8 mr-2" />
                        <span className="font-semibold">{task.room_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{getTaskTypeLabel(task.task_type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                          {task.status === 'pending' && 'Pendiente'}
                          {task.status === 'in_progress' && 'En Progreso'}
                          {task.status === 'completed' && 'Completada'}
                          {task.status === 'verified' && 'Verificada'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{task.assigned_name || 'Sin asignar'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{task.estimated_duration} min</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartTask(task.id)}
                            className="bg-blue8 hover:bg-blue6 text-white"
                          >
                            Iniciar
                          </Button>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Completar
                          </Button>
                        )}
                        
                        {task.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyTask(task.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Verificar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTask(task)}
                          className="border-blue8 text-blue8 hover:bg-blue15"
                        >
                          Ver
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-gray4 mx-auto mb-4" />
                <p className="text-gray4">No hay tareas que coincidan con los filtros</p>
              </div>
            )}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray8">
            <h2 className="text-xl font-semibold text-blue1">Rendimiento del Personal</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((member) => (
                <div key={member.id} className="border border-gray8 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue1">{member.name}</h3>
                    <span className="text-sm text-gray4">{member.role}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray4">Tareas activas:</span>
                      <span className="font-semibold">{member.current_workload}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray4">Completadas hoy:</span>
                      <span className="font-semibold text-green-600">{member.today_completed}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray8">
                    <div className="flex items-center text-sm text-gray4">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>Productividad: {member.today_completed > 0 ? 'Buena' : 'Pendiente'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Modal Nueva Tarea */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nueva Tarea de Housekeeping</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Habitación
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Seleccionar habitación</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {room.room_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Tarea
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="checkout">Checkout</option>
                  <option value="stayover">Stayover</option>
                  <option value="deep_cleaning">Limpieza Profunda</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asignar a
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Sin asignar</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowNewTaskModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implementar creación de tarea
                  setShowNewTaskModal(false);
                }}
                className="flex-1 bg-blue8 hover:bg-blue6 text-white"
              >
                Crear Tarea
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}