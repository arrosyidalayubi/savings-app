import type { D1Database } from '@cloudflare/workers-types';
export interface Env {
  DB: D1Database;
}

interface ContextWithParams {
  request: Request;
  env: Env;
  params: { id: string };
}

interface GoalPayload {
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string;
  icon: string;
  status: string;
}

export async function onRequestPut(context: ContextWithParams) {
  const { request, env, params } = context;
  const id = params.id; 
  
  try {
    const body = await request.json() as GoalPayload;
    
    const stmt = env.DB.prepare(
      "UPDATE goals SET name = ?, target_amount = ?, saved_amount = ?, deadline = ?, icon = ?, status = ? WHERE id = ?"
    ).bind(
      body.name, 
      body.target_amount, 
      body.saved_amount, 
      body.deadline, 
      body.icon, 
      body.status, 
      id
    );
    
    await stmt.run();
    return Response.json({ success: true, message: "Goal berhasil diperbarui!" });
  } catch (e) {
    const error = e as Error;
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: Omit<ContextWithParams, 'request'>) {
  const { env, params } = context;
  const id = params.id;
  
  try {
    await env.DB.prepare("DELETE FROM goals WHERE id = ?").bind(id).run();
    return Response.json({ success: true, message: "Goal berhasil dihapus!" });
  } catch (e) {
    const error = e as Error;
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}