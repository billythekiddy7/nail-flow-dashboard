import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StepClient from './StepClient';
import StepDateTime from './StepDateTime';
import StepPayment from './StepPayment';
import GradientButton from '../../ui/GradientButton';

const STEPS = [
  { id: 1, title: 'Cliente', component: StepClient },
  { id: 2, title: 'Data & Hora', component: StepDateTime },
  { id: 3, title: 'Serviço & Pagamento', component: StepPayment }
];

export default function NewAppointmentModal({ isOpen, onClose, onSuccess, initialClient }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    client_id: '',
    date: null,
    time: '',
    service_id: '',
    payment_method: 'dinheiro',
    custom_price: 0,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
      if (initialClient) {
        setFormData(prev => ({ ...prev, client_id: initialClient.id }));
      }
    }
  }, [isOpen, initialClient]);

  const loadData = async () => {
    try {
      const clientsData = await base44.entities.Client.list('-created_date', 100);
      const servicesData = await base44.entities.Service.list('-created_date', 50);
      setClients(clientsData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      client_id: '',
      date: null,
      time: '',
      service_id: '',
      payment_method: 'dinheiro',
      custom_price: 0,
      notes: ''
    });
    setErrors({});
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.client_id) {
        newErrors.client_id = 'Selecione uma cliente';
      }
    }

    if (step === 2) {
      if (!formData.date) {
        newErrors.date = 'Selecione uma data';
      }
      if (!formData.time) {
        newErrors.time = 'Selecione um horário';
      }
    }

    if (step === 3) {
      if (!formData.service_id) {
        newErrors.service_id = 'Selecione um serviço';
      }
      if (!formData.payment_method) {
        newErrors.payment_method = 'Selecione a forma de pagamento';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const selectedService = services.find(s => s.id === formData.service_id);
      const startDateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (selectedService?.duration || 60));

      const finalPrice = formData.custom_price || selectedService?.price || 0;
      const appointmentData = {
        client_id: formData.client_id,
        service_id: formData.service_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'agendado',
        final_price: finalPrice,
        profit: finalPrice,
        notes: formData.notes,
        payment_method: formData.payment_method
      };

      const createdAppointment = await base44.entities.Appointment.create(appointmentData);
      
      // OPERAÇÃO CRONOS: Disparar trigger de atualização incremental
      try {
        await base44.functions.invoke('onAppointmentCreated', { 
          appointmentId: createdAppointment.id 
        });
      } catch (triggerError) {
        console.warn('Falha ao disparar trigger de métricas:', triggerError);
        // Não bloquear o fluxo principal - trigger é best-effort
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
    setLoading(false);
  };

  const handleClientsUpdate = (updatedClients) => {
    setClients(updatedClients);
  };

  const CurrentStepComponent = STEPS.find(step => step.id === currentStep)?.component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] glass-effect">
        <DialogHeader>
          <DialogTitle className="gradient-text text-center">
            Novo Agendamento
          </DialogTitle>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              {STEPS.map((step) => (
                <span 
                  key={step.id}
                  className={`${
                    step.id === currentStep 
                      ? 'text-pink-500 font-semibold' 
                      : step.id < currentStep 
                        ? 'text-green-500' 
                        : 'text-gray-400'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-4 h-4 inline" />
                  ) : (
                    step.id
                  )}{' '}
                  {step.title}
                </span>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Step Content com scroll */}
        <div className="flex-1 overflow-y-auto py-4 px-1 max-h-[60vh]">
          {CurrentStepComponent && (
            <CurrentStepComponent
              formData={formData}
              onChange={setFormData}
              clients={clients}
              services={services}
              onClientsUpdate={handleClientsUpdate}
              errors={errors}
            />
          )}
        </div>

        {/* Navigation Buttons - fixos na parte inferior */}
        <div className="flex justify-between pt-4 border-t border-gray-700 mt-4">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            
            {currentStep < STEPS.length ? (
              <GradientButton onClick={handleNext}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </GradientButton>
            ) : (
              <GradientButton 
                onClick={handleSubmit} 
                disabled={loading}
                variant="success"
              >
                {loading ? 'Salvando...' : 'Criar Agendamento'}
                <Check className="w-4 h-4 ml-1" />
              </GradientButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}