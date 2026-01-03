import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";

/**
 * @description Exclui um serviço de forma segura, validando se não há agendamentos associados.
 * @param {string} serviceId - O ID do serviço a ser excluído.
 * @returns {Response} - Resposta de sucesso ou erro com status code apropriado.
 */
Deno.serve(async (req) => {
    console.log("[SERVICE_FN_V1] deleteService function invoked.");
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
        
        // Etapa 1: Autenticação
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: corsHeaders });
        }

        // Etapa 2: Extração do Parâmetro
        const { serviceId } = await req.json();
        if (!serviceId) {
            return new Response(JSON.stringify({ error: 'O ID do serviço é obrigatório.' }), { status: 400, headers: corsHeaders });
        }

        // Etapa 3: Validação da Regra de Negócio
        const relatedAppointments = await base44.asServiceRole.entities.Appointment.filter(
            { service_id: serviceId }, 
            '-created_date', 
            1 // Busca apenas 1 para verificar a existência, otimizando a query
        );

        if (relatedAppointments && relatedAppointments.length > 0) {
            // Retorna erro 409 Conflict se houver dependências
            return new Response(JSON.stringify({ error: "Este serviço não pode ser excluído pois está associado a agendamentos existentes." }), { status: 409, headers: corsHeaders });
        }

        // Etapa 4: Execução da Exclusão
        await base44.asServiceRole.entities.Service.delete(serviceId);

        // Etapa 5: Resposta de Sucesso
        return new Response(JSON.stringify({ success: true, message: "Serviço excluído com sucesso." }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("[FATAL] Erro em deleteService:", error);
        return new Response(JSON.stringify({ error: 'Erro Interno do Servidor', details: error.message }), { status: 500, headers: corsHeaders });
    }
});