import { useState, useMemo, useEffect, type ChangeEvent, type SyntheticEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WaveChart from './components/WaveChart';
import DistributionChart from './components/DistributionChart';

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

// 1. Tambahkan Interface untuk Props
interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

// 2. Deklarasikan komponen DI LUAR fungsi App
function ThemeToggle({ isDarkMode, setIsDarkMode }: ThemeToggleProps) {
  return (
    <button 
      onClick={() => setIsDarkMode(!isDarkMode)} 
      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
      title="Toggle Dark Mode"
    >
      {isDarkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      )}
    </button>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  
  // --- STATE TEMA (DARK/LIGHT MODE) ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Cek localStorage atau preferensi sistem browser
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cf_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default gelap
  });

  // Efek untuk menerapkan class 'dark' ke tag <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cf_theme', 'light');
    }
  }, [isDarkMode]);

  // --- STATE AUTENTIKASI ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cf_auth_session') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- STATE APLIKASI ---
  const [filterType, setFilterType] = useState<FilterType>('bulanan');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
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
    queryClient.clear();
  };

  // --- QUERY FETCH DATA ---
  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<ChartSummaryData[]>({
    queryKey: ['summary', filterType],
    queryFn: async () => {
      const res = await fetch(`/api/summary?type=${filterType}`);
      const json = await res.json();
      return json.data;
    },
    enabled: isAuthenticated
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

  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Ambil semua data transaksi berjenis pengeluaran yang aktif saat ini
    transactions
      .filter(t => t.type === 'pengeluaran')
      .forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + t.amount;
      });

    // Format menjadi array yang siap dibaca oleh Recharts Pie
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [transactions]);

  // --- HANDLERS ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-300">
        <div className="absolute top-6 right-6">
          <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </div>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl transition-colors duration-300">
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-bold text-slate-950 text-xl">CF</span>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Email</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Password</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-300">
      
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-bold text-slate-950 text-lg">CF</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
              {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${
                    filterType === type ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-md font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            <button onClick={handleLogout} className="text-sm font-medium text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors">
              Logout
            </button>
          </div>

          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2 mb-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Filter Waktu</span>
              {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => { setFilterType(type); setIsMobileMenuOpen(false); }}
                  className={`px-4 py-3 text-left text-sm font-medium rounded-xl capitalize transition-all ${
                    filterType === type 
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold' 
                      : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout Keluar
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">{(isLoadingChart) ? '...' : formatRupiah(summary.pemasukan)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2 tracking-tight">{(isLoadingChart) ? '...' : formatRupiah(summary.pengeluaran)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Selisih Bersih (Neto)</p>
            <p className={`text-3xl font-bold mt-2 tracking-tight ${summary.selisih >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {(isLoadingChart) ? '...' : formatRupiah(summary.selisih)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Tambah Transaksi */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl h-fit transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span className={`w-1.5 h-5 rounded-full ${editingId ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h2>
              {editingId && (
                <button onClick={() => { setEditingId(null); setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] }); }} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, type: 'pemasukan', category: '' }))} className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'pemasukan' ? 'bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>Pemasukan</button>
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, type: 'pengeluaran', category: '' }))} className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'pengeluaran' ? 'bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>Pengeluaran</button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Jumlah Uang (Rp)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" required />
              </div>
              <div>
                <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" 
                  required
                >
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {formData.type === 'pemasukan' ? (
                    <>
                      <option value="Gaji">Gaji Bulanan</option>
                      <option value="Freelance">Freelance / Proyek</option>
                      <option value="Investasi">Keuntungan Investasi</option>
                      <option value="Lainnya">Uang Masuk Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Makanan">Makanan & Minuman</option>
                      <option value="Transportasi">Transportasi / Bensin</option>
                      <option value="Belanja">Belanja Bulanan / Pasar</option>
                      <option value="Hiburan">Hiburan / Gaya Hidup</option>
                      <option value="Tagihan">Tagihan / Listrik / WiFi</option>
                      <option value="Lainnya">Pengeluaran Lainnya</option>
                    </>
                  )}
                </select>
              </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tanggal</label>
                <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Keterangan</label>
                <textarea name="description" rows={2} value={formData.description} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none" />
              </div>
              <button
                type="submit"
                disabled={submitTransaction.isPending}
                className={`w-full py-3 px-4 font-bold rounded-xl transition shadow-lg disabled:opacity-50 ${
                  editingId 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10' 
                    : formData.type === 'pemasukan' 
                      ? 'bg-emerald-500 text-white dark:text-slate-950 hover:bg-emerald-600 dark:hover:bg-emerald-400 shadow-emerald-500/10' 
                      : 'bg-rose-500 text-white dark:text-slate-950 hover:bg-rose-600 dark:hover:bg-rose-400 shadow-rose-500/10'
                }`}
              >
                {submitTransaction.isPending ? 'Memproses...' : editingId ? 'Update Transaksi' : `Simpan ${formData.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grafik 1: Gelombang Selisih */}
            <div className="w-full">
              <WaveChart data={chartData} loading={isLoadingChart} filterType={filterType} />
            </div>
            
            {/* Grafik 2: Distribusi Pengeluaran (Pie/Donut) */}
            <div className="w-full">
              <DistributionChart data={distributionData} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
              Riwayat Transaksi Terbaru
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 w-32">Tanggal</th>
                  <th className="py-4 px-4 w-48">Kategori</th>
                  <th className="py-4 px-4">Keterangan</th>
                  <th className="py-4 px-4 w-32">Jenis</th>
                  <th className="py-4 px-4 w-40 text-right">Jumlah</th>
                  <th className="py-4 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {isLoadingTransactions ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Memuat data...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada transaksi.</td></tr>
                ) : (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">{trx.category}</td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{trx.description || '-'}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          trx.type === 'pemasukan' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}>
                          {trx.type}
                        </span>
                      </td>
                      <td className={`py-4 px-4 text-right font-bold whitespace-nowrap ${trx.type === 'pemasukan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {trx.type === 'pemasukan' ? '+' : '-'} {formatRupiah(trx.amount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(trx)} className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-400/10 rounded transition" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>
                          <button onClick={() => handleDelete(trx.id)} disabled={deleteTransaction.isPending} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-400/10 rounded transition disabled:opacity-50" title="Hapus">
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