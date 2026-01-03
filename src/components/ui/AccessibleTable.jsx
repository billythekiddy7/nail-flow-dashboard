import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Tabela acessível para leitores de tela quando gráficos não são disponíveis
export default function AccessibleTable({ data, title, columns, className = "" }) {
  if (!data || data.length === 0) {
    return (
      <div className={`sr-only ${className}`}>
        <h3>{title}</h3>
        <p>Nenhum dado disponível para exibição.</p>
      </div>
    );
  }

  return (
    <div className={`sr-only ${className}`}>
      <h3>{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} scope="col">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.format ? column.format(row[column.key]) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Hook para detectar usuários de leitores de tela
export const useScreenReader = () => {
  const [isScreenReader, setIsScreenReader] = React.useState(false);

  React.useEffect(() => {
    // Detectar se usuário está usando leitor de tela
    const detectScreenReader = () => {
      // Verificar se há navegação por teclado ativa
      const hasTabIndex = document.activeElement?.tabIndex >= 0;
      
      // Verificar se há preferência por movimento reduzido
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Verificar se há alta contraste ativo
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Heurística simples para detectar leitores de tela
      if (prefersReducedMotion || prefersHighContrast) {
        setIsScreenReader(true);
      }
    };

    detectScreenReader();
    
    // Escutar mudanças nas preferências de acessibilidade
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = () => detectScreenReader();
    
    reducedMotionQuery.addEventListener('change', handleChange);
    highContrastQuery.addEventListener('change', handleChange);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', handleChange);
      highContrastQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isScreenReader;
};