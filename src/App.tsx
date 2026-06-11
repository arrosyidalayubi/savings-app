import { useState, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WaveChart from './components/WaveChart';

// --- DEFINISI TYPESCRIPT ---
type FilterType = 'harian' | 'bulanan' | 'tahunan';

interface Transaction {
  id: number;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
}

interface ChartSummaryData {
  date: string;
  pemasukan: number;
  pengeluaran: number;
  selisih: number;
}

interface TransactionFormData {
  type: 'pemasukan' | 'pengeluaran';
  amount: string;
  category: string;
  description: string;
  transaction_date: string;
}

export default function App() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<FilterType>('bulanan');

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'pengeluaran',
    amount: '',
    category: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  // --- 1. MENGAMBIL DATA RINGKASAN & GRAFIK (TanStack Query) ---
  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<ChartSummaryData[]>({
    queryKey: ['summary', filterType], // Kunci cache unik berdasarkan tab yang dipilih
    queryFn: async () => {
      const res = await fetch(`/api/summary?type=${filterType}`);
      const json = await res.json();
      if (!json.success) throw new Error("Gagal memuat ringkasan");
      return json.data;
    }
  });

  // --- 2. MENGAMBIL DATA TRANSAKSI (Berdasarkan Filter) ---
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', filterType], // Tambahkan filterType agar tabel ikut berubah!
    queryFn: async () => {
      // Ubah dari limit=10 menjadi menggunakan filter
      const res = await fetch(`/api/transactions?filter=${filterType}`);
      const json = await res.json();
      if (!json.success) throw new Error("Gagal memuat transaksi");
      return json.data;
    }
  });

  // --- 3. MUTASI: MENYIMPAN TRANSAKSI BARU (TanStack Mutation) ---
  const submitTransaction = useMutation({
    mutationFn: async (newTransaction: Omit<Transaction, 'id'>) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
      const json = await res.json();
      if (!json.success) throw new Error("Gagal menyimpan data");
      return json;
    },
    onSuccess: () => {
    setFormData((prev) => ({ ...prev, amount: '', category: '', description: '' }));
    
    // Beritahu TanStack untuk membuang cache lama dan ambil data baru!
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
    onError: (error) => {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan transaksi.");
    }
  });

  // --- 4. KALKULASI TOTAL (Derived State dengan useMemo) ---
  // Tidak perlu useEffect! Kalkulasi otomatis berjalan HANYA jika chartData berubah
  const summary = useMemo(() => {
    const pemasukan = chartData.reduce((acc, curr) => acc + curr.pemasukan, 0);
    const pengeluaran = chartData.reduce((acc, curr) => acc + curr.pengeluaran, 0);
    return {
      pemasukan,
      pengeluaran,
      selisih: pemasukan - pengeluaran
    };
  }, [chartData]);

  // Handler Form
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return alert("Mohon isi jumlah dan kategori");

    // Eksekusi mutasi TanStack
    submitTransaction.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const formatRupiah = (num: number): string => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Status loading gabungan untuk UI
  const isGlobalLoading = isLoadingChart || isLoadingTransactions;

  return (
    <div className="min-height-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-bold text-slate-950 text-lg">CF</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">CashFlow <span className="text-emerald-400">Edge</span></span>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/50">
            {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${
                  filterType === type 
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Row 1: Kartu Ringkasan Atas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2 tracking-tight">
              {isGlobalLoading ? 'Menghitung...' : formatRupiah(summary.pemasukan)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-rose-400 mt-2 tracking-tight">
              {isGlobalLoading ? 'Menghitung...' : formatRupiah(summary.pengeluaran)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Selisih Bersih (Neto)</p>
            <p className={`text-3xl font-bold mt-2 tracking-tight ${summary.selisih >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isGlobalLoading ? 'Menghitung...' : formatRupiah(summary.selisih)}
            </p>
          </div>
        </div>

        {/* Row 2: Form Input & Wave Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
              Tambah Transaksi
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'pemasukan' }))}
                  className={`py-2 text-sm font-bold rounded-lg transition-all ${
                    formData.type === 'pemasukan' 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'pengeluaran' }))}
                  className={`py-2 text-sm font-bold rounded-lg transition-all ${
                    formData.type === 'pengeluaran' 
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pengeluaran
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jumlah Uang (Rp)</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="Contoh: 50000"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                <input
                  type="text"
                  name="category"
                  placeholder="Makanan, Gaji, dll"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tanggal</label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Keterangan</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitTransaction.isPending}
                className={`w-full py-3 px-4 font-bold rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.type === 'pemasukan' 
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/10' 
                    : 'bg-rose-500 text-slate-950 hover:bg-rose-400 shadow-rose-500/10'
                }`}
              >
                {submitTransaction.isPending ? 'Menyimpan...' : `Simpan ${formData.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-between">
            {isLoadingChart ? (
              <div className="h-80 flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900">
                <span className="text-slate-400">Memuat grafik...</span>
              </div>
            ) : (
              <WaveChart data={chartData} loading={isLoadingChart} filterType={filterType} />
            )}
          </div>
        </div>

        {/* Row 3: Tabel Detail Transaksi */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
              Riwayat Transaksi Terbaru
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Tanggal</th>
                  <th className="py-4 px-4">Kategori</th>
                  <th className="py-4 px-4">Keterangan</th>
                  <th className="py-4 px-4">Jenis</th>
                  <th className="py-4 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Memuat data transaksi...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Belum ada data transaksi.</td>
                  </tr>
                ) : (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 whitespace-nowrap text-slate-300">
                        {new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 font-medium text-white">{trx.category}</td>
                      <td className="py-4 px-4 text-slate-400 max-w-xs truncate">{trx.description || '-'}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          trx.type === 'pemasukan' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {trx.type}
                        </span>
                      </td>
                      <td className={`py-4 px-4 text-right font-bold whitespace-nowrap ${
                        trx.type === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {trx.type === 'pemasukan' ? '+' : '-'} {formatRupiah(trx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}