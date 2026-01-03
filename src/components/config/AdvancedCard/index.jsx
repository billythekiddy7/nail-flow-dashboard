import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Clock, Heart, Download, Lock } from 'lucide-react';
import WorkingHoursModal from './WorkingHoursModal';
import LoyaltyModal from './LoyaltyModal';
import { useWorkingHours } from '@/components/hooks/useWorkingHours';

export default function AdvancedCard({ userData, onUpdate }) {
  const [showWorkingHours, setShowWorkingHours] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const { workingHours, updateWorkingHours } = useWorkingHours();

  const handleWorkingHoursSave = async (newHours) => {
    const success = await updateWorkingHours(newHours);
    if (success) {
      setShowWorkingHours(false);
    }
  };

  const handleLoyaltySave = (loyaltySettings) => {
    onUpdate({ loyalty_settings: loyaltySettings });
    setShowLoyalty(false);
  };

  const exportData = async () => {
    // Implementar exportação futura
    alert('Funcionalidade de backup em desenvolvimento');
  };

  return (
    <>
      <Card className="card-3d relative overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        {/* Overlay de bloqueio */}
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 flex flex-col items-center justify-center rounded-xl">
          <div className="bg-gray-800/90 p-6 rounded-xl text-center max-w-xs">
            <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Em Breve!</h3>
            <p className="text-gray-300 text-sm">
              Esta funcionalidade estará disponível na próxima atualização.
            </p>
          </div>
        </div>
        
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-500" />
            Configurações Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Horários de Trabalho */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-white">Horários de Trabalho</p>
                <p className="text-xs text-gray-400">Configure seus dias e horários de atendimento</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowWorkingHours(true)}>
              Configurar
            </Button>
          </div>

          {/* Programa de Fidelidade */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <div>
                <p className="font-medium text-white">Programa de Fidelidade</p>
                <p className="text-xs text-gray-400">Recompense suas clientes mais fiéis</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLoyalty(true)}>
              {userData?.loyalty_settings?.enabled ? 'Ativo' : 'Configurar'}
            </Button>
          </div>

          {/* Backup & Export */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-white">Backup & Export</p>
                <p className="text-xs text-gray-400">Baixar dados de clientes e agenda</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={exportData}>
              Em breve
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <WorkingHoursModal
        isOpen={showWorkingHours}
        onClose={() => setShowWorkingHours(false)}
        workingHours={workingHours}
        onSave={handleWorkingHoursSave}
      />

      <LoyaltyModal
        isOpen={showLoyalty}
        onClose={() => setShowLoyalty(false)}
        loyaltySettings={userData?.loyalty_settings}
        onSave={handleLoyaltySave}
      />
    </>
  );
}