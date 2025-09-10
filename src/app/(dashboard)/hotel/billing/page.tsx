"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HotelLayout ahora se maneja a nivel de ruta en layout.tsx
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Receipt, 
  DollarSign, 
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  Plus,
  Eye,
  FileText
} from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface Invoice {
  id: string;
  invoice_number: string;
  business_id: string;
  reservation_id: string;
  guest_name: string;
  guest_email: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_method?: string;
  created_at: string;
  due_date: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, filterStatus]);

  const loadBillingData = async () => {
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

      // Load invoices from reservations
      await loadInvoices(businessData.id);

    } catch (error) {
      console.error('Error loading billing data:', error);
      alert('Error al cargar datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async (businessId: string) => {
    try {
      // Get reservations with payment info
      const { data: reservations, error } = await supabase
        .from('hl_reservations')
        .select(`
          *,
          hl_rooms!inner(room_number)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reservations:', error);
        return;
      }

      // Transform reservations into invoices
      const invoiceData = reservations?.map(reservation => ({
        id: reservation.id,
        invoice_number: `INV-${reservation.id.slice(0, 8).toUpperCase()}`,
        business_id: reservation.business_id,
        reservation_id: reservation.id,
        guest_name: reservation.primary_guest_name,
        guest_email: reservation.primary_guest_email,
        room_number: reservation.hl_rooms?.room_number || 'N/A',
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        subtotal: reservation.total_amount || 0,
        tax_amount: 0, // Calculate based on business tax settings
        total_amount: reservation.total_amount || 0,
        payment_status: reservation.payment_status || 'pending',
        payment_method: reservation.payment_method,
        created_at: reservation.created_at,
        due_date: reservation.check_in_date // Due date is check-in date
      })) || [];

      setInvoices(invoiceData);

      // Calculate stats
      const totalAmount = invoiceData.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidAmount = invoiceData
        .filter(inv => inv.payment_status === 'paid')
        .reduce((sum, inv) => sum + inv.total_amount, 0);
      const pendingAmount = totalAmount - paidAmount;

      setStats({
        totalInvoices: invoiceData.length,
        totalAmount,
        paidAmount,
        pendingAmount
      });

    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.room_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.payment_status === filterStatus);
    }

    setFilteredInvoices(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'cancelled': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue8 mx-auto mb-4"></div>
            <p className="text-gray4">Cargando facturación...</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue1 font-title">
              Facturación
            </h1>
            <p className="text-gray4">
              Gestión de facturas, pagos y cobros
            </p>
          </div>
          <Button 
            onClick={() => router.push('/hotel/sales')}
            className="bg-blue8 hover:bg-blue6 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Venta</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Total Facturas</p>
                <p className="text-xl font-bold text-blue1">{stats.totalInvoices}</p>
              </div>
              <Receipt className="h-6 w-6 text-blue8" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Total Generado</p>
                <p className="text-xl font-bold text-green-600">{formatCLP(stats.totalAmount)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Pagado</p>
                <p className="text-xl font-bold text-blue-600">{formatCLP(stats.paidAmount)}</p>
              </div>
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray4">Pendiente</p>
                <p className="text-xl font-bold text-yellow-600">{formatCLP(stats.pendingAmount)}</p>
              </div>
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Buscar Factura</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray4" />
                <input
                  type="text"
                  placeholder="Cliente, email, factura o habitación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray4 mb-2">Estado de Pago</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8"
              >
                <option value="all">Todos los estados</option>
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-4 w-4" />
                <span>Limpiar Filtros</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Habitación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray4 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray8">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-blue1">{invoice.invoice_number}</div>
                        <div className="text-sm text-gray4">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-blue1">{invoice.guest_name}</div>
                        <div className="text-sm text-gray4">{invoice.guest_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray4">
                        Habitación {invoice.room_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray4">
                        <div>{new Date(invoice.check_in_date).toLocaleDateString()}</div>
                        <div>{new Date(invoice.check_out_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.payment_status)}`}>
                        {getStatusLabel(invoice.payment_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue1">
                        {formatCLP(invoice.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          title="Descargar factura"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray4 mx-auto mb-4" />
            <p className="text-gray4">
              {searchTerm || filterStatus !== 'all' 
                ? 'No se encontraron facturas con los filtros aplicados'
                : 'No hay facturas registradas'
              }
            </p>
          </div>
        )}
      </div>
    
  );
}
