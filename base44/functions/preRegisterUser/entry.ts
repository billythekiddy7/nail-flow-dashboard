/**
 * @deprecated ARQUIVO DEPRECADO - NÃO UTILIZAR
 * 
 * Este arquivo foi desativado na migração para autenticação real.
 * A criação de usuários agora é feita automaticamente pelo webhook
 * da Veksell após confirmação de pagamento, usando:
 * - base44.users.inviteUser(email, 'user')
 * - base44.asServiceRole.entities.User.create()
 * 
 * Data de deprecação: 2026-01-03
 * Motivo: Pré-registro sem senha real não funcionava
 */

// DEPRECATED: USER CREATION HANDLED BY WEBHOOK (processVeksellWebhook.js)

Deno.serve(async (req) => {
  return new Response(JSON.stringify({
    success: false,
    message: 'Este serviço foi descontinuado. Usuários são criados automaticamente após pagamento.',
    deprecated: true,
    redirectTo: 'Use o checkout da Veksell para criar sua conta.'
  }), { 
    status: 410, // HTTP 410 Gone
    headers: { 'Content-Type': 'application/json' }
  });
});