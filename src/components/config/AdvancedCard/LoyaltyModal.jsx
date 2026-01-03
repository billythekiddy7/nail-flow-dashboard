import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Heart, Gift } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function LoyaltyModal({ isOpen, onClose, loyaltySettings, onSave }) {
  const [settings, setSettings] = useState(loyaltySettings || {
    enabled: false,
    points_per_real: 5,
    reward_threshold: 100,
    reward_description: 'Desconto de 20%'
  });

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-effect dark" style={{ background: '#222222', color: 'white', borderColor: '#333333' }}>
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Programa de Fidelidade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ativar/Desativar */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-medium">Ativar Programa de Fidelidade</Label>
              <p className="text-xs text-gray-400">Recompense suas clientes mais fiéis</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Pontos por Real */}
              <div className="space-y-3">
                <Label className="text-white">Pontos por Real gasto</Label>
                <div className="px-3">
                  <Slider
                    value={[settings.points_per_real]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, points_per_real: value }))}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>1 ponto</span>
                  <span className="font-bold text-pink-500">{settings.points_per_real} pontos</span>
                  <span>20 pontos</span>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  A cada R$ 1,00 gasto = {settings.points_per_real} pontos
                </p>
              </div>

              {/* Meta para Prêmio */}
              <div>
                <Label htmlFor="reward_threshold" className="text-white">Pontos necessários para prêmio</Label>
                <Input
                  id="reward_threshold"
                  type="number"
                  value={settings.reward_threshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, reward_threshold: parseInt(e.target.value) || 0 }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                  min="50"
                  step="10"
                />
              </div>

              {/* Descrição do Prêmio */}
              <div>
                <Label htmlFor="reward_description" className="text-white">Descrição do Prêmio</Label>
                <Input
                  id="reward_description"
                  value={settings.reward_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, reward_description: e.target.value }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                  placeholder="Ex: Manicure grátis, Desconto de 30%"
                />
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-pink-500" />
                  <span className="font-medium text-white">Preview do Programa</span>
                </div>
                <p className="text-sm text-gray-300">
                  • A cada R$ 1,00 gasto: <strong className="text-pink-400">+{settings.points_per_real} pontos</strong>
                </p>
                <p className="text-sm text-gray-300">
                  • Ao atingir <strong className="text-pink-400">{settings.reward_threshold} pontos</strong>: {settings.reward_description}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Exemplo: gastando R$ {Math.ceil(settings.reward_threshold / settings.points_per_real)},00 já garante o prêmio!
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <GradientButton onClick={handleSave}>
            Salvar Configurações
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}