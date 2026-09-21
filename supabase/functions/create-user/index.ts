import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = request.headers.get('Authorization')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Configuração da função incompleta.' }, 500)
  }

  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Autenticação obrigatória.' }, 401)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser()

  if (authError || !user) {
    return jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return jsonResponse({ error: 'Não foi possível verificar as permissões do usuário.' }, 500)
  }

  if (!profile || profile.role !== 'admin') {
    return jsonResponse({ error: 'Apenas administradores podem criar usuários.' }, 403)
  }

  let payload: { email?: unknown; password?: unknown; name?: unknown; role?: unknown }
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400)
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : ''
  const password = typeof payload.password === 'string' ? payload.password : ''
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const role = typeof payload.role === 'string' ? payload.role.trim() : ''

  if (!email || !password || !name || !role) {
    return jsonResponse({ error: 'email, password, name e role são obrigatórios.' }, 400)
  }

  const { data, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { name, role },
  })

  if (createError || !data.user) {
    return jsonResponse({ error: createError?.message || 'Não foi possível criar o usuário.' }, createError?.status || 400)
  }

  return jsonResponse({
    success: true,
    user: { id: data.user.id, email: data.user.email },
  })
})
