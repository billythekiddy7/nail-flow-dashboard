
import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Credenciais válidas expandidas
const VALID_CREDENTIALS = [
  {
    email: 'admin@nailflow.com',
    password: 'nailflow2024',
    name: 'Administrador',
    role: 'admin',
    business_name: 'Nail Flow Admin'
  },
  {
    email: 'demo@nailflow.com', 
    password: 'demo123',
    name: 'Demo User',
    role: 'user',
    business_name: 'Studio Demo'
  },
  {
    email: 'hugolemes@gmail.com',
    password: 'moderador',
    name: 'Hugo Lemes',
    role: 'admin',
    business_name: 'Hugo Nail Studio'
  },
  {
    email: 'hugolemes@gmail.com',
    password: 'hugo123',
    name: 'Hugo Lemes',
    role: 'admin', 
    business_name: 'Hugo Nail Studio'
  },
  {
    email: 'jhbprivado@gmail.com',
    password: 'moderador', 
    name: 'JHB Privado',
    role: 'user',
    business_name: 'JHB Nail Studio'
  },
  {
    email: 'test@nailflow.com',
    password: 'test123',
    name: 'Usuário Teste',
    role: 'user',
    business_name: 'Teste Studio'
  }
];

Deno.serve(async (req) => {
  // Headers CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Responder a OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Método não permitido' 
    }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('Tentativa de login:', { email, password: '***' });

    // Validar campos obrigatórios
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email e senha são obrigatórios'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Buscar credencial válida (case insensitive para email)
    const user = VALID_CREDENTIALS.find(
      cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
    );

    if (!user) {
      console.log('Credenciais inválidas para:', email);
      return new Response(JSON.stringify({
        success: false,
        message: 'Email ou senha incorretos'
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Gerar token simples (em produção, usar JWT)
    const token = btoa(`${user.email}:${Date.now()}:${Math.random()}`);

    console.log('Login bem-sucedido para:', user.email);

    // Resposta de sucesso
    return new Response(JSON.stringify({
      success: true,
      message: 'Login realizado com sucesso',
      token: token,
      user: {
        id: `user_${Date.now()}`,
        email: user.email,
        name: user.name,
        full_name: user.name,
        role: user.role,
        business_name: user.business_name
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `auth_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Erro na validação de auth:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
