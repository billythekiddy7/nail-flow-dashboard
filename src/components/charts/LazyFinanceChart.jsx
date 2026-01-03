import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';

// Componente de estatísticas resumidas para poucos dados
const SummaryStats = ({ data }) => {
  if (!data || data.length === 0) return null;

  const totalReceita = data.reduce((sum, item) => sum + (item.receita || 0), 0);
  const totalLucro = data.reduce((sum, item) => sum + (item.lucro || 0), 0);
  const totalAtendimentos = data.reduce((sum, item) => sum + (item.atendimentos || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-400">Receita Total</span>
          </div>
          <div className="text-2xl font-bold text-green-500">
            R$ {totalReceita.toFixed(2)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-400">Lucro Total</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">
            R$ {totalLucro.toFixed(2)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-400">Atendimentos</span>
          </div>
          <div className="text-2xl font-bold text-purple-500">
            {totalAtendimentos}
          </div>
        </div>
      </div>

      {/* Mini gráfico de barras para dados únicos */}
      {data.length === 1 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value, name) => [
                  `R$ ${Number(value).toFixed(2)}`,
                  name === 'receita' ? 'Receita' : name === 'lucro' ? 'Lucro' : name
                ]}
              />
              <Bar dataKey="receita" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// Componente principal
export default function LazyFinanceChart({ data = [], title = "Evolução Financeira" }) {
  // Verificar se os dados são válidos
  const hasValidData = Array.isArray(data) && data.length > 0;
  
  if (!hasValidData) {
    return (
      <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5 text-green-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Nenhum dado financeiro encontrado para o período selecionado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se há poucos dados (1-2 pontos), mostrar cards resumo
  if (data.length <= 2) {
    return (
      <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5 text-green-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryStats data={data} />
        </CardContent>
      </Card>
    );
  }

  // Para múltiplos pontos, usar gráfico de área
  return (
    <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp className="w-5 h-5 text-green-500" />
          {title} ({data.length} pontos)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value, name) => [
                  `R$ ${Number(value).toFixed(2)}`,
                  name === 'receita' ? 'Receita' : name === 'lucro' ? 'Lucro' : name
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="receita" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorReceita)"
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="lucro" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorLucro)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}