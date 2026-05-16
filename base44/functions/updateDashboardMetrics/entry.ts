import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";
import { startOfMonth } from "npm:date-fns@3.6.0/startOfMonth";
import { endOfMonth } from "npm:date-fns@3.6.0/endOfMonth";
import { startOfDay } from "npm:date-fns@3.6.0/startOfDay";
import { endOfDay } from "npm:date-fns@3.6.0/endOfDay";

Deno.serve(async (req) => {
    // Canary Log: v12 - Performance Tuning
    console.log("[METRICS_FN_V12] updateDashboardMetrics function invoked with optimized queries.");
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
        
        // Autenticação para garantir que apenas usuários logados possam acionar a sincronização.
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: corsHeaders });
        }

        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        // OTIMIZAÇÃO: As queries agora estão explicitamente filtradas por `start_time` para agendamentos
        // e `created_date` para clientes, garantindo que apenas os dados relevantes sejam processados.
        const [
            currentMonthAppointments,
            todayAppointments,
            currentMonthNewClients
        ] = await Promise.all([
            base44.asServiceRole.entities.Appointment.filter({ 
                start_time_gte: currentMonthStart.toISOString(), 
                start_time_lte: currentMonthEnd.toISOString(), 
                status: 'concluido' 
            }),
            base44.asServiceRole.entities.Appointment.filter({ 
                start_time_gte: todayStart.toISOString(), 
                start_time_lte: todayEnd.toISOString() 
            }),
            base44.asServiceRole.entities.Client.filter({ 
                created_date_gte: currentMonthStart.toISOString(), 
                created_date_lte: currentMonthEnd.toISOString() 
            })
        ]);

        const calculatedMetrics = {
            revenueTotal: currentMonthAppointments.reduce((sum, apt) => sum + (Number(apt.final_price) || 0), 0),
            netProfit: currentMonthAppointments.reduce((sum, apt) => sum + (Number(apt.profit) || 0), 0),
            newClientsCount: currentMonthNewClients.length,
            todayAppointmentsCount: todayAppointments.length,
            completedAppointmentsCount: currentMonthAppointments.length
        };
        
        const existingMetrics = await base44.asServiceRole.entities.DashboardMetric.list('', 1);
        const existingMetric = existingMetrics[0];

        if (existingMetric) {
            await base44.asServiceRole.entities.DashboardMetric.update(existingMetric.id, calculatedMetrics);
        } else {
            await base44.asServiceRole.entities.DashboardMetric.create(calculatedMetrics);
        }

        return new Response(JSON.stringify({ success: true, message: "Métricas do dashboard atualizadas." }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("[FATAL] Erro em updateDashboardMetrics:", error);
        return new Response(JSON.stringify({ error: 'Erro Interno do Servidor', details: error.message }), { status: 500, headers: corsHeaders });
    }
});