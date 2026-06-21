import type { D1Database } from '@cloudflare/workers-types';
export interface Env { DB: D1Database; }

async function getUserIdFromToken(request: Request, env: Env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    
    const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE token = ?").bind(token).first<{ user_id: number }>();
    return session ? session.user_id : null;
  } catch {
    return null;
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const userId = await getUserIdFromToken(context.request, context.env);
    if (!userId) return Response.json({ success: false, error: "Sesi login tidak valid" }, { status: 401 });

    const user = await context.env.DB.prepare("SELECT name, email, avatar FROM users WHERE id = ?").bind(userId).first<{ name: string; email: string; avatar: string | null }>();
    return Response.json({ success: true, data: user });
  } catch (e) {
    const error = e as Error;
    // Mengembalikan JSON error, BUKAN halaman HTML
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestPut(context: { request: Request; env: Env }) {
  try {
    const userId = await getUserIdFromToken(context.request, context.env);
    if (!userId) return Response.json({ success: false, error: "Sesi login tidak valid" }, { status: 401 });

    const body = await context.request.json() as { name: string; avatar: string | null };
    
    await context.env.DB.prepare("UPDATE users SET name = ?, avatar = ? WHERE id = ?").bind(body.name, body.avatar, userId).run();
    
    return Response.json({ success: true, message: "Profil diperbarui!" });
  } catch (e) {
    const error = e as Error;
    // Mengembalikan JSON error, BUKAN halaman HTML
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}