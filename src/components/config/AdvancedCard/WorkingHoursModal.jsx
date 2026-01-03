import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, Trash2 } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

const DAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export default function WorkingHoursModal({ isOpen, onClose, workingHours, onSave }) {
  const [hours, setHours] = useState(workingHours || {});

  const handleDayToggle = (day, enabled) => {
    if (enabled) {
      setHours(prev => ({
        ...prev,
        [day]: [{ start: '09:00', end: '18:00' }]
      }));
    } else {
      setHours(prev => ({
        ...prev,
        [day]: []
      }));
    }
  };

  const handleTimeChange = (day, index, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day].map((period, i) => 
        i === index ? { ...period, [field]: value } : period
      )
    }));
  };

  const addTimePeriod = (day) => {
    setHours(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '09:00', end: '18:00' }]
    }));
  };

  const removeTimePeriod = (day, index) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(hours);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-effect dark" style={{ background: '#222222', color: 'white', borderColor: '#333333' }}>
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários de Trabalho
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {DAYS.map((day) => {
            const dayHours = hours[day.key] || [];
            const isEnabled = dayHours.length > 0;

            return (
              <div key={day.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-medium">{day.label}</Label>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleDayToggle(day.key, checked)}
                  />
                </div>

                {isEnabled && (
                  <div className="space-y-2 ml-4">
                    {dayHours.map((period, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input
                          type="time"
                          value={period.start}
                          onChange={(e) => handleTimeChange(day.key, index, 'start', e.target.value)}
                          className="w-32 bg-neutral-900 border-neutral-700"
                        />
                        <span className="text-gray-400">até</span>
                        <Input
                          type="time"
                          value={period.end}
                          onChange={(e) => handleTimeChange(day.key, index, 'end', e.target.value)}
                          className="w-32 bg-neutral-900 border-neutral-700"
                        />
                        {dayHours.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTimePeriod(day.key, index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTimePeriod(day.key)}
                      className="border-pink-500 text-pink-500 hover:bg-pink-500/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Horário
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <GradientButton onClick={handleSave}>
            Salvar Horários
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}