import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Zap } from 'lucide-react';

export default function MonthPlaceholder() {
  return (
    <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Calendar className="w-5 h-5 text-pink-500" />
          Visualização Mensal
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2 gradient-text">
          Em Desenvolvimento
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          A visualização mensal completa estará disponível em breve! Por enquanto, use as visualizações de Dia e Semana.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <Clock className="w-3 h-3" />
          Previsão: Próxima atualização
        </div>
      </CardContent>
    </Card>
  );
}