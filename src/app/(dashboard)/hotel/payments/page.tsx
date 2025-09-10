"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface PaymentTransaction {
  id: string;
  reservation_id: string;
  buy_order: string;
  amount: number;
  guest_name: string;
  guest_email: string;
  status: string;
  authorization_code?: string;
  card_number?: string;
  payment_date?: string;
  created_at: string;
}

interface PaymentStats {
  total_transactions: number;
  total_amount: number;
  approved_transactions: number;
  approved_amount: number;
  pending_transactions: number;
  rejected_transactions: number;
  today_transactions: number;
  today_amount: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      // Get current user and business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get business info
      const { data: businessData, error: businessError } = await supabase
        .from('hl_business')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_type', 'hotel')
        .single();

      if (businessError || !businessData) {
        console.error('Error getting business:', businessError);
        alert('Error al obtener información del negocio');
        return;
      }

      setBusinessId(businessData.id);

      // Load payment transactions
      await loadTransactions(businessData.id);
      
      // Load payment stats
      await loadStats(businessData.id);

    } catch (error) {
      console.error('Error loading payment data:', error);
      alert('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (businessId: string) => {
    const { data, error } = await supabase
      .from('hl_payment_transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    setTransactions(data || []);
  };

  const loadStats = async (businessId: string) => {
    const { data, error } = await supabase
      .rpc('get_payment_stats_v2', { p_business_id: businessId });

    if (error) {
      console.error('Error loading payment stats:', error);
      return;
    }

    if (data && data.length > 0) {
      setStats(data[0]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
      case 'created':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: {[key: string]: string} = {
      'created': 'Creada',
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'cancelled': 'Cancelada',
      'expired': 'Expirada'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'created':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.buy_order.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.guest_email && transaction.guest_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
          <p className="text-gray4">Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-blue1 font-title">
                Gestión de Pagos
              </h1>
              <p className="text-gray4">
                Transacciones Webpay Plus y estado de pagos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Total Transacciones</p>
                  <p className="text-2xl font-bold text-blue1">{stats.total_transactions}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue8" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Monto Total</p>
                  <p className="text-2xl font-bold text-green-600">${stats.total_amount.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Aprobadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved_transactions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray4">Hoy</p>
                  <p className="text-2xl font-bold text-blue1">${stats.today_amount.toLocaleString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue8" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="Buscar por huésped, orden de compra o email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                className="px-4 py-2 border border-gray8 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="approved">Aprobadas</option>
                <option value="pending">Pendientes</option>
                <option value="rejected">Rechazadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Huésped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden de Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autorización
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.guest_name}</div>
                        {transaction.guest_email && (
                          <div className="text-sm text-gray-500">{transaction.guest_email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.buy_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.payment_date || transaction.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.authorization_code || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {transactions.length === 0 
                  ? 'No hay transacciones registradas'
                  : 'No se encontraron transacciones con los filtros aplicados'
                }
              </p>
            </div>
          )}
        </div>
      </div>
  );
}