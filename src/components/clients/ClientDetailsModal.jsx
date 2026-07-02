import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Phone,
  Mail,
  Instagram,
  Calendar,
  DollarSign,
  Clock,
  CreditCard,
  Package,
  Star,
  X } from
'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import GradientButton from '../ui/GradientButton';
import PaymentModal from './PaymentModal';
import { base44 } from '@/api/base44Client';

export default function ClientDetailsModal({ isOpen, onClose, client, services = [], onNewAppointment }) {
  const [clientAppointments, setClientAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [summary, setSummary] = useState(null); // Novo estado para as métricas do backend

  useEffect(() => {
    if (isOpen && client) {
      loadClientData();
    } else {
      setSummary(null); // Reseta o estado quando o modal fecha
      setClientAppointments([]);
    }
  }, [isOpen, client]);

  const loadClientData = async () => {
    if (!client) return;

    setLoading(true);
    setSummary(null);
    setClientAppointments([]);

    try {
      const appointments = await base44.entities.Appointment.filter(
        { client_id: client.id },
        '-start_time',
        100
      );

      setClientAppointments(appointments || []);

      const completed = (appointments || []).filter(a => a.status === 'concluido');
      const totalPaidValue = completed.reduce((sum, a) => sum + (a.final_price || 0), 0);
      const totalAppointments = appointments?.length || 0;
      const averageTicket = completed.length > 0 ? totalPaidValue / completed.length : 0;

      setSummary({ totalAppointments, totalPaidValue, averageTicket, pendingBalance: 0 });
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      setSummary({ totalAppointments: 0, totalPaidValue: 0, averageTicket: 0, pendingBalance: 0 });
      setClientAppointments([]);
    }
    setLoading(false);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    loadClientData(); // Recarregar dados para atualizar estatísticas
  };

  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || 'Serviço não encontrado';
  };

  const getStatusColor = (status) => {
    const colors = {
      agendado: 'bg-blue-100 text-blue-800 border-blue-200',
      confirmado: 'bg-green-100 text-green-800 border-green-200',
      concluido: 'bg-purple-100 text-purple-800 border-purple-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentIcon = (method) => {
    const icons = {
      pix: '💳',
      dinheiro: '💵',
      cartao: '💳',
      fiado: '📋'
    };
    return icons[method] || '💰';
  };

  if (!client) return null;

  const KPICard = ({ title, value, icon: Icon, iconColor, isLoading }) =>
  <Card className="card-3d text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardContent className="p-4">
        {isLoading || summary === null ? // Show pulse if loading or summary is not yet loaded
      <div className="animate-pulse space-y-2">
            <div className="h-8 w-8 mx-auto rounded-full bg-gray-700" />
            <div className="h-6 w-20 mx-auto rounded bg-gray-700" />
            <div className="h-4 w-24 mx-auto rounded bg-gray-700" />
          </div> :

      <>
            <Icon className={`w-8 h-8 mx-auto mb-2 ${iconColor}`} />
            <p className="text-2xl font-bold gradient-text">{value}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          </>
      }
      </CardContent>
    </Card>;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] glass-effect">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            {client.name}
          </DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Informações Pessoais */}
            <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <User className="w-5 h-5 text-pink-500" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span style={{ color: 'var(--text-primary)' }}>{client.phone}</span>
                </div>
                {client.email &&
                <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span style={{ color: 'var(--text-primary)' }}>{client.email}</span>
                  </div>
                }
                {client.notes &&
                <div className="p-3 rounded-lg" style={{ background: 'var(--secondary-bg)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <strong>Observações:</strong> {client.notes}
                    </p>
                  </div>
                }
              </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="Total de Atendimentos"
                value={summary?.totalAppointments ?? 0}
                icon={Calendar}
                iconColor="text-blue-500"
                isLoading={loading} />

              <KPICard
                title="Valor Total Pago"
                value={`R$ ${(summary?.totalPaidValue ?? 0).toFixed(2)}`}
                icon={DollarSign}
                iconColor="text-green-500"
                isLoading={loading} />

              <KPICard
                title="Ticket Médio"
                value={`R$ ${(summary?.averageTicket ?? 0).toFixed(2)}`}
                icon={Star}
                iconColor="text-yellow-500"
                isLoading={loading} />

              <KPICard
                title="Saldo Pendente"
                value={`R$ ${(summary?.pendingBalance ?? 0).toFixed(2)}`}
                icon={Package}
                iconColor="text-orange-500"
                isLoading={loading} />

            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle style={{ color: 'var(--text-primary)' }}>Histórico de Atendimentos</CardTitle>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white w-full sm:w-auto">

                    ➕ Registrar Pagamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ?
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 mx-auto mb-4 border-2 border-pink-500 border-t-transparent rounded-full" />
                    <p style={{ color: 'var(--text-secondary)' }}>Carregando histórico...</p>
                  </div> :
                clientAppointments.length > 0 ?
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {clientAppointments.map((appointment) =>
                  <div
                    key={appointment.id}
                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                    style={{ background: 'var(--secondary-bg)', borderColor: 'var(--border)' }}>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {format(new Date(appointment.start_time), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {getServiceName(appointment.service_id)}
                            </p>
                            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              <span>💰 R$ {(appointment.final_price || 0).toFixed(2)}</span>
                              <span>{getPaymentIcon(appointment.payment_method)} {appointment.payment_method}</span>
                            </div>
                          </div>
                        </div>

                        {appointment.notes &&
                    <p className="text-sm mt-2 p-2 rounded" style={{ background: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
                            {appointment.notes}
                          </p>
                    }
                      </div>
                  )}
                  </div> :

                <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                      {loading ? 'Carregando...' : 'Nenhum atendimento encontrado'}
                    </p>
                    {summary && summary.totalAppointments === 0 && !loading &&
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Esta cliente ainda não possui atendimentos registrados.
                      </p>
                  }
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose} className="bg-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">
            Fechar
          </Button>
          <GradientButton onClick={() => onNewAppointment(client)}>
            Novo Agendamento para esta Cliente
          </GradientButton>
        </div>

        {/* Modal de Pagamento */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          client={client}
          onSuccess={handlePaymentSuccess} />

      </DialogContent>
    </Dialog>);

}