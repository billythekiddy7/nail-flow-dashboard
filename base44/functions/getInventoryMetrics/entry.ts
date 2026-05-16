import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";
import { format } from "npm:date-fns@3.6.0/format";

/**
 * @description (v2) Calcula e retorna métricas agregadas do inventário.
 *              Utiliza a arquitetura unificada do SDK v0.7.1 e asServiceRole.
 * @returns {Response} - Um objeto JSON com as métricas ou uma resposta de erro.
 */
Deno.serve(async (req) => {
    // Canary Log: v9 - Final Architecture
    console.log("[INVENTORY_FN_V9] getInventoryMetrics function invoked.");
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        // Autenticação para proteger o endpoint
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: corsHeaders });
        }

        // Busca de Dados Sequencial usando privilégios de serviço
        const products = await base44.asServiceRole.entities.Product.list('-created_date', 1000);
        const completedAppointments = await base44.asServiceRole.entities.Appointment.filter({ status: 'concluido' }, '-created_date', 1000);

        // Cálculo das Métricas
        const totalUnits = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
        const totalCost = products.reduce((sum, product) => sum + ((Number(product.stock) || 0) * (Number(product.cost_unit) || 0)), 0);
        const totalValueReceived = completedAppointments.reduce((sum, apt) => sum + (Number(apt.final_price) || 0), 0);
        const totalProfit = completedAppointments.reduce((sum, apt) => sum + (Number(apt.profit) || 0), 0);
        
        const metrics = {
            totalUnits,
            totalCost,
            totalValueReceived,
            totalProfit
        };

        return new Response(JSON.stringify(metrics), {
            status: 200,
            headers: corsHeaders,
        });

    } catch (error) {
        console.error("[FATAL] Erro em getInventoryMetrics:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
    }
});