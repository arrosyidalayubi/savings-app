import { useState, useMemo, type ChangeEvent, type SyntheticEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WaveChart from './components/WaveChart';

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
  
  // State Autentikasi
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // React hanya akan mengeksekusi baris ini satu kali saat komponen pertama kali dimuat
    return localStorage.getItem('cf_auth_session') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State Aplikasi
  const [filterType, setFilterType] = useState<FilterType>('bulanan');
  const [editingId, setEditingId] = useState<number | null>(null); // Menyimpan ID data yang sedang diedit
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'pengeluaran',
    amount: '',
    category: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });


  // --- MUTASI LOGIN ---
  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('cf_auth_session', 'true');
      } else {
        alert("Login Gagal: Email atau Password salah!");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cf_auth_session');
    queryClient.clear(); // Hapus cache TanStack
  };

  // --- QUERY FETCH DATA ---
  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<ChartSummaryData[]>({
    queryKey: ['summary', filterType],
    queryFn: async () => {
      const res = await fetch(`/api/summary?type=${filterType}`);
      const json = await res.json();
      return json.data;
    },
    enabled: isAuthenticated // Hanya ambil data jika sudah login
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', filterType],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?filter=${filterType}`);
      const json = await res.json();
      return json.data;
    },
    enabled: isAuthenticated
  });

  // --- MUTASI CRUD ---
  // 1. Simpan Baru atau Update (Upsert)
  const submitTransaction = useMutation({
    mutationFn: async (payload: { id: number | null, data: Omit<Transaction, 'id'> }) => {
      const isEdit = payload.id !== null;
      const url = isEdit ? `/api/transactions/${payload.id}` : '/api/transactions';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data)
      });
      return await res.json();
    },
    onSuccess: () => {
      setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  // 2. Hapus Data
  const deleteTransaction = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  // --- DERIVED STATE ---
  const summary = useMemo(() => {
    const pemasukan = chartData.reduce((acc, curr) => acc + curr.pemasukan, 0);
    const pengeluaran = chartData.reduce((acc, curr) => acc + curr.pengeluaran, 0);
    return { pemasukan, pengeluaran, selisih: pemasukan - pengeluaran };
  }, [chartData]);

  // --- HANDLERS ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return alert("Mohon isi jumlah dan kategori");
    submitTransaction.mutate({
      id: editingId,
      data: { ...formData, amount: parseFloat(formData.amount) }
    });
  };

  const startEdit = (trx: Transaction) => {
    setEditingId(trx.id);
    setFormData({
      type: trx.type,
      amount: trx.amount.toString(),
      category: trx.category,
      description: trx.description || '',
      transaction_date: trx.transaction_date.split('T')[0]
    });
    // Scroll layar ke form input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      deleteTransaction.mutate(id);
    }
  };

  const formatRupiah = (num: number): string => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // ==========================================
  // RENDER LAYAR LOGIN JIKA BELUM AUTENTIKASI
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-bold text-slate-950 text-xl">CF</span>
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">CashFlow <span className="text-emerald-400">Edge</span></span>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-400 uppercase mb-2">Email</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500 transition"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 uppercase mb-2">Password</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500 transition"
                required 
              />
            </div>
            <button type="submit" className="w-full py-3.5 mt-4 font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition shadow-lg shadow-emerald-500/20">
              Masuk Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER LAYAR UTAMA (DASHBOARD)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Header Aplikasi */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-bold text-slate-950 text-lg">CF</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">CashFlow <span className="text-emerald-400">Edge</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/50 md:flex">
              {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${
                    filterType === type ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="text-sm font-medium text-rose-400 hover:text-rose-300">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Row 1: Kartu Ringkasan Atas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ... (Kode Kartu Pemasukan, Pengeluaran, Selisih sama seperti sebelumnya) ... */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2 tracking-tight">{(isLoadingChart) ? '...' : formatRupiah(summary.pemasukan)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-rose-400 mt-2 tracking-tight">{(isLoadingChart) ? '...' : formatRupiah(summary.pengeluaran)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Selisih Bersih (Neto)</p>
            <p className={`text-3xl font-bold mt-2 tracking-tight ${summary.selisih >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(isLoadingChart) ? '...' : formatRupiah(summary.selisih)}
            </p>
          </div>
        </div>

        {/* Row 2: Form Input & Wave Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className={`w-1.5 h-5 rounded-full ${editingId ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h2>
              {editingId && (
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-lg"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, type: 'pemasukan' }))} className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'pemasukan' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>Pemasukan</button>
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, type: 'pengeluaran' }))} className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'pengeluaran' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'text-slate-400 hover:text-slate-200'}`}>Pengeluaran</button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jumlah Uang (Rp)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tanggal</label>
                <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Keterangan</label>
                <textarea name="description" rows={2} value={formData.description} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-none" />
              </div>
              <button
                type="submit"
                disabled={submitTransaction.isPending}
                className={`w-full py-3 px-4 font-bold rounded-xl transition shadow-lg disabled:opacity-50 ${
                  editingId 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10' 
                    : formData.type === 'pemasukan' 
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/10' 
                      : 'bg-rose-500 text-slate-950 hover:bg-rose-400 shadow-rose-500/10'
                }`}
              >
                {submitTransaction.isPending ? 'Memproses...' : editingId ? 'Update Transaksi' : `Simpan ${formData.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-between">
            <WaveChart data={chartData} loading={isLoadingChart} filterType={filterType} />
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
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 w-32">Tanggal</th>
                  <th className="py-4 px-4 w-48">Kategori</th>
                  <th className="py-4 px-4">Keterangan</th>
                  <th className="py-4 px-4 w-32">Jenis</th>
                  <th className="py-4 px-4 w-40 text-right">Jumlah</th>
                  <th className="py-4 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {isLoadingTransactions ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Memuat data transaksi...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Mulai catat transaksi pertama Anda!</td></tr>
                ) : (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-4 whitespace-nowrap text-slate-300">
                        {new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 font-medium text-white">{trx.category}</td>
                      <td className="py-4 px-4 text-slate-400 max-w-xs truncate">{trx.description || '-'}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          trx.type === 'pemasukan' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {trx.type}
                        </span>
                      </td>
                      <td className={`py-4 px-4 text-right font-bold whitespace-nowrap ${trx.type === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trx.type === 'pemasukan' ? '+' : '-'} {formatRupiah(trx.amount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Tombol Edit */}
                          <button onClick={() => startEdit(trx)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded transition" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>
                          {/* Tombol Hapus */}
                          <button onClick={() => handleDelete(trx.id)} disabled={deleteTransaction.isPending} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded transition disabled:opacity-50" title="Hapus">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
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