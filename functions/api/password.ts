import type { D1Database } from '@cloudflare/workers-types';
export interface Env { DB: D1Database; }

async function getUserIdFromToken(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  
  const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE token = ?").bind(token).first<{ user_id: number }>();
  return session ? session.user_id : null;
}

export async function onRequestPut(context: { request: Request; env: Env }) {
  const userId = await getUserIdFromToken(context.request, context.env);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await context.request.json() as Record<string, string>;
  
  const user = await context.env.DB.prepare("SELECT password FROM users WHERE id = ?").bind(userId).first<{ password: string }>();
  
  if (!user || user.password !== body.old_password) {
    return Response.json({ success: false, message: "Password lama salah!" }, { status: 400 });
  }

  await context.env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(body.new_password, userId).run();
  return Response.json({ success: true, message: "Password berhasil diubah!" });
}