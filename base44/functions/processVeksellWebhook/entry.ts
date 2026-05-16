/**
 * WEBHOOK VEKSELL - Motor de Crescimento
 * @description Processa pagamentos e cria usuários reais via inviteUser
 * @version 2.0.0 - Arquitetura Real de Autenticação
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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
    console.log("[WEBHOOK_V2] Payload recebido:", JSON.stringify(body, null, 2));
    
    const receivedToken = body?.token;

    if (!receivedToken) {
      return new Response('Token missing from request body.', { status: 400 });
    }

    // Validação de segurança contra timing attacks
    const encoder = new TextEncoder();
    const expectedToken = encoder.encode(veksellSecret);
    const actualToken = encoder.encode(receivedToken);

    if (!timingSafeEqual(expectedToken, actualToken)) {
      console.error("[WEBHOOK_V2] Token inválido recebido.");
      return new Response('Unauthorized: Invalid token.', { status: 401 });
    }

    // Extração de dados do cliente
    const email = body?.client?.email?.trim().toLowerCase();
    const clientName = body?.client?.name || body?.client?.full_name || 'Novo Usuário';
    const cpf = body?.client?.cpf?.replace(/\D/g, "");

    if (!email) {
      console.error("[WEBHOOK_V2] Email não encontrado no payload.");
      return new Response('Customer email not found in payload.', { status: 400 });
    }

    // Detecção de status da transação
    const transactionStatus = body?.transaction?.status?.toLowerCase();
    const eventName = body?.event;

    let shouldActivate = false;
    let shouldDeactivate = false;

    // LÓGICA DE ATIVAÇÃO: Reconhece múltiplos formatos da Veksell
    if (transactionStatus === 'paid' || 
        transactionStatus === 'approved' || 
        transactionStatus === 'completed' ||
        eventName === 'TRANSACTION_PAID' || 
        eventName === 'payment.approved') {
      shouldActivate = true;
    } else if (eventName === 'subscription.canceled' || 
               transactionStatus === 'canceled' || 
               transactionStatus === 'refunded') {
      shouldDeactivate = true;
    }

    console.log(`[WEBHOOK_V2] Email: ${email}, Status: ${transactionStatus}, Event: ${eventName}, Ativar: ${shouldActivate}`);

    // Buscar usuário existente na tabela de DADOS
    const { data: existingUsers, error: searchError } = await base44.asServiceRole.entities.User.filter({ email });
    
    if (searchError) {
      console.error(`[WEBHOOK_V2] Erro ao buscar usuário: ${searchError.message}`);
      throw new Error(`[SDK ERROR] ${searchError.message}`);
    }

    const userExists = existingUsers && existingUsers.length > 0;

    // ========================================
    // CENÁRIO A: USUÁRIO JÁ EXISTE
    // ========================================
    if (userExists) {
      const existingUser = existingUsers[0];
      console.log(`[WEBHOOK_V2] Usuário existente encontrado: ${existingUser.id}`);

      if (shouldActivate && existingUser.account_status !== 'active') {
        await base44.asServiceRole.entities.User.update(existingUser.id, { account_status: 'active' });
        console.log(`[SUCCESS] Status do usuário ${email} atualizado para 'active'.`);
      } else if (shouldDeactivate && existingUser.account_status !== 'inactive') {
        await base44.asServiceRole.entities.User.update(existingUser.id, { account_status: 'inactive' });
        console.log(`[SUCCESS] Status do usuário ${email} atualizado para 'inactive'.`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'updated',
        email: email 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // ========================================
    // CENÁRIO B: NOVO CLIENTE - CRIAR USUÁRIO REAL
    // ========================================
    if (shouldActivate) {
      console.log(`[WEBHOOK_V2] Novo cliente detectado. Iniciando criação: ${email}`);

      // PASSO 1: Convidar usuário via sistema de autenticação Base44
      try {
        await base44.users.inviteUser(email, 'user');
        console.log(`[WEBHOOK_V2] Convite enviado para: ${email}`);
      } catch (inviteError) {
        // Pode falhar se usuário já foi convidado anteriormente
        console.warn(`[WEBHOOK_V2] Aviso no inviteUser: ${inviteError.message}`);
        // Continua mesmo assim para criar/atualizar registro de dados
      }

      // PASSO 2: Criar registro na tabela de DADOS (perfil do usuário)
      try {
        await base44.asServiceRole.entities.User.create({
          email: email,
          full_name: clientName,
          business_name: clientName,
          account_status: 'active',
          bio: '',
          phone: body?.client?.phone || '',
          instagram: '',
          profile_image: ''
        });
        console.log(`[WEBHOOK_V2] Registro de dados criado para: ${email}`);
      } catch (createError) {
        // Pode falhar se registro já existe (race condition)
        console.warn(`[WEBHOOK_V2] Aviso ao criar registro: ${createError.message}`);
        
        // Tentar atualizar se já existe
        const { data: retryUsers } = await base44.asServiceRole.entities.User.filter({ email });
        if (retryUsers && retryUsers.length > 0) {
          await base44.asServiceRole.entities.User.update(retryUsers[0].id, { 
            account_status: 'active',
            full_name: clientName 
          });
          console.log(`[WEBHOOK_V2] Registro existente atualizado para: ${email}`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'created',
        email: email,
        message: 'Usuário criado e convite enviado por email.'
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Evento não requer ação
    console.log(`[WEBHOOK_V2] Evento ignorado (não requer ação): ${eventName || transactionStatus}`);
    return new Response(JSON.stringify({ 
      success: true, 
      action: 'ignored',
      reason: 'Event does not require user creation or status change'
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (e) {
    console.error("[FATAL] Erro ao processar webhook:", e);
    return new Response(JSON.stringify({ 
      success: false, 
      error: e.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});