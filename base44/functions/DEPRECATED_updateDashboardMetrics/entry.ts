import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";
import { startOfMonth } from "npm:date-fns@3.6.0/startOfMonth";
import { endOfMonth } from "npm:date-fns@3.6.0/endOfMonth";
import { startOfDay } from "npm:date-fns@3.6.0/startOfDay";
import { endOfDay } from "npm:date-fns@3.6.0/endOfDay";

/**
 * ⚠️ DEPRECATED - OPERAÇÃO CRONOS ⚠️
 * Esta função foi desativada e substituída pelo sistema de compute-on-write.
 * Não deve mais ser chamada pelo frontend.
 * Mantida apenas para referência histórica.
 * 
 * Nova arquitetura: Triggers incrementais (onAppointmentCreated, onAppointmentCompleted, onClientCreated)
 * atualizam o cache DashboardMetric em tempo real.
 */

Deno.serve((req) => {
    console.log("[DEPRECATED] updateDashboardMetrics foi chamada - esta função está obsoleta!");
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
        success: false, 
        message: "Esta função foi desativada. O Dashboard agora usa métricas pré-calculadas.",
        migration: "Operação Cronos - Compute-on-Write Architecture"
    }), { 
        status: 410, // Gone
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
});