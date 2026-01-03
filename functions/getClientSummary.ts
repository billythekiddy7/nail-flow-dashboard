
import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";

Deno.serve(async (req) => {
    // Canary Log: v10 - SDK Unification
    console.log("[CLIENT_SUMMARY_FN_V10] getClientSummary function invoked.");
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

        const { clientId } = await req.json();
        if (!clientId) {
            return new Response(JSON.stringify({ error: 'clientId é obrigatório' }), { status: 400, headers: corsHeaders });
        }
        
        // PADRONIZAÇÃO: Usar asServiceRole para consistência em funções de agregação de dados
        const clientAppointments = await base44.asServiceRole.entities.Appointment.filter({ client_id: clientId }, '-start_time', 500);
        const clientPayments = await base44.asServiceRole.entities.Payment.filter({ client_id: clientId });
        
        const completedAppointments = clientAppointments.filter(apt => apt.status === 'concluido');
        const totalPaidValue = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalBilled = completedAppointments.reduce((sum, apt) => sum + (Number(apt.final_price) || 0), 0);
        const averageTicket = completedAppointments.length > 0 ? totalBilled / completedAppointments.length : 0;
        const pendingBalance = totalBilled - totalPaidValue;
        
        const summary = {
            totalAppointments: clientAppointments.length,
            totalPaidValue: totalPaidValue,
            averageTicket: averageTicket,
            pendingBalance: pendingBalance > 0 ? pendingBalance : 0,
        };
        
        return new Response(JSON.stringify({ summary, appointments: clientAppointments }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("[FATAL] Erro em getClientSummary:", error);
        return new Response(JSON.stringify({ error: 'Erro Interno do Servidor', details: error.message }), { status: 500, headers: corsHeaders });
    }
});
