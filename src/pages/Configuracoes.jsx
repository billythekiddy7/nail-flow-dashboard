import React, { useState } from 'react';
import { Save } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import GradientButton from '@/components/ui/GradientButton';
import { useUserSettings } from '@/components/hooks/useUserSettings';

// Componentes otimizados
import BusinessProfileCard from '@/components/config/BusinessProfileCard';
import PublicPageCard from '@/components/config/PublicPageCard';
import AdvancedCard from '@/components/config/AdvancedCard/index';
import ConfigErrorBoundary from '@/components/config/ConfigErrorBoundary';
import { ResponsiveGrid, ResponsiveContainer } from '@/components/ui/ResponsiveGrid';
import PasswordCard from '@/components/config/PasswordCard';

export default function Configuracoes() {
  const { userData, loading, saving, updateUserData } = useUserSettings();
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Atualizar formData quando userData carrega
  React.useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  const handleFieldChange = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    const success = await updateUserData(formData);
    if (success) {
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer className="py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded" style={{ background: 'var(--border)' }} />
          <ResponsiveGrid minItemWidth="320px" gap="1.5rem">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-96 rounded-2xl" style={{ background: 'var(--border)' }} />
            ))}
          </ResponsiveGrid>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ConfigErrorBoundary>
      <ResponsiveContainer maxWidth="1400px" className="py-6">
        <div className="space-y-8">
          <PageHeader
            title="Configurações"
            subtitle="Personalize sua conta e sua página pública"
          >
            <GradientButton 
              onClick={handleSaveAll} 
              disabled={!hasChanges || saving}
              className="min-w-[160px]"
              aria-label={hasChanges ? "Salvar alterações pendentes" : "Nenhuma alteração para salvar"}
            >
              <Save className="w-4 h-4 mr-2" aria-hidden="true" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </GradientButton>
          </PageHeader>

          {/* Grid responsivo para as configurações */}
          <ResponsiveGrid minItemWidth="320px" gap="1.5rem">
            {/* Coluna 1: Perfil do Negócio */}
            <BusinessProfileCard 
              userData={formData}
              onChange={handleFieldChange}
            />
            
            {/* Coluna 2: Página Pública */}
            <PublicPageCard 
              userData={formData}
              onChange={handleFieldChange}
            />

            {/* Coluna 3: Configurações Avançadas */}
            <AdvancedCard 
              userData={formData}
              onUpdate={handleFieldChange}
            />

            {/* Coluna 4: Alterar Senha */}
            <PasswordCard />
          </ResponsiveGrid>

          {/* Indicador de mudanças não salvas com melhor acessibilidade */}
          {hasChanges && (
            <div 
              className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-lg z-50"
              role="status"
              aria-live="polite"
              aria-label="Alterações não salvas"
            >
              <p className="text-white text-sm font-medium">
                Você tem alterações não salvas
              </p>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </ConfigErrorBoundary>
  );
}