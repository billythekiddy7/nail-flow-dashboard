import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    // Canary Log: v11 - Security Hardening
    console.log("[AUTH_FN_V11] authenticateUser function invoked with secure native auth.");
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
        const { email, password } = await req.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Email e senha são obrigatórios' }), { status: 400, headers: corsHeaders });
        }

        // ANiquilação da chamada ao método inexistente.
        // IMPLEMENTAÇÃO DA CHAMADA CORRETA, que foi perdida em refatoração anterior.
        const { data, error } = await base44.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // Se a autenticação falhar, retorna um erro genérico e seguro.
            console.error("Authentication Error:", error.message);
            return new Response(JSON.stringify({ success: false, message: 'Email ou senha inválidos.' }), { status: 401, headers: corsHeaders });
        }
        
        // Autenticação bem-sucedida. Extrai o usuário e a sessão.
        const { user, session } = data;

        // LÓGICA DE NEGÓCIO PÓS-AUTENTICAÇÃO: Verifica se a conta do usuário está ativa.
        if (user.account_status !== 'active') {
            const statusMessage = user.account_status === 'pending_payment'
                ? 'Sua conta ainda aguarda a confirmação de pagamento.'
                : 'Sua conta não está ativa. Entre em contato com o suporte.';
            // Retorna um erro específico de negócio, mesmo que a senha esteja correta.
            return new Response(JSON.stringify({ success: false, message: statusMessage }), { status: 403, headers: corsHeaders });
        }

        // SUCESSO TOTAL: Retorna os dados do usuário e o token de acesso seguro.
        return new Response(JSON.stringify({
            success: true,
            message: 'Login bem-sucedido!',
            token: session.access_token,
            user: user,
        }), { status: 200, headers: corsHeaders });

    } catch (e) {
        console.error("[FATAL] Erro em authenticateUser:", e);
        // CORREÇÃO: Retornar a mensagem de erro real da exceção para o frontend.
        const errorMessage = (e instanceof Error) ? e.message : 'Ocorreu um erro desconhecido durante o login.';
        return new Response(JSON.stringify({ success: false, message: errorMessage }), { status: 500, headers: corsHeaders });
    }
});