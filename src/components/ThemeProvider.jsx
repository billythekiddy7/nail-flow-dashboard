import React from 'react';
import { useGlobalState } from '@/components/hooks/useGlobalState';

/**
 * OPERAÇÃO ZÊNITE - ThemeProvider Refatorado
 * @description Agora é apenas um wrapper que delega ao GlobalProvider
 * @deprecated Este componente será eventualmente removido - use useGlobalState() diretamente
 */

// Context legado mantido para compatibilidade com código existente
const ThemeContext = React.createContext(null);

export const useTheme = () => {
  // Redireciona para o novo hook global
  return useGlobalState();
};

export const ThemeProvider = ({ children }) => {
  // Este provider agora é apenas um passthrough
  // A lógica real está no GlobalProvider
  const globalState = useGlobalState();
  
  return (
    <ThemeContext.Provider value={globalState}>
      {children}
    </ThemeContext.Provider>
  );
};