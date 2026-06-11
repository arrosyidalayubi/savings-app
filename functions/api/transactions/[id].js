// functions/api/transactions/[id].js

export async function onRequestPut(context) {
  const { env, request, params } = context;
  const transactionId = params.id;
  
  try {
    const data = await request.json();
    const stmt = env.DB.prepare(`
      UPDATE transactions 
      SET type = ?, amount = ?, category = ?, description = ?, transaction_date = ?
      WHERE id = ?
    `).bind(data.type, data.amount, data.category, data.description || '', data.transaction_date, transactionId);
    
    await stmt.run();
    return Response.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const transactionId = params.id;

  try {
    await env.DB.prepare(`DELETE FROM transactions WHERE id = ?`).bind(transactionId).run();
    return Response.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}