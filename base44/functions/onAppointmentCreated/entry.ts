import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { startOfMonth } from "npm:date-fns@3.6.0/startOfMonth";
import { endOfMonth } from "npm:date-fns@3.6.0/endOfMonth";

/**
 * OPERAÇÃO CRONOS - Trigger: Criação de Agendamento
 * @description Atualiza métricas do dashboard incrementalmente quando um novo agendamento é criado
 * @version 1.0.0
 * @architecture Compute-on-Write Pattern
 */

Deno.serve(async (req) => {
    console.log("[CRONOS_TRIGGER_V1] onAppointmentCreated invocado.");
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return new Response(JSON.stringify({ success: false, message: 'Não autenticado' }), {
                status: 401,
                headers: corsHeaders
            });
        }

        const { appointmentId } = await req.json();
        
        if (!appointmentId) {
            return new Response(JSON.stringify({ success: false, message: 'appointmentId é obrigatório' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Buscar o agendamento recém-criado
        const appointments = await base44.asServiceRole.entities.Appointment.filter({ id: appointmentId });
        
        if (!appointments || appointments.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Agendamento não encontrado' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        const appointment = appointments[0];
        const appointmentDate = new Date(appointment.start_time);
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);

        // Verificar se o agendamento é do mês atual
        const isCurrentMonth = appointmentDate >= currentMonthStart && appointmentDate <= currentMonthEnd;

        // Buscar ou criar o registro de métricas do usuário
        let metricsData = await base44.asServiceRole.entities.DashboardMetric.list('', 1);
        let metrics = metricsData[0];

        if (!metrics) {
            // Criar registro inicial de métricas
            metrics = await base44.asServiceRole.entities.DashboardMetric.create({
                revenueTotal: 0,
                netProfit: 0,
                newClientsCount: 0,
                todayAppointmentsCount: 0,
                completedAppointmentsCount: 0
            });
        }

        // Atualizar contadores se o agendamento for do mês atual
        if (isCurrentMonth) {
            const updates = {
                todayAppointmentsCount: metrics.todayAppointmentsCount + 1
            };

            // Se o agendamento já está concluído, atualizar métricas de receita
            if (appointment.status === 'concluido') {
                updates.revenueTotal = (metrics.revenueTotal || 0) + (appointment.final_price || 0);
                updates.netProfit = (metrics.netProfit || 0) + (appointment.profit || 0);
                updates.completedAppointmentsCount = (metrics.completedAppointmentsCount || 0) + 1;
            }

            await base44.asServiceRole.entities.DashboardMetric.update(metrics.id, updates);
        }

        console.log(`[CRONOS_TRIGGER] Métricas atualizadas para agendamento: ${appointmentId}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Métricas atualizadas com sucesso',
            updated: isCurrentMonth
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('[CRONOS_TRIGGER] Erro:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Erro ao atualizar métricas',
            error: error.message 
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
});