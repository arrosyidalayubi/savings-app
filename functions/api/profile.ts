import type { D1Database } from '@cloudflare/workers-types';
export interface Env { DB: D1Database; }

async function getUserIdFromToken(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error("Header Authorization kosong/salah format");
  
  const token = authHeader.split(' ')[1];
  if (token === "undefined" || token === "null") throw new Error("Token dari frontend undefined");
  
  const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE token = ?").bind(token).first<{ user_id: number }>();
  if (!session) throw new Error("Token tidak ditemukan di database sessions");
  
  return session.user_id;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const userId = await getUserIdFromToken(context.request, context.env);
    
    const user = await context.env.DB.prepare("SELECT name, email, avatar FROM users WHERE id = ?").bind(userId).first<{ name: string; email: string; avatar: string | null }>();
    return Response.json({ success: true, data: user });
  } catch (e) {
    const error = e as Error;
    // Sekarang error akan memberi tahu persis masalahnya apa!
    return Response.json({ success: false, error: `Sesi tidak valid: ${error.message}` }, { status: 401 });
  }
}

export async function onRequestPut(context: { request: Request; env: Env }) {
  try {
    const userId = await getUserIdFromToken(context.request, context.env);
    
    const body = await context.request.json() as { name: string; avatar: string | null };
    await context.env.DB.prepare("UPDATE users SET name = ?, avatar = ? WHERE id = ?").bind(body.name, body.avatar, userId).run();
    
    return Response.json({ success: true, message: "Profil diperbarui!" });
  } catch (e) {
    const error = e as Error;
    return Response.json({ success: false, error: `Sesi tidak valid: ${error.message}` }, { status: 401 });
  }
}