import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { startOfMonth } from "npm:date-fns@3.6.0/startOfMonth";
import { endOfMonth } from "npm:date-fns@3.6.0/endOfMonth";

/**
 * OPERAÇÃO CRONOS - Trigger: Criação de Cliente
 * @description Atualiza contador de novos clientes quando um cliente é cadastrado
 * @version 1.0.0
 * @architecture Compute-on-Write Pattern
 */

Deno.serve(async (req) => {
    console.log("[CRONOS_TRIGGER_V1] onClientCreated invocado.");
    
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

        const { clientId } = await req.json();
        
        if (!clientId) {
            return new Response(JSON.stringify({ success: false, message: 'clientId é obrigatório' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Buscar o cliente recém-criado
        const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
        
        if (!clients || clients.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Cliente não encontrado' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        const client = clients[0];
        const clientCreatedDate = new Date(client.created_date);
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);

        // Verificar se o cliente foi criado no mês atual
        const isCurrentMonth = clientCreatedDate >= currentMonthStart && clientCreatedDate <= currentMonthEnd;

        if (!isCurrentMonth) {
            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Cliente não é do mês atual, métricas não atualizadas' 
            }), {
                status: 200,
                headers: corsHeaders
            });
        }

        // Buscar métricas atuais
        let metricsData = await base44.asServiceRole.entities.DashboardMetric.list('', 1);
        let metrics = metricsData[0];

        if (!metrics) {
            // Criar registro inicial
            metrics = await base44.asServiceRole.entities.DashboardMetric.create({
                revenueTotal: 0,
                netProfit: 0,
                newClientsCount: 1,
                todayAppointmentsCount: 0,
                completedAppointmentsCount: 0
            });
        } else {
            // Incrementar contador de novos clientes
            await base44.asServiceRole.entities.DashboardMetric.update(metrics.id, {
                newClientsCount: (metrics.newClientsCount || 0) + 1
            });
        }

        console.log(`[CRONOS_TRIGGER] Contador de novos clientes atualizado: ${clientId}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Contador de novos clientes atualizado com sucesso' 
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