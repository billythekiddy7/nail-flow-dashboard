import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * @description (v3 - Otimizado) Busca agendamentos utilizando filtragem por data no servidor.
 *              Aceita um objeto de range de datas e passa para a query do SDK, melhorando a performance.
 * @param {{start: Date, end: Date}} dateRange - Objeto contendo as datas de início e fim para o filtro.
 * @returns {{appointments: Array, loading: boolean, error: object}} - Estado dos agendamentos.
 */
export function useAppointments(dateRange) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const { start, end } = dateRange || {};

    const fetchAppointments = async () => {
      if (!start || !end) {
        setAppointments([]);
        setLoading(false);
        return;
      };
      
      setLoading(true);
      setError(null);
      
      try {
        // Constrói o objeto de filtro para a query no servidor
        const filterOptions = {
            start_time_gte: start.toISOString(),
            start_time_lte: end.toISOString()
        };
        
        // Executa a busca otimizada com filtro no servidor
        const filteredAppointments = await base44.entities.Appointment.filter(filterOptions, '-start_time', 200);

        if (isMounted) {
          setAppointments(filteredAppointments || []);
        }
      } catch (err) {
        console.error("[useAppointments] Erro ao buscar agendamentos:", err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if(isMounted) {
            setLoading(false);
        }
      }
    };

    // Adicionar debounce para evitar chamadas excessivas
    const timeoutId = setTimeout(fetchAppointments, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [dateRange?.start?.getTime(), dateRange?.end?.getTime()]); // Usar getTime() para comparação mais estável

  return { appointments, loading, error };
}