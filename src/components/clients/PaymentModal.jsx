import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Payment, Appointment } from '@/entities/all';
import { useToast } from '@/components/ui/Toast';
import GradientButton from '@/components/ui/GradientButton';

export default function PaymentModal({ isOpen, onClose, client, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'dinheiro',
    payment_date: new Date(),
    notes: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setLoading(true);
    try {
      // Criar o pagamento
      const paymentData = {
        client_id: client.id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date.toISOString().split('T')[0],
        notes: formData.notes,
        status: 'confirmado'
      };

      const payment = await Payment.create(paymentData);

      // Criar um agendamento marcado como concluído para registrar o serviço
      const appointmentData = {
        client_id: client.id,
        service_id: 'manual_payment', // ID especial para pagamentos manuais
        start_time: new Date(formData.payment_date).toISOString(),
        end_time: new Date(formData.payment_date).toISOString(),
        status: 'concluido',
        final_price: parseFloat(formData.amount),
        profit: parseFloat(formData.amount) * 0.7, // Assumir 70% de lucro para pagamentos manuais
        notes: `Pagamento registrado manualmente - ${formData.notes}`,
        payment_method: formData.payment_method
      };

      await Appointment.create(appointmentData);

      toast.success('Pagamento registrado com sucesso!');
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      payment_method: 'dinheiro',
      payment_date: new Date(),
      notes: ''
    });
  };

  const paymentMethods = [
    { value: 'dinheiro', label: '💵 Dinheiro' },
    { value: 'pix', label: '📱 PIX' },
    { value: 'cartao', label: '💳 Cartão' },
    { value: 'transferencia', label: '🏦 Transferência' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-effect dark" style={{ background: '#222222', color: 'white', borderColor: '#333333' }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="gradient-text flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Registrar Pagamento
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cliente: {client?.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor */}
          <div>
            <Label htmlFor="amount">Valor Recebido *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 font-bold">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-12"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          {/* Método de Pagamento */}
          <div>
            <Label>Método de Pagamento *</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data do Pagamento */}
          <div>
            <Label>Data do Pagamento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.payment_date, 'dd/MM/yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.payment_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, payment_date: date || new Date() }))}
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
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o pagamento..."
              className="h-20"
            />
          </div>

          {/* Resumo */}
          <div className="p-3 rounded-lg" style={{ background: 'var(--secondary-bg)' }}>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Resumo do Pagamento
            </p>
            <p className="text-lg font-bold text-green-500">
              R$ {formData.amount || '0,00'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              via {paymentMethods.find(m => m.value === formData.payment_method)?.label || 'Dinheiro'}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <GradientButton type="submit" disabled={loading} className="flex-1">
              {loading ? 'Registrando...' : 'Registrar Pagamento'}
            </GradientButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}