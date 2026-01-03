
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { timingSafeEqual } from "https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const veksellSecret = Deno.env.get('VEKSSELL_WEBHOOK_SECRET');
  if (!veksellSecret) {
    console.error("[FATAL] VEKSSELL_WEBHOOK_SECRET não configurado.");
    return new Response('Webhook secret not configured.', { status: 500 });
  }

  try {
    const body = await req.json();
    const receivedToken = body?.token;

    if (!receivedToken) {
      return new Response('Token missing from request body.', { status: 400 });
    }

    const encoder = new TextEncoder();
    const expectedToken = encoder.encode(veksellSecret);
    const actualToken = encoder.encode(receivedToken);

    if (!timingSafeEqual(expectedToken, actualToken)) {
      return new Response('Unauthorized: Invalid token.', { status: 401 });
    }

    const email = body?.client?.email?.trim().toLowerCase();
    const cpf = body?.client?.cpf?.replace(/\D/g, "");

    if (!email && !cpf) {
      return new Response('Customer email or CPF not found in payload.', { status: 400 });
    }
    
    const filter = email ? { email } : { cpf };
    const { data: users, error } = await base44.asServiceRole.entities.User.filter(filter);
    
    if (error) {
        throw new Error(`[SDK ERROR] ${error.message}`);
    }
    
    if (!users || users.length === 0) {
      return new Response('User not found, but webhook acknowledged.', { status: 200 });
    }

    const userToUpdate = users[0];
    const transactionStatus = body?.transaction?.status;
    const eventName = body?.event;

    let newStatus = null;
    // LÓGICA DE ATIVAÇÃO CORRIGIDA: Agora reconhece o status 'paid' enviado pela Veksell.
    if (transactionStatus === 'paid' || eventName === 'TRANSACTION_PAID' || transactionStatus === 'COMPLETED') {
      newStatus = 'active';
    } else if (eventName === 'subscription.canceled' || transactionStatus === 'CANCELED') {
      newStatus = 'inactive';
    }

    if (newStatus && userToUpdate.account_status !== newStatus) {
      await base44.asServiceRole.entities.User.update(userToUpdate.id, { account_status: newStatus });
      console.log(`[SUCCESS] Status do usuário ${userToUpdate.email} atualizado para '${newStatus}'.`);
    }

    return new Response('Webhook processed successfully.', { status: 200 });

  } catch (e) {
    console.error("[FATAL] Erro ao processar webhook:", e);
    return new Response('Error processing request body.', { status: 500 });
  }
});
