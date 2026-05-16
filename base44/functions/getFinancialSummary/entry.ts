import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";
import { format } from "npm:date-fns@3.6.0/format";

Deno.serve(async (req) => {
    // Canary Log: v9 - Final Architecture
    console.log("[FINANCE_FN_V9] getFinancialSummary function invoked.");
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
            return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: corsHeaders });
        }

        const { startDate, endDate, summaryOnly = false } = await req.json();

        if (!startDate || !endDate) {
            return new Response(JSON.stringify({ error: 'startDate e endDate são obrigatórios' }), { status: 400, headers: corsHeaders });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const completedAppointments = await base44.entities.Appointment.filter({
            start_time_gte: start.toISOString(),
            start_time_lte: end.toISOString(),
            status: 'concluido'
        });

        const filteredPayments = await base44.entities.Payment.filter({
            date_gte: start.toISOString(),
            date_lte: end.toISOString()
        });
        
        const revenueTotal = filteredPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
        const netProfit = completedAppointments.reduce((sum, apt) => sum + (Number(apt.profit) || 0), 0);
        const totalApts = completedAppointments.length;
        const ticketMedio = totalApts > 0 ? (revenueTotal / totalApts) : 0;

        const dailyData = {};
        filteredPayments.forEach(payment => {
            const day = format(new Date(payment.date), 'yyyy-MM-dd');
            if (!dailyData[day]) dailyData[day] = { date: day, receita: 0 };
            dailyData[day].receita += (Number(payment.amount) || 0);
        });
        
        const series = Object.values(dailyData)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(item => ({ date: format(new Date(item.date + 'T12:00:00'), 'dd/MM'), receita: item.receita }));

        const summary = { revenueTotal, netProfit, ticketMedio, totalApts, series };
        
        if (summaryOnly) {
            return new Response(JSON.stringify({ summary }), { status: 200, headers: corsHeaders });
        }

        const clientIds = [...new Set(filteredPayments.map(p => p.client_id).filter(Boolean))];
        const clients = clientIds.length > 0 ? await base44.entities.Client.filter({ id: { $in: clientIds } }) : [];

        const serviceIds = [...new Set(completedAppointments.map(a => a.service_id).filter(Boolean))];
        const services = serviceIds.length > 0 ? await base44.entities.Service.filter({ id: { $in: serviceIds } }) : [];

        const details = { payments: filteredPayments, lookup: { clients, services } };

        return new Response(JSON.stringify({ summary, details }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("[FATAL] Erro em getFinancialSummary:", error);
        return new Response(JSON.stringify({ error: 'Erro Interno do Servidor', details: error.message }), { status: 500, headers: corsHeaders });
    }
});