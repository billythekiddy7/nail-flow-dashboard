import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Plus, Minus, User, Scissors, Package, DollarSign, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, Client, Service, Product, Payment } from '@/entities/all';
import { useToast } from '@/components/ui/Toast';
import GradientButton from '@/components/ui/GradientButton';
import { createCompleteAttendance } from '@/functions/createCompleteAttendance'; // Importar nova função

export default function NewAttendanceModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    products_used: [],
    final_price: 0,
    payment_method: 'dinheiro',
    date: new Date(),
    notes: '',
    schedule_maintenance: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const clientsData = await Client.list('-created_date', 50);
      const servicesData = await Service.list('-created_date', 30);
      const productsData = await Product.list('-created_date', 100);
      
      setClients(clientsData);
      setServices(servicesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      service_id: '',
      products_used: [],
      final_price: 0,
      payment_method: 'dinheiro',
      date: new Date(),
      notes: '',
      schedule_maintenance: false
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Selecione uma cliente';
    }

    if (!formData.service_id) {
      newErrors.service_id = 'Selecione um serviço';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Selecione a forma de pagamento';
    }

    // Validação de estoque negativo conforme auditoria
    const stockIssues = [];
    formData.products_used.forEach(usedProduct => {
      const product = products.find(p => p.id === usedProduct.product_id);
      if (product && (product.stock - usedProduct.qty) < 0) {
        stockIssues.push(`${product.name} (disponível: ${product.stock}, necessário: ${usedProduct.qty})`);
      }
    });

    if (stockIssues.length > 0) {
      newErrors.products_used = `Estoque insuficiente: ${stockIssues.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products_used: [...prev.products_used, { product_id: '', qty: 1 }]
    }));
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products_used: prev.products_used.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      products_used: prev.products_used.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotalCost = () => {
    return formData.products_used.reduce((total, usedProduct) => {
      const product = products.find(p => p.id === usedProduct.product_id);
      return total + ((product?.cost_unit || 0) * usedProduct.qty);
    }, 0);
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    setFormData(prev => ({
      ...prev,
      service_id: serviceId,
      final_price: service?.price || 0,
      products_used: service?.products_used || []
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedService = services.find(s => s.id === formData.service_id);
      const startDateTime = new Date(formData.date);
      startDateTime.setHours(12, 0, 0, 0); // Definir horário padrão
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (selectedService?.duration || 60));

      const totalCost = calculateTotalCost();
      const finalPrice = formData.final_price || selectedService?.price || 0;
      const realProfit = finalPrice - totalCost;

      // 1. Montar payload para a função de backend
      const appointmentData = {
        client_id: formData.client_id,
        service_id: formData.service_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'concluido',
        final_price: finalPrice,
        profit: realProfit,
        notes: formData.notes,
        payment_method: formData.payment_method,
        products_used: formData.products_used
      };

      const paymentData = {
        client_id: formData.client_id,
        // appointment_id will be set by the backend function after appointment creation
        amount: finalPrice,
        method: formData.payment_method,
        date: formData.date.toISOString().split('T')[0],
        status: 'confirmado'
      };
      
      const payload = {
          appointmentData,
          paymentData,
          productsUsed: formData.products_used
      };

      // 2. Chamar a função de backend transacional
      const { data, error } = await createCompleteAttendance(payload);

      if (error) {
        throw new Error(error.response?.data?.details || 'A resposta do servidor indicou um erro.');
      }
      
      toast.success('Atendimento registrado com sucesso!', {
        description: `Lucro: R$ ${realProfit.toFixed(2)}`
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao registrar atendimento:', error);
      toast.error('Erro ao registrar atendimento.', {
          description: error.message || "Tente novamente."
      });
    }
    setLoading(false);
  };

  const selectedService = services.find(s => s.id === formData.service_id);
  const totalCost = calculateTotalCost();
  const profit = (formData.final_price || 0) - totalCost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] glass-effect dark overflow-y-auto" 
        style={{ background: '#222222', color: 'white', borderColor: '#333333' }}
        role="dialog"
        aria-labelledby="attendance-modal-title"
        aria-describedby="attendance-modal-description"
      >
        <DialogHeader>
          <DialogTitle id="attendance-modal-title" className="gradient-text">
            Registrar Atendimento Manual
          </DialogTitle>
          <DialogDescription>
            Use para registrar serviços que não foram agendados pelo sistema.
          </DialogDescription>
          <p id="attendance-modal-description" className="text-sm text-gray-400">
            Registre um atendimento concluído e atualize automaticamente o estoque
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente e Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client-select">Cliente *</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => setFormData({...formData, client_id: value})}
                aria-describedby={errors.client_id ? "client-error" : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {client.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p id="client-error" className="text-red-400 text-xs mt-1" role="alert">
                  {errors.client_id}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="service-select">Serviço *</Label>
              <Select 
                value={formData.service_id} 
                onValueChange={handleServiceChange}
                aria-describedby={errors.service_id ? "service-error" : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4" />
                          {service.name}
                        </div>
                        <span className="text-green-500 font-bold ml-2">R$ {service.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_id && (
                <p id="service-error" className="text-red-400 text-xs mt-1" role="alert">
                  {errors.service_id}
                </p>
              )}
            </div>
          </div>

          {/* Produtos Utilizados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Produtos Utilizados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduct}
                className="flex items-center gap-2"
                aria-label="Adicionar produto"
              >
                <Plus className="w-4 h-4" />
                Adicionar Produto
              </Button>
            </div>

            {formData.products_used.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-gray-600 rounded-lg">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-400">Nenhum produto adicionado</p>
              </div>
            )}

            <div className="space-y-3">
              {formData.products_used.map((usedProduct, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  <Select
                    value={usedProduct.product_id}
                    onValueChange={(value) => updateProduct(index, 'product_id', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - estoque: {product.stock} {product.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Qtd:</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={usedProduct.qty}
                      onChange={(e) => updateProduct(index, 'qty', parseFloat(e.target.value) || 0)}
                      className="w-20"
                      aria-label={`Quantidade do produto ${index + 1}`}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(index)}
                    className="text-red-400 hover:text-red-300"
                    aria-label={`Remover produto ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {errors.products_used && (
              <p className="text-red-400 text-xs mt-1" role="alert">
                {errors.products_used}
              </p>
            )}
          </div>

          {/* Valor e Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="final-price">Valor Final (R$)</Label>
              <Input
                id="final-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.final_price}
                onChange={(e) => setFormData({...formData, final_price: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <Label htmlFor="payment-method">Forma de Pagamento *</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => setFormData({...formData, payment_method: value})}
                aria-describedby={errors.payment_method ? "payment-error" : undefined}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="debit">💳 Cartão Débito</SelectItem>
                  <SelectItem value="credit">💳 Cartão Crédito</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p id="payment-error" className="text-red-400 text-xs mt-1" role="alert">
                  {errors.payment_method}
                </p>
              )}
            </div>
          </div>

          {/* Data */}
          <div>
            <Label>Data do Atendimento</Label>
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
                  onSelect={(date) => setFormData({...formData, date})}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre o atendimento..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Agendar Manutenção */}
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule-maintenance"
              checked={formData.schedule_maintenance}
              onCheckedChange={(checked) => setFormData({...formData, schedule_maintenance: checked})}
            />
            <Label htmlFor="schedule-maintenance">Agendar manutenção (em 15 dias)</Label>
          </div>

          {/* Resumo Financeiro */}
          {selectedService && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Valor do Serviço:</span>
                  <span className="text-green-400">R$ {(formData.final_price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo dos Produtos:</span>
                  <span className="text-red-400">R$ {totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-600 pt-2">
                  <span>Lucro Líquido:</span>
                  <span className={profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    R$ {profit.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <GradientButton 
            onClick={(e) => handleSave(e)} 
            disabled={loading}
            aria-describedby={loading ? "loading-message" : undefined}
          >
            {loading ? (
              <>
                <span className="sr-only" id="loading-message">Carregando</span>
                Registrando...
              </>
            ) : (
              'Registrar Atendimento'
            )}
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}