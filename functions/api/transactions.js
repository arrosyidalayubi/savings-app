// functions/api/transactions.js

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const data = await request.json();
    
    // Insert ke database D1
    const stmt = env.DB.prepare(`
      INSERT INTO transactions (type, amount, category, description, transaction_date)
      VALUES (?, ?, ?, ?, ?)
    `).bind(data.type, data.amount, data.category, data.description || '', data.transaction_date);
    
    await stmt.run();
    return Response.json({ success: true, message: "Transaksi berhasil disimpan" });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const filter = url.searchParams.get('filter') || 'bulanan'; // harian | bulanan | tahunan

  // Logika Filter Waktu SQLite
  let dateCondition = "";
  if (filter === 'harian') {
    // Transaksi 7 hari terakhir
    dateCondition = "date(transaction_date) >= date('now', '+7 hours', '-7 days')";
  } else if (filter === 'bulanan') {
    // Transaksi bulan ini
    dateCondition = "strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now', '+7 hours')";
  } else if (filter === 'tahunan') {
    // Transaksi tahun ini
    dateCondition = "strftime('%Y', transaction_date) = strftime('%Y', 'now', '+7 hours')";
  }

  const sql = `
    SELECT * FROM transactions 
    WHERE ${dateCondition} 
    ORDER BY transaction_date DESC, id DESC
  `;

  try {
    const { results } = await env.DB.prepare(sql).all();
    return Response.json({ success: true, data: results });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}