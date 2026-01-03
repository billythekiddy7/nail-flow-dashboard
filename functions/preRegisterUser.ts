import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, message: 'Método não permitido' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Nome, e-mail e senha são obrigatórios' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const newUser = await base44.asServiceRole.entities.User.create({
            full_name: name,
            email: email,
            account_status: 'pending_payment',
            business_name: name,
            theme: 'dark'
        });

        return new Response(JSON.stringify({ success: true, userId: newUser.id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        if (error.message && error.message.includes('unique constraint')) {
            return new Response(JSON.stringify({ success: false, message: 'Este e-mail já está cadastrado.' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        console.error("[FATAL] Erro em preRegisterUser:", error);
        return new Response(JSON.stringify({ success: false, message: 'Erro interno ao criar usuário.', error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});