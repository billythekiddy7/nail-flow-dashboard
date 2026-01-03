
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Service } from '@/entities/Service';
import StepInfo from './StepInfo';
import StepConfirm from './StepConfirm';
import GradientButton from '../../ui/GradientButton';
import { useToast } from '@/components/ui/Toast';

const STEPS = [
  { id: 1, title: 'Informações', component: StepInfo },
  { id: 2, title: 'Confirmação', component: StepConfirm }
];

export default function NewServiceModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration: 60,
    category: 'manicure',
    color: '#E6007A',
    slug: ''
  });
  const { toast } = useToast();

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: '',
      price: 0,
      duration: 60,
      category: 'manicure',
      color: '#E6007A',
      slug: ''
    });
    setErrors({});
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name || formData.name.length < 3) {
        newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
      }
      if (!formData.price || formData.price <= 0) {
        newErrors.price = 'Preço deve ser maior que zero';
      }
      if (!formData.duration || formData.duration < 5) {
        newErrors.duration = 'Duração deve ser de pelo menos 5 minutos';
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
    // Only validate step 1 if it's the current step upon submission (which means user went back and submitted)
    // The previous `handleNext` already validated step 1 if coming from step 1 to 2.
    // If we're on the last step (2), and we click submit, we don't need to re-validate step 1 specifically,
    // but ensure necessary data for submission is there.
    // Given the structure, `validateStep(1)` ensures core fields are present before trying to create.
    if (!validateStep(1)) return; // Re-validate step 1 just in case, though ideally it was validated on next.

    setLoading(true);
    try {
      const serviceData = {
        name: formData.name,
        price: formData.price,
        duration: formData.duration,
        category: formData.category,
        color: formData.color,
        slug: formData.slug,
        description: `Serviço de ${formData.name}`
      };

      await Service.create(serviceData);
      toast.success('Serviço cadastrado com sucesso!');

      onSuccess?.();
      onClose(); // Close the modal
      resetForm(); // Reset form after successful submission and close
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      toast.error('Erro ao cadastrar serviço. Tente novamente.');
    }
    setLoading(false);
  };

  // The original handleClose was used for onOpenChange and also reset form.
  // The outline changes onOpenChange to `onClose` directly.
  // The `Cancel` button still calls `handleClose` which resets the form.
  // This means clicking outside or pressing ESC will only close, not reset.
  // If `resetForm` is always desired on close via any means,
  // `onClose` prop should handle it or `Dialog` should be wrapped.
  // For now, adhering to the outline.
  const handleClose = () => {
    onClose();
    resetForm();
  };

  const CurrentStepComponent = STEPS.find(step => step.id === currentStep)?.component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="glass-effect overflow-y-auto"
        style={{
          width: '95vw',
          maxWidth: '95vw',
          maxHeight: '90vh',
          margin: '2.5vw'
        }}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="gradient-text text-center text-lg sm:text-xl">
            Novo Serviço
          </DialogTitle>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              {STEPS.map((step) => (
                <span
                  key={step.id}
                  className={`flex items-center gap-1 ${
                    step.id === currentStep
                      ? 'text-pink-500 font-semibold'
                      : step.id < currentStep
                        ? 'text-green-500'
                        : 'text-gray-400'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current text-xs flex items-center justify-center text-black">
                      {step.id}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </span>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Step Content com scroll otimizado para mobile */}
        <div className="flex-1 overflow-y-auto py-2 px-1 max-h-[50vh] sm:max-h-[60vh]">
          {CurrentStepComponent && (
            <CurrentStepComponent
              formData={formData}
              onChange={setFormData}
              errors={errors}
            />
          )}
        </div>

        {/* Navigation Buttons - otimizado para mobile */}
        <div className="flex flex-col sm:flex-row justify-between pt-4 border-t border-gray-700 mt-4 gap-3">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious} className="w-full sm:w-auto">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={handleClose} className="order-2 sm:order-1 w-full sm:w-auto">
              Cancelar
            </Button>

            {currentStep < STEPS.length ? (
              <GradientButton onClick={handleNext} className="order-1 sm:order-2 w-full sm:w-auto">
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </GradientButton>
            ) : (
              <GradientButton
                onClick={handleSubmit}
                disabled={loading}
                variant="success"
                className="order-1 sm:order-2 w-full sm:w-auto"
              >
                {loading ? 'Salvando...' : 'Criar Serviço'}
                <Check className="w-4 h-4 ml-1" />
              </GradientButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
