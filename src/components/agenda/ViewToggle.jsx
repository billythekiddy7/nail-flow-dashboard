import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Grid3X3 } from 'lucide-react';

export default function ViewToggle({ viewMode, onChange }) {
  const views = [
  { id: 'day', label: 'Dia', icon: Clock },
  { id: 'week', label: 'Semana', icon: Calendar },
  { id: 'month', label: 'Mês', icon: Grid3X3 }];


  return (
    <div className="bg-slate-950 p-1 flex rounded-lg w-full sm:w-auto">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <Button
            key={view.id}
            variant={viewMode === view.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(view.id)}
            className={`
              flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm
              ${viewMode === view.id ?
            'bg-gradient-to-r from-pink-500 to-purple-600 text-white' :
            'text-gray-300 hover:text-white'}
            `
            }>

            <Icon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{view.label}</span>
          </Button>);

      })}
    </div>);

}