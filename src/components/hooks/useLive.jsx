import { useState, useEffect, useRef } from 'react';

/**
 * @description (v2 - Estabilizado) Hook simplificado para buscar dados de uma entidade no carregamento.
 *              Esta versão remove o polling automático e o cache global para criar um comportamento
 *              previsível e evitar sobrecarga de requisições concorrentes.
 * @param {EntityClass} entityClass - A classe da entidade a ser consultada.
 * @param {object} filter - O objeto de filtro a ser aplicado na consulta.
 * @returns {{ data: Array, loading: boolean, error: object }} - O estado dos dados.
 */
export const useLive = (entityClass, filter = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchData = async () => {
      try {
        if (!entityClass || !entityClass.list) {
          console.error('Invalid entity class provided to useLive');
          if (mountedRef.current) {
            setLoading(false);
            setError('Invalid entity class');
          }
          return;
        }

        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }
        
        let result;
        if (Object.keys(filter).length > 0) {
          result = await entityClass.filter(filter, '-created_date', 100); // Limite razoável
        } else {
          result = await entityClass.list('-created_date', 100); // Limite razoável
        }
        
        if (mountedRef.current) {
          setData(result || []);
        }

      } catch (err) {
        console.error('Error in useLive hook:', err);
        if (mountedRef.current) {
          setError(err.message || 'Network Error');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [entityClass, JSON.stringify(filter)]); // Apenas re-executa se a entidade ou o filtro mudarem

  return { data, loading, error };
};

// A função de limpar cache não é mais necessária com a remoção do cache global.
export const clearCache = () => {
  console.warn("clearCache is deprecated as useLive no longer uses a global cache.");
};