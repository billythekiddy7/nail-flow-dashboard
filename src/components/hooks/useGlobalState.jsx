import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * OPERAÇÃO ZÊNITE - Provedor de Estado Global
 * @description Gerenciador centralizado de estado da aplicação
 * @version 1.0.0
 * @architecture Single Source of Truth Pattern
 */

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Busca única de dados essenciais na inicialização
  useEffect(() => {
    loadEssentialData();
  }, []);

  const loadEssentialData = async () => {
    console.log('[GLOBAL_STATE] Iniciando carregamento de dados essenciais...');
    setIsLoading(true);
    
    try {
      // Busca ÚNICA dos dados do usuário
      const userData = await base44.auth.me();
      
      if (userData) {
        console.log('[GLOBAL_STATE] Usuário autenticado:', userData.email);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('[GLOBAL_STATE] Usuário não autenticado');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.warn('[GLOBAL_STATE] Erro ao carregar dados do usuário:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('[GLOBAL_STATE] Carregamento concluído');
    }
  };

  // Função para atualizar o usuário (útil após edições de perfil)
  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  // Função para recarregar dados do usuário (útil após operações críticas)
  const reloadUser = async () => {
    console.log('[GLOBAL_STATE] Recarregando dados do usuário...');
    try {
      const userData = await base44.auth.me();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('[GLOBAL_STATE] Erro ao recarregar usuário:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    updateUser,
    reloadUser,
    // Tema permanece dark (conforme Operação anterior)
    isDark: true
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

// Hook customizado para facilitar o acesso ao contexto
export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  
  if (!context) {
    throw new Error('useGlobalState deve ser usado dentro de um GlobalProvider');
  }
  
  return context;
};