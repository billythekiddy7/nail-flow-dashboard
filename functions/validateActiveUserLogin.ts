import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Simula a validação de senha para fins de demonstração
const VALID_CREDENTIALS = [
  { email: 'admin@nailflow.com', password: 'nailflow2024' },
  { email: 'demo@nailflow.com', password: 'demo123' },
  { email: 'hugolemes@gmail.com', password: 'moderador' },
  { email: 'hugolemes@gmail.com', password: 'hugo123' },
  { email: 'jhbprivado@gmail.com', password: '@Moderador1' },
  { email: 'test@nailflow.com', password: 'test123' }
];

Deno.serve(async (req) => {
    // Headers CORS
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
        const lowerCaseEmail = email?.toLowerCase();

        if (!lowerCaseEmail || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Email e senha são obrigatórios' }), { status: 400, headers: corsHeaders });
        }

        const isValidCredential = VALID_CREDENTIALS.find(
            cred => cred.email.toLowerCase() === lowerCaseEmail && cred.password === password
        );

        if (!isValidCredential) {
            return new Response(JSON.stringify({ success: false, message: 'Email ou senha inválidos.' }), { status: 401, headers: corsHeaders });
        }

        // CORREÇÃO ARQUITETURAL: Usar asServiceRole para obter permissão de buscar usuários.
        let { data: users, error } = await base44.asServiceRole.entities.User.filter({ email: lowerCaseEmail });

        if (error) {
            console.error(`[SDK ERROR] ${error.message}`);
            // Retorna o erro específico se for "schema not found" para depuração
            if (error.message.includes('schema')) {
                return new Response(JSON.stringify({ success: false, message: `Entity schema User not found in app` }), { status: 500, headers: corsHeaders });
            }
            throw new Error(`[SDK ERROR] ${error.message}`);
        }

        if (!users || users.length === 0) {
            const { data: newUser, error: createError } = await base44.asServiceRole.entities.User.create({
                full_name: 'Usuário de Teste',
                email: lowerCaseEmail,
                account_status: 'active',
                business_name: 'Nail Flow Teste',
                role: 'owner',
                theme: 'dark'
            });

            if (createError) {
                console.error(`[SDK CREATE ERROR] ${createError.message}`);
                throw new Error(`[SDK CREATE ERROR] ${createError.message}`);
            }
            users = [newUser];
        }

        const user = users[0];

        if (user.account_status !== 'active') {
            const statusMessage = user.account_status === 'pending_payment'
                ? 'Sua conta ainda aguarda a confirmação de pagamento.'
                : 'Sua conta não está ativa. Entre em contato com o suporte.';
            return new Response(JSON.stringify({ success: false, message: statusMessage }), { status: 403, headers: corsHeaders });
        }
        
        const token = btoa(`${user.email}:${Date.now()}`);
        return new Response(JSON.stringify({
            success: true,
            message: 'Login bem-sucedido!',
            token,
            user: {
                email: user.email,
                full_name: user.full_name,
                business_name: user.business_name,
                role: user.role
            }
        }), { status: 200, headers: corsHeaders });

    } catch (e) {
        console.error("[FATAL] Erro em validateActiveUserLogin:", e);
        return new Response(JSON.stringify({ success: false, message: e.message || 'Erro interno do servidor.' }), { status: 500, headers: corsHeaders });
    }
});