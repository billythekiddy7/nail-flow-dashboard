/**
 * @deprecated ARQUIVO DEPRECADO - NÃO UTILIZAR
 * 
 * Este arquivo foi desativado na migração para autenticação real.
 * A validação de usuários ativos agora é feita diretamente no frontend
 * após autenticação via base44.auth.me().
 * 
 * Data de deprecação: 2026-01-03
 * Motivo: Senhas hardcoded removidas por segurança
 */

// DEPRECATED: REPLACED BY NATIVE BASE44 AUTH

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