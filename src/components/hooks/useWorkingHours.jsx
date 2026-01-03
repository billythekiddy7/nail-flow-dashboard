import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_HOURS = {
  monday: [{ start: '09:00', end: '18:00' }],
  tuesday: [{ start: '09:00', end: '18:00' }],
  wednesday: [{ start: '09:00', end: '18:00' }],
  thursday: [{ start: '09:00', end: '18:00' }],
  friday: [{ start: '09:00', end: '18:00' }],
  saturday: [{ start: '09:00', end: '15:00' }],
  sunday: []
};

export function useWorkingHours() {
  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkingHours();
  }, []);

  const loadWorkingHours = async () => {
    try {
      const userData = await User.me();
      if (userData.work_hours) {
        setWorkingHours(userData.work_hours);
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    }
    setLoading(false);
  };

  const updateWorkingHours = async (newHours) => {
    try {
      await User.updateMyUserData({ work_hours: newHours });
      setWorkingHours(newHours);
      toast.success('Horários de trabalho salvos!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast.error('Erro ao salvar horários');
      return false;
    }
  };

  return {
    workingHours,
    loading,
    updateWorkingHours,
    setWorkingHours
  };
}