import React from 'react';
import { Button } from '@/components/ui/button';

export default function PeriodToggle({ period: selectedPeriod, onPeriodChange: onChange }) {
  const periods = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mês' },
    { id: 'year', label: 'Ano' },
    { id: 'custom', label: 'Custom' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.id}
          variant={selectedPeriod === period.id ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(period.id)}
          className={`
            text-xs sm:text-sm px-3 py-2
            ${selectedPeriod === period.id 
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
              : 'hover:bg-pink-500/10'
            }
          `}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}