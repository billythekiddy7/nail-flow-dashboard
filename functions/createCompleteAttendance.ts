
import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";

Deno.serve(async (req) => {
    // Canary Log: v10 - SDK Unification
    console.log("[ATTENDANCE_FN_V10] createCompleteAttendance function invoked.");
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    let createdAppointmentId = null;
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: corsHeaders });
        }

        const { appointmentData, paymentData, productsUsed } = await req.json();

        if (!appointmentData || !paymentData) {
             return new Response(JSON.stringify({ error: 'appointmentData e paymentData são obrigatórios' }), { status: 400, headers: corsHeaders });
        }

        // PADRONIZAÇÃO: Usar asServiceRole para consistência em operações de escrita de backend
        const createdAppointment = await base44.asServiceRole.entities.Appointment.create(appointmentData);
        createdAppointmentId = createdAppointment.id;

        await base44.asServiceRole.entities.Payment.create({ ...paymentData, appointment_id: createdAppointmentId });

        if (productsUsed && productsUsed.length > 0) {
            for (const usedProduct of productsUsed) {
                const product = await base44.asServiceRole.entities.Product.get(usedProduct.product_id);
                if (product) {
                    const newStock = Math.max(0, (product.stock || 0) - (usedProduct.qty || 0));
                    await base44.asServiceRole.entities.Product.update(product.id, { stock: newStock });
                }
            }
        }
        
        return new Response(JSON.stringify({ success: true, appointmentId: createdAppointmentId }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("[FATAL] Erro em createCompleteAttendance:", error);
        if (createdAppointmentId) {
            console.error(`[CRITICAL INCONSISTENCY] Agendamento ${createdAppointmentId} criado, mas operações subsequentes falharam. Revisão manual necessária.`);
        }
        return new Response(JSON.stringify({ error: 'Erro Interno do Servidor', details: error.message }), { status: 500, headers: corsHeaders });
    }
});
