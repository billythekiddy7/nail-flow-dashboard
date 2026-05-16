/**
 * @deprecated ARQUIVO DEPRECADO - NÃO UTILIZAR
 * 
 * Este arquivo foi desativado na migração para autenticação real.
 * A autenticação agora é feita via:
 * - Frontend: base44.auth.signInWithPassword()
 * - Criação de usuários: base44.users.inviteUser() no webhook
 * 
 * Data de deprecação: 2026-01-03
 * Motivo: Senhas hardcoded removidas por segurança
 */

// DEPRECATED: REPLACED BY NATIVE BASE44 AUTH
// Este endpoint não deve mais ser chamado.

Deno.serve(async (req) => {
  return new Response(JSON.stringify({
    success: false,
    message: 'Este serviço foi descontinuado. Use a autenticação nativa da Base44.',
    deprecated: true
  }), { 
    status: 410, // HTTP 410 Gone
    headers: { 'Content-Type': 'application/json' }
  });
});