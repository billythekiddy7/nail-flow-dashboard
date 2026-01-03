import { useState, useEffect } from 'react';
import { Appointment } from '@/entities/Appointment';
import { Client } from '@/entities/Client';
import { Service } from '@/entities/Service';

// Cache para histórico de pagamentos
let paymentsCache = null;
let lastPaymentsUpdate = 0;
const PAYMENTS_CACHE_DURATION = 60000; // 1 minuto

export function usePaymentsHistory({ start, end, page = 1, pageSize = 10 }) {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!start || !end) return;

    const cacheKey = `${start.getTime()}_${end.getTime()}_${page}`;
    const now = Date.now();
    
    // Verificar cache primeiro
    if (paymentsCache && paymentsCache.key === cacheKey && now - lastPaymentsUpdate < PAYMENTS_CACHE_DURATION) {
      const cached = paymentsCache.data;
      setPayments(cached.payments);
      setClients(cached.clients);
      setServices(cached.services);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        
        // Rate limiting: aguardar se última chamada foi muito recente
        if (now - lastPaymentsUpdate < 4000) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
        
        // Carregar dados em sequência com delays para evitar rate limit
        const appointmentsData = await Appointment.list('-created_date', 30).catch(() => []);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        const clientsData = await Client.list('-created_date', 20).catch(() => []);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        const servicesData = await Service.list('-created_date', 15).catch(() => []);

        // Filtrar por período e status concluído
        const filteredAppointments = appointmentsData.filter(apt => {
          try {
            const aptDate = new Date(apt.start_time);
            return aptDate >= start && 
                   aptDate <= end && 
                   apt.status === 'concluido';
          } catch {
            return false;
          }
        });

        // Adicionar nome do cliente e serviço
        const enrichedPayments = filteredAppointments.map(apt => {
          const client = clientsData.find(c => c.id === apt.client_id);
          const service = servicesData.find(s => s.id === apt.service_id);
          return {
            ...apt,
            client_name: client?.name || 'Cliente não encontrado',
            service_name: service?.name || 'Serviço não encontrado'
          };
        });

        // Paginação
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedPayments = enrichedPayments.slice(startIndex, endIndex);
        
        const result = {
          payments: paginatedPayments,
          clients: clientsData,
          services: servicesData,
          totalPages: Math.ceil(enrichedPayments.length / pageSize)
        };

        // Armazenar no cache
        paymentsCache = {
          key: cacheKey,
          data: result
        };
        lastPaymentsUpdate = now;

        setPayments(result.payments);
        setClients(result.clients);
        setServices(result.services);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('Erro ao carregar histórico de pagamentos:', error);
        
        // Em caso de rate limit, usar dados do cache se disponíveis
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          if (paymentsCache && paymentsCache.key === cacheKey) {
            const cached = paymentsCache.data;
            setPayments(cached.payments);
            setClients(cached.clients);
            setServices(cached.services);
            setTotalPages(cached.totalPages);
            return;
          }
        }
        
        // Usar dados vazios em caso de erro
        setPayments([]);
        setClients([]);
        setServices([]);
        setTotalPages(0);
      }
      setLoading(false);
    };

    // Debounce: aguardar 800ms antes de executar
    const timeoutId = setTimeout(fetchPayments, 800);
    
    return () => clearTimeout(timeoutId);
  }, [start, end, page, pageSize]);

  return { payments, loading, totalPages };
}