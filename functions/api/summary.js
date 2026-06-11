export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get('month'); // Contoh: '06'
  const year = url.searchParams.get('year');   // Contoh: '2026'

  // Query SQL menggunakan D1
  const sql = `
    SELECT 
      transaction_date as date,
      SUM(CASE WHEN type = 'pemasukan' THEN amount ELSE 0 END) as pemasukan,
      SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END) as pengeluaran
    FROM transactions
    WHERE strftime('%Y', transaction_date) = ? AND strftime('%m', transaction_date) = ?
    GROUP BY transaction_date
    ORDER BY transaction_date ASC
  `;

  try {
    const { results } = await env.DB.prepare(sql).bind(year, month).all();
    
    // Format data untuk Recharts: Tambahkan properti 'selisih'
    const chartData = results.map(row => ({
      ...row,
      selisih: row.pemasukan - row.pengeluaran
    }));

    return Response.json({ success: true, data: chartData });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}