import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Calendar, User, CreditCard } from 'lucide-react';

// Componente de linha sem virtualização (fallback para react-window)
const PaymentRow = ({ payment, clientLookup, serviceLookup, index }) => {
  if (!payment) return null;

  const client = clientLookup[payment.client_id];
  const service = serviceLookup[payment.service_id];

  const getPaymentMethodIcon = (method) => {
    const icons = {
      pix: '💳',
      dinheiro: '💵',
      cartao: '💳',
      debit: '💳',
      credit: '💳'
    };
    return icons[method] || '💰';
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmado: 'bg-green-100 text-green-800 border-green-200',
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="px-4 mb-2">
      <div 
        className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {format(new Date(payment.date), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {client?.name || 'Cliente não encontrado'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {service?.name || 'Serviço não encontrado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="font-bold text-green-500">
              R$ {(payment.amount || 0).toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">{getPaymentMethodIcon(payment.method)}</span>
            <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
              {payment.method}
            </span>
          </div>
          
          <Badge className={getStatusColor(payment.status)}>
            {payment.status}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Tabela principal sem virtualização
export default function VirtualizedPaymentsTable({ payments = [], clients = [], services = [] }) {
  // Lookup maps para performance O(1)
  const { clientLookup, serviceLookup } = useMemo(() => {
    const clientLookup = {};
    const serviceLookup = {};
    
    clients.forEach(client => {
      clientLookup[client.id] = client;
    });
    
    services.forEach(service => {
      serviceLookup[service.id] = service;
    });
    
    return { clientLookup, serviceLookup };
  }, [clients, services]);

  if (!payments.length) {
    return (
      <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--text-primary)' }}>
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              Nenhum pagamento encontrado para o período selecionado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CreditCard className="w-5 h-5 text-blue-500" />
          Histórico de Pagamentos ({payments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {payments.map((payment, index) => (
            <PaymentRow
              key={payment.id || index}
              payment={payment}
              clientLookup={clientLookup}
              serviceLookup={serviceLookup}
              index={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}