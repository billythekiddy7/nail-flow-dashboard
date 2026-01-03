
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, BarChart3, PieChart } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Client, Service } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatorioModal({ isOpen, onClose }) {
  const [reportType, setReportType] = useState("financial");
  const [period, setPeriod] = useState("month");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen, reportType, period, customStartDate, customEndDate]); // Added customDate dependencies for regenerate on change

  const safeNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const [appointments, clients, services] = await Promise.all([
      Appointment.list('-created_date', 500),
      Client.list(),
      Service.list()]
      );

      const now = new Date();
      let startDate, endDate;

      switch (period) {
        case "week":
          startDate = subDays(now, 7);
          endDate = now;
          break;
        case "month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "year":
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case "custom":
          startDate = customStartDate;
          endDate = customEndDate;
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      // Ensure endDate includes the full day for 'custom' and other periods
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      if (startDate) {
        startDate.setHours(0, 0, 0, 0);
      }

      const filteredAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.start_time);
        return startDate instanceof Date && !isNaN(startDate) && aptDate >= startDate &&
        endDate instanceof Date && !isNaN(endDate) && aptDate <= endDate;
      });

      let data = {};

      if (reportType === "financial") {
        data = generateFinancialReport(filteredAppointments, services);
      } else if (reportType === "clients") {
        data = generateClientsReport(filteredAppointments, clients, startDate, endDate);
      } else if (reportType === "services") {
        data = generateServicesReport(filteredAppointments, services);
      }

      setReportData({ ...data, period: getPeriodText(), startDate, endDate });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    }
    setLoading(false);
  };

  const generateFinancialReport = (appointments, services) => {
    const completedAppts = appointments.filter((apt) => apt.status === 'concluido');

    const totalRevenue = completedAppts.reduce((sum, apt) => sum + safeNumber(apt.final_price), 0);
    const totalAppointments = completedAppts.length;
    const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    return {
      type: "Relatório Financeiro",
      totalRevenue: safeNumber(totalRevenue),
      totalAppointments: safeNumber(totalAppointments),
      avgTicket: safeNumber(avgTicket),
      paymentMethods: groupPaymentMethods(completedAppts),
      dailyRevenue: groupByDay(completedAppts)
    };
  };

  const generateClientsReport = (appointments, clients, startDate, endDate) => {
    const clientStats = {};

    // Group appointments by client
    appointments.forEach((apt) => {
      if (!clientStats[apt.client_id]) {
        const client = clients.find((c) => c.id === apt.client_id);
        clientStats[apt.client_id] = {
          id: apt.client_id, // Add client ID for uniqueness
          name: client?.name || 'Cliente não encontrado',
          phone: client?.phone || '',
          appointments: 0,
          totalSpent: 0,
          avgTicket: 0
        };
      }

      clientStats[apt.client_id].appointments++;
      if (apt.status === 'concluido') {
        clientStats[apt.client_id].totalSpent += safeNumber(apt.final_price);
      }
    });

    Object.values(clientStats).forEach((client) => {
      client.totalSpent = safeNumber(client.totalSpent); // Ensure totalSpent is a number
      client.avgTicket = client.appointments > 0 ? client.totalSpent / client.appointments : 0;
    });

    // Proteger contra valores undefined
    const topClients = Object.values(clientStats).
    sort((a, b) => safeNumber(b.totalSpent) - safeNumber(a.totalSpent)).
    slice(0, 10) || [];

    // Calcular novos clientes no período
    let newClients = 0;
    if (startDate && endDate) {
      newClients = clients.filter((c) => {
        const clientCreatedDate = new Date(c.created_date);
        return clientCreatedDate >= startDate && clientCreatedDate <= endDate;
      }).length;
    }

    return {
      type: "Relatório de Clientes",
      totalClients: safeNumber(Object.keys(clientStats).length),
      topClients: topClients,
      newClients: safeNumber(newClients)
    };
  };

  const generateServicesReport = (appointments, services) => {
    const serviceStats = {};

    appointments.forEach((apt) => {
      if (!serviceStats[apt.service_id]) {
        const service = services.find((s) => s.id === apt.service_id);
        serviceStats[apt.service_id] = {
          id: apt.service_id, // Add service ID for uniqueness
          name: service?.name || 'Serviço não encontrado',
          appointments: 0,
          revenue: 0,
          price: safeNumber(service?.price)
        };
      }

      serviceStats[apt.service_id].appointments++;
      if (apt.status === 'concluido') {
        serviceStats[apt.service_id].revenue += safeNumber(apt.final_price);
      }
    });

    // Proteger contra valores undefined
    const topServices = Object.values(serviceStats).
    map((service) => ({
      ...service,
      revenue: safeNumber(service.revenue),
      appointments: safeNumber(service.appointments)
    })).
    sort((a, b) => safeNumber(b.revenue) - safeNumber(a.revenue)).
    slice(0, 10) || [];

    const totalServiceRevenue = Object.values(serviceStats).
    reduce((sum, s) => sum + safeNumber(s.revenue), 0);

    return {
      type: "Relatório de Serviços",
      totalServices: safeNumber(Object.keys(serviceStats).length),
      topServices: topServices,
      totalServiceRevenue: safeNumber(totalServiceRevenue)
    };
  };

  const groupPaymentMethods = (appointments) => {
    const methods = {};
    appointments.forEach((apt) => {
      const method = apt.payment_method || 'dinheiro';
      methods[method] = safeNumber(methods[method]) + safeNumber(apt.final_price);
    });
    return methods;
  };

  const groupByDay = (appointments) => {
    const daily = {};
    appointments.forEach((apt) => {
      const day = format(new Date(apt.start_time), 'yyyy-MM-dd');
      daily[day] = safeNumber(daily[day]) + safeNumber(apt.final_price);
    });
    return daily;
  };

  const getPeriodText = () => {
    switch (period) {
      case "week":return "Última Semana";
      case "month":return "Este Mês";
      case "year":return "Este Ano";
      case "custom":
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`;
        }
        return "Período Personalizado";
      default:return "Este Mês";
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const content = `
${reportData.type}
Período: ${reportData.period}
Data: ${format(new Date(), 'PPP', { locale: ptBR })}

${reportType === 'financial' ? `
RESUMO FINANCEIRO
Total de Receita: R$ ${safeNumber(reportData.totalRevenue).toFixed(2)}
Total de Atendimentos: ${safeNumber(reportData.totalAppointments)}
Ticket Médio: R$ ${safeNumber(reportData.avgTicket).toFixed(2)}
` : ''}

${reportType === 'clients' ? `
RESUMO DE CLIENTES
Total de Clientes: ${safeNumber(reportData.totalClients)}
Novos Clientes no Período: ${safeNumber(reportData.newClients)}

TOP CLIENTES:
${(reportData.topClients || []).map((client, i) => `${i + 1}. ${client.name} - R$ ${safeNumber(client.totalSpent).toFixed(2)} (${safeNumber(client.appointments)} atendimentos)`).join('\n')}
` : ''}

${reportType === 'services' ? `
RESUMO DE SERVIÇOS
Total de Serviços Vendidos: ${safeNumber(reportData.totalServices)}
Receita Total de Serviços: R$ ${safeNumber(reportData.totalServiceRevenue).toFixed(2)}

TOP SERVIÇOS:
${(reportData.topServices || []).map((service, i) => `${i + 1}. ${service.name} - R$ ${safeNumber(service.revenue).toFixed(2)} (${safeNumber(service.appointments)} vendas)`).join('\n')}
` : ''}

Relatório gerado pelo Nail Flow
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-950 p-6 fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg glass-effect max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-50 mb-2 text-sm font-medium block">Tipo de Relatório

              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="bg-slate-950 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Financeiro
                    </div>
                  </SelectItem>
                  <SelectItem value="clients">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Clientes
                    </div>
                  </SelectItem>
                  <SelectItem value="services">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Serviços
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-slate-50 mb-2 text-sm font-medium block">Período

              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="bg-slate-950 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={loading || period === 'custom' && (!customStartDate || !customEndDate)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white w-full">

                {loading ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>
          </div>

          {period === "custom" &&
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-50 mb-2 text-sm font-medium block">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="bg-slate-950 text-left px-4 py-2 text-sm font-normal inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ptBR}
                    initialFocus />

                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-slate-50 mb-2 text-sm font-medium block">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="bg-slate-950 text-left px-4 py-2 text-sm font-normal inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ptBR}
                    initialFocus />

                  </PopoverContent>
                </Popover>
              </div>
            </div>
          }

          {/* Visualização do Relatório */}
          {reportData &&
          <Card className="card-3d">
              <CardHeader className="bg-green-600 p-6 flex flex-col space-y-1.5">
                <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">
                  {reportData.type} - {reportData.period}
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-950 pt-0 p-6 space-y-4">
                {reportType === "financial" &&
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">R$ {safeNumber(reportData.totalRevenue).toFixed(2)}</p>
                      <p className="text-slate-50 text-sm">Receita Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold gradient-text">{safeNumber(reportData.totalAppointments)}</p>
                      <p className="text-slate-50 text-sm">Atendimentos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">R$ {safeNumber(reportData.avgTicket).toFixed(2)}</p>
                      <p className="text-slate-50 text-sm">Ticket Médio</p>
                    </div>
                  </div>
              }

                {reportType === "clients" &&
              <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold gradient-text">{safeNumber(reportData.totalClients)}</p>
                        <p className="text-sm text-secondary-foreground">Total de Clientes Atendidos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">{safeNumber(reportData.newClients)}</p>
                        <p className="text-sm text-secondary-foreground">Novos Clientes no Período</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-primary">Top 5 Clientes por Gasto</h4>
                      {(reportData.topClients || []).slice(0, 5).map((client, i) =>
                  <div key={i} className="flex justify-between py-1 text-primary">
                          <span>{client.name}</span>
                          <span className="font-bold text-green-500">R$ {safeNumber(client.totalSpent).toFixed(2)}</span>
                        </div>
                  )}
                    </div>
                  </div>
              }

                {reportType === "services" &&
              <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold gradient-text">{safeNumber(reportData.totalServices)}</p>
                        <p className="text-sm text-secondary-foreground">Serviços Vendidos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">R$ {safeNumber(reportData.totalServiceRevenue).toFixed(2)}</p>
                        <p className="text-sm text-secondary-foreground">Receita Total de Serviços</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2 text-primary">Top 5 Serviços por Receita</h4>
                      {(reportData.topServices || []).slice(0, 5).map((service, i) =>
                  <div key={i} className="flex justify-between py-1 text-primary">
                          <span>{service.name}</span>
                          <span className="font-bold text-green-500">R$ {safeNumber(service.revenue).toFixed(2)}</span>
                        </div>
                  )}
                    </div>
                  </div>
              }
              </CardContent>
            </Card>
          }
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onClose} className="bg-slate-950 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10">
            Fechar
          </Button>
          {reportData &&
          <Button onClick={exportReport} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório
            </Button>
          }
        </div>
      </DialogContent>
    </Dialog>);

}