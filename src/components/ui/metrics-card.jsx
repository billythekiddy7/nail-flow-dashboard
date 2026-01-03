import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricsCard({ 
  title, 
  value, 
  change, 
  changeType = "positive",
  icon: Icon,
  color = "pink",
  showChange = true // Controlar se deve mostrar a mudança
}) {
  const colorClasses = {
    pink: "from-pink-500 to-purple-600",
    blue: "from-blue-500 to-cyan-600", 
    green: "from-green-500 to-emerald-600",
    orange: "from-orange-500 to-red-600"
  };

  return (
    <Card className="card-3d overflow-hidden relative group cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8 group-hover:scale-125 transition-transform duration-300`} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
        <div className="space-y-0 flex-1">
          <p className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
        </div>
        <div className={`p-1.5 sm:p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex-shrink-0`}>
          <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="space-y-2">
          <div className="text-lg sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {value}
          </div>
          {showChange && change && (
            <div className="flex items-center space-x-1">
              {changeType === "positive" ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 text-xs">
                <span className={`font-medium ${changeType === "positive" ? "text-green-500" : "text-red-500"}`}>
                  {change}
                </span>
                <span className="hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                  vs mês anterior
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}