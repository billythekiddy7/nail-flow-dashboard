
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, DollarSign, TrendingUp, Users, Save } from 'lucide-react';
import { User } from '@/entities/User';
import { useUserSettings } from '../hooks/useUserSettings';
import { useToast } from '../ui/Toast';
import GradientButton from '../ui/GradientButton';

export default function GoalsModal({ isOpen, onClose, onGoalsUpdated }) {
  const [goals, setGoals] = useState({
    revenue_target: '',
    profit_target: '',
    clients_target: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCurrentGoals();
    }
  }, [isOpen]);

  const loadCurrentGoals = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const currentGoals = user.monthly_goals || {};
      
      setGoals({
        revenue_target: currentGoals.revenue_target || '',
        profit_target: currentGoals.profit_target || '',
        clients_target: currentGoals.clients_target || ''
      });
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar metas atuais');
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    // Garantir que valores negativos não sejam aceitos
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setGoals(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedGoals = {
        revenue_target: parseFloat(goals.revenue_target) || 0,
        profit_target: parseFloat(goals.profit_target) || 0,
        clients_target: parseInt(goals.clients_target) || 0,
        last_updated: new Date().toISOString()
      };

      await User.updateMyUserData({
        monthly_goals: updatedGoals
      });

      toast.success('Metas mensais atualizadas com sucesso!', {
        description: 'As metas serão refletidas no painel em tempo real'
      });

      // Notificar componente pai para atualizar
      onGoalsUpdated?.(updatedGoals);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      toast.error('Erro ao salvar metas. Tente novamente.');
    }
    setSaving(false);
  };

  const validateForm = () => {
    const revenueTarget = parseFloat(goals.revenue_target) || 0;
    const profitTarget = parseFloat(goals.profit_target) || 0;
    const clientsTarget = parseInt(goals.clients_target) || 0;

    return revenueTarget > 0 || profitTarget > 0 || clientsTarget > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[85vh] glass-effect flex flex-col"
      >
        {/* Header FIXO */}
        <div className="flex-shrink-0 border-b border-gray-700 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="gradient-text flex items-center gap-2 text-xl">
              <Target className="w-5 h-5" />
              Definir Metas Mensais
            </DialogTitle>
            <DialogDescription>
              Configure suas metas mensais para acompanhar o desempenho do seu negócio
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {/* Meta de Faturamento */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <DollarSign className="w-5 h-5" />
                    Meta de Faturamento Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="revenue-target">Valor desejado (R$)</Label>
                    <Input
                      id="revenue-target"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 5000.00"
                      value={goals.revenue_target}
                      onChange={(e) => handleChange('revenue_target', e.target.value)}
                      className="bg-background border-input"
                    />
                    <p className="text-xs text-gray-400">
                      Receita total que você deseja alcançar este mês
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Meta de Lucro */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                    Meta de Lucro Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="profit-target">Valor desejado (R$)</Label>
                    <Input
                      id="profit-target"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 3500.00"
                      value={goals.profit_target}
                      onChange={(e) => handleChange('profit_target', e.target.value)}
                      className="bg-background border-input"
                    />
                    <p className="text-xs text-gray-400">
                      Lucro líquido que você deseja alcançar este mês
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Meta de Atendimentos */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Users className="w-5 h-5" />
                    Meta de Atendimentos Mensais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="clients-target">Número de atendimentos</Label>
                    <Input
                      id="clients-target"
                      type="number"
                      min="0"
                      placeholder="Ex: 50"
                      value={goals.clients_target}
                      onChange={(e) => handleChange('clients_target', e.target.value)}
                      className="bg-background border-input"
                    />
                    <p className="text-xs text-gray-400">
                      Quantos atendimentos você deseja realizar este mês
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Dica */}
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-1">Dica Profissional</h4>
                    <p className="text-sm text-gray-300">
                      Defina metas realistas e desafiadoras. Você pode acompanhar o progresso 
                      em tempo real na barra lateral do sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer FIXO */}
        <div className="flex-shrink-0 border-t border-gray-700 px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <GradientButton 
              onClick={handleSave} 
              disabled={saving || !validateForm()}
            >
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Metas
                </>
              )}
            </GradientButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
