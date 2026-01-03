
import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { useToast } from '@/components/ui/Toast';

export function useUserSettings() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await User.me();
      setUserData(data);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      if (error.message?.includes("403")) {
        // Correção da chamada da API de toast
        toast.error("Sessão expirada", {
          description: "Faça login novamente para continuar."
        });
      }
      // Original else block removed as per outline, only specific 403 handled this way
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (newData) => {
    try {
      setSaving(true);
      await User.updateMyUserData(newData);
      setUserData(prev => ({ ...prev, ...newData }));
      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      if (error.response?.status === 403) {
        toast.error('Sua sessão expirou. Não foi possível salvar.');
      } else {
        toast.error('Erro ao salvar configurações.');
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const mutate = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  return {
    userData,
    loading,
    saving,
    updateUserData,
    mutate,
    reload: loadUserData
  };
}
