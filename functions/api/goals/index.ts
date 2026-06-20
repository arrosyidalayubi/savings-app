import type { D1Database } from '@cloudflare/workers-types';
export interface Env {
  DB: D1Database;
}

interface Context {
  request: Request;
  env: Env;
}

// Mendefinisikan bentuk data yang masuk dari Frontend
interface GoalPayload {
  name: string;
  target_amount: number;
  saved_amount?: number;
  deadline: string;
  icon?: string;
  status?: string;
}

export async function onRequestGet(context: Context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM goals ORDER BY created_at DESC").all();
    return Response.json({ success: true, data: results });
  } catch (e) {
    const error = e as Error;
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context: Context) {
  const { request, env } = context;
  try {
    // Memaksa (casting) JSON yang masuk menjadi GoalPayload, bukan any
    const body = await request.json() as GoalPayload;
    
    const stmt = env.DB.prepare(
      "INSERT INTO goals (name, target_amount, saved_amount, deadline, icon, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      body.name, 
      body.target_amount, 
      body.saved_amount || 0, 
      body.deadline, 
      body.icon || 'Target',  
      body.status || 'Active' 
    );
    
    await stmt.run();
    return Response.json({ success: true, message: "Goal berhasil ditambahkan!" });
  } catch (e) {
    const error = e as Error;
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}