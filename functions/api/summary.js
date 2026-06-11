// functions/api/summary.js

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'bulanan';

  let dateCondition = "";
  // Jika harian, kita ambil per jam atau cukup transaksi hari itu saja.
  // Untuk grafik gelombang, lebih cocok dikelompokkan berdasarkan tanggal untuk bulanan/tahunan.
  if (type === 'harian') {
    dateCondition = "date(transaction_date) = date('now')";
  } else if (type === 'bulanan') {
    dateCondition = "strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')";
  } else if (type === 'tahunan') {
    dateCondition = "strftime('%Y', transaction_date) = strftime('%Y', 'now')";
  }

  // Melakukan agregasi (Pengelompokan) data pemasukan dan pengeluaran
  const sql = `
    SELECT 
      transaction_date as date,
      SUM(CASE WHEN type = 'pemasukan' THEN amount ELSE 0 END) as pemasukan,
      SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END) as pengeluaran
    FROM transactions
    WHERE ${dateCondition}
    GROUP BY transaction_date
    ORDER BY transaction_date ASC
  `;

  try {
    const { results } = await env.DB.prepare(sql).all();
    
    // Hitung selisih untuk grafik gelombang
    const chartData = results.map(row => ({
      ...row,
      selisih: row.pemasukan - row.pengeluaran
    }));

    return Response.json({ success: true, data: chartData });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}