import type { D1Database } from '@cloudflare/workers-types';
export interface Env { DB: D1Database; }

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    const body = await request.json() as Record<string, string>;
    
    // 1. Cek Kredensial
    const user = await env.DB.prepare(
      "SELECT id, name FROM users WHERE email = ? AND password = ?"
    ).bind(body.email, body.password).first<{ id: number, name: string }>();

    if (!user) {
      return Response.json({ success: false, message: "Email atau Password salah!" }, { status: 401 });
    }

    // 2. Buat Token
    const token = crypto.randomUUID();

    // 3. Simpan ke tabel sessions
    await env.DB.prepare(
      "INSERT INTO sessions (token, user_id) VALUES (?, ?)"
    ).bind(token, user.id).run();

    // 4. Kirim token ke Frontend
    return Response.json({ success: true, token: token, name: user.name });

  } catch (e) {
    const error = e as Error;
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}