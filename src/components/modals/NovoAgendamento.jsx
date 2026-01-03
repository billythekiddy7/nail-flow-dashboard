
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, Scissors } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Client, Service, Product } from "@/entities/all";

export default function NovoAgendamento({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    client_id: "",
    service_id: "",
    date: null,
    time: "",
    notes: "",
    payment_method: "dinheiro"
  });
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // Busca sequencial para reduzir carga no servidor
      console.log("[NovoAgendamento] Buscando clientes...");
      const clientsData = await Client.list();
      console.log("[NovoAgendamento] Buscando serviços...");
      const servicesData = await Service.list();
      console.log("[NovoAgendamento] Buscando produtos...");
      const productsData = await Product.list();

      setClients(clientsData);
      setServices(servicesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const calculateRealProfit = (selectedService) => {
    if (!selectedService || !selectedService.products_used || !products.length) {
      // Se não há produtos definidos, usar o cálculo antigo como fallback
      return (selectedService?.price || 0) * 0.7;
    }

    let totalCost = 0;
    selectedService.products_used.forEach((usedProduct) => {
      const productDetails = products.find((p) => p.id === usedProduct.product_id);
      if (productDetails) {
        // Usar a quantidade definida no serviço, ou 1 como padrão
        const quantity = usedProduct.quantity || 1;
        totalCost += (productDetails.cost || 0) * quantity;
      }
    });

    const finalPrice = selectedService?.price || 0;
    const realProfit = finalPrice - totalCost;

    // Garantir que o lucro não seja negativo
    return Math.max(realProfit, 0);
  };

  const handleSubmit = async () => {
    if (!formData.client_id || !formData.service_id || !formData.date || !formData.time) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const selectedService = services.find((s) => s.id === formData.service_id);
      const startDateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes));

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (selectedService?.duration || 60));

      // Calcular o lucro real baseado nos produtos utilizados
      const finalPrice = selectedService?.price || 0;
      const realProfit = calculateRealProfit(selectedService);

      const appointmentData = {
        client_id: formData.client_id,
        service_id: formData.service_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: "agendado",
        final_price: finalPrice,
        profit: realProfit, // Agora usa o cálculo real baseado nos produtos
        notes: formData.notes,
        payment_method: formData.payment_method
      };

      await Appointment.create(appointmentData);
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      client_id: "",
      service_id: "",
      date: null,
      time: "",
      notes: "",
      payment_method: "dinheiro"
    });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.client_id || !formData.service_id)) {
      alert("Selecione cliente e serviço");
      return;
    }
    if (step === 2 && (!formData.date || !formData.time)) {
      alert("Selecione data e horário");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const selectedService = services.find((s) => s.id === formData.service_id);
  const selectedClient = clients.find((c) => c.id === formData.client_id);

  // Calcular informações de custo para exibição
  const serviceProfit = selectedService ? calculateRealProfit(selectedService) : 0;
  const serviceCost = selectedService ? (selectedService.price || 0) - serviceProfit : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text">Novo Agendamento</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((num) =>
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= num ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`
              }>

                {num}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 &&
          <>
              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger className="bg-slate-950 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                    <SelectValue placeholder="Selecione uma cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) =>
                  <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {client.name}
                        </div>
                      </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Serviço</Label>
                <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                  <SelectTrigger className="bg-slate-950 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) =>
                  <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            {service.name}
                          </div>
                          <span className="text-green-500 font-bold">R$ {service.price}</span>
                        </div>
                      </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>

              {selectedService &&
            <div className="p-3 rounded-lg" style={{ background: '#333333' }}>
                  <p className="text-sm" style={{ color: '#E0E0E0' }}>
                    Duração: {selectedService.duration} minutos
                  </p>
                  <p className="text-sm" style={{ color: '#E0E0E0' }}>
                    Preço: R$ {selectedService.price.toFixed(2)}
                  </p>
                  <p className="text-sm" style={{ color: '#E0E0E0' }}>
                    Custo estimado: R$ {serviceCost.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-400">
                    Lucro estimado: R$ {serviceProfit.toFixed(2)}
                  </p>
                </div>
            }
            </>
          }

          {step === 2 &&
          <>
              <div>
                <Label>Data do Agendamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    disabled={(date) => date < new Date()} />

                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="time">Horário</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#E0E0E0' }} />
                  <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="pl-10" />

                </div>
              </div>
            </>
          }

          {step === 3 &&
          <>
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ background: '#333333' }}>
                  <h3 className="font-bold mb-2" style={{ color: 'white' }}>Resumo do Agendamento</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Cliente:</strong> {selectedClient?.name}</p>
                    <p><strong>Serviço:</strong> {selectedService?.name}</p>
                    <p><strong>Data:</strong> {formData.date ? format(formData.date, 'PPP', { locale: ptBR }) : ''}</p>
                    <p><strong>Horário:</strong> {formData.time}</p>
                    <p><strong>Duração:</strong> {selectedService?.duration} minutos</p>
                    <p><strong>Valor:</strong> R$ {selectedService?.price.toFixed(2)}</p>
                    <p className="text-green-400"><strong>Lucro previsto:</strong> R$ {serviceProfit.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="a_vista">À Vista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                  id="notes"
                  placeholder="Observações sobre o agendamento..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

                </div>
              </div>
            </>
          }
        </div>

        <div className="flex justify-between pt-4">
          <div>
            {step > 1 &&
            <Button variant="outline" onClick={prevStep}>
                Voltar
              </Button>
            }
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            {step < 3 ?
            <Button onClick={nextStep} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                Próximo
              </Button> :

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">

                {loading ? "Criando..." : "Confirmar Agendamento"}
              </Button>
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}