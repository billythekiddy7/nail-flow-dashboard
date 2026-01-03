import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, DollarSign, Smartphone, Calendar, Scissors, User } from 'lucide-react';
import { useLive } from '@/components/hooks/useLive';
import { Payment, Client, Service, Appointment } from '@/entities/all';

const getPaymentIcon = (method) => {
  const icons = {
    pix: <Smartphone className="w-4 h-4 text-green-500" />,
    dinheiro: <DollarSign className="w-4 h-4 text-blue-500" />,
    debit: <CreditCard className="w-4 h-4 text-purple-500" />,
    credit: <CreditCard className="w-4 h-4 text-orange-500" />
  };
  return icons[method] || <DollarSign className="w-4 h-4 text-gray-500" />;
};

const getPaymentLabel = (method) => {
  const labels = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    debit: 'Débito',
    credit: 'Crédito'
  };
  return labels[method] || method;
};

const getMethodColor = (method) => {
  const colors = {
    pix: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    dinheiro: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    debit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    credit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  };
  return colors[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

export default function PaymentsTable({ dateRange = null }) {
  const { data: payments, loading } = useLive(Payment);
  const { data: clients } = useLive(Client);
  const { data: services } = useLive(Service);
  const { data: appointments } = useLive(Appointment);

  // Filtrar pagamentos por período se especificado
  const filteredPayments = React.useMemo(() => {
    if (!dateRange) return payments;
    
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
    });
  }, [payments, dateRange]);

  // 🔧 Fix: Corrigir mapeamento enrichedPayments
  const enrichedPayments = React.useMemo(() => {
    return filteredPayments.map(p => {
      const apt = appointments.find(a => a.id === p.appointment_id);
      return {
        ...p,
        client_name: clients.find(c => c.id === p.client_id)?.name,
        service_name: services.find(s => s.id === apt?.service_id)?.name
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredPayments, clients, services, appointments]);

  if (loading) {
    return (
      <Card className="border-neutral-700" style={{ background: 'var(--card-bg)' }}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-neutral-800 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-neutral-700" style={{ background: 'var(--card-bg)' }}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-500" />
          Histórico de Pagamentos
          <Badge variant="outline" className="ml-auto">
            {enrichedPayments.length} registros
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-neutral-700">
                <TableHead className="text-gray-300">Cliente</TableHead>
                <TableHead className="text-gray-300">Data</TableHead>
                <TableHead className="text-gray-300">Serviço</TableHead>
                <TableHead className="text-gray-300">Método</TableHead>
                <TableHead className="text-gray-300 text-right">Valor</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedPayments.length > 0 ? (
                enrichedPayments.map((payment) => (
                  <TableRow key={payment.id} className="border-neutral-700 hover:bg-neutral-800/50">
                    <TableCell className="text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-pink-500" />
                        <div>
                          <p className="font-medium">{payment.client_name || 'Cliente não encontrado'}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <div>
                          <p>{format(new Date(payment.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-purple-500" />
                        <span>{payment.service_name || 'Serviço manual'}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getMethodColor(payment.method)}>
                        <div className="flex items-center gap-1">
                          {getPaymentIcon(payment.method)}
                          <span>{getPaymentLabel(payment.method)}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <span className="text-green-500 font-bold text-lg">
                        R$ {(payment.amount || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        className={
                          payment.status === 'confirmado' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : payment.status === 'pendente'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }
                      >
                        {payment.status === 'confirmado' ? '✓ Confirmado' : 
                         payment.status === 'pendente' ? '⏳ Pendente' : 
                         '✗ Cancelado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="w-8 h-8 text-gray-500" />
                      <p>Nenhum pagamento encontrado</p>
                      <p className="text-sm">Os pagamentos registrados aparecerão aqui</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {enrichedPayments.length > 0 && (
          <div className="p-4 border-t border-neutral-700">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Total de registros: {enrichedPayments.length}</span>
              <span className="text-green-500 font-bold">
                Total: R$ {enrichedPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}