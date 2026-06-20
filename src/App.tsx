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

// Komponen Ikon (SVG Inline agar rapi)
const Icons = {
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
};

interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

function ThemeToggle({ isDarkMode, setIsDarkMode }: ThemeToggleProps) {
  return (
    <button 
      onClick={() => setIsDarkMode(!isDarkMode)} 
      className="p-2 text-muted hover:text-accent transition-colors"
      title="Toggle Dark Mode"
    >
      {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
    </button>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  
  // --- STATES ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cf_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cf_theme', 'light');
    }
  }, [isDarkMode]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('cf_auth_session') === 'true');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [filterType, setFilterType] = useState<FilterType>('bulanan');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0]
  });

  // --- LOGIC ---
  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true); localStorage.setItem('cf_auth_session', 'true');
      } else {
        alert("Login Gagal: Email atau Password salah!");
      }
    } catch { alert("Terjadi kesalahan jaringan."); }
  };

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('cf_auth_session'); queryClient.clear(); };

  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<ChartSummaryData[]>({
    queryKey: ['summary', filterType],
    queryFn: async () => { const res = await fetch(`/api/summary?type=${filterType}`); const json = await res.json(); return json.data; },
    enabled: isAuthenticated
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', filterType],
    queryFn: async () => { const res = await fetch(`/api/transactions?filter=${filterType}`); const json = await res.json(); return json.data; },
    enabled: isAuthenticated
  });

  const submitTransaction = useMutation({
    mutationFn: async (payload: { id: number | null, data: Omit<Transaction, 'id'> }) => {
      const isEdit = payload.id !== null;
      const res = await fetch(isEdit ? `/api/transactions/${payload.id}` : '/api/transactions', {
        method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload.data)
      });
      return await res.json();
    },
    onSuccess: () => {
      setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['summary'] }); queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: number) => { const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' }); return await res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['summary'] }); queryClient.invalidateQueries({ queryKey: ['transactions'] }); }
  });

  const summary = useMemo(() => {
    const pemasukan = chartData.reduce((a, c) => a + c.pemasukan, 0);
    const pengeluaran = chartData.reduce((a, c) => a + c.pengeluaran, 0);
    return { pemasukan, pengeluaran, selisih: pemasukan - pengeluaran };
  }, [chartData]);

  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.filter(t => t.type === 'pengeluaran').forEach(t => counts[t.category] = (counts[t.category] || 0) + t.amount);
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [transactions]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return alert("Mohon isi jumlah");
    submitTransaction.mutate({ id: editingId, data: { ...formData, amount: parseFloat(formData.amount) } });
  };

  const startEdit = (trx: Transaction) => {
    setEditingId(trx.id);
    setFormData({ type: trx.type, amount: trx.amount.toString(), category: trx.category, description: trx.description || '', transaction_date: trx.transaction_date.split('T')[0] });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      deleteTransaction.mutate(id);
    }
  };

  const formatRupiah = (num: number): string => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  // --- LAYAR LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 transition-colors duration-300">
        <div className="absolute top-6 right-6"><ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /></div>
        <div className="w-full max-w-md bg-surface border border-border rounded-[20px] p-8 shadow-2xl transition-colors duration-300">
          <div className="flex justify-center items-center gap-3 mb-8">
            <Icons.Target />
            <span className="text-2xl font-bold tracking-tight text-primary">CashFlow <span className="text-accent">Edge</span></span>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition" required />
            </div>
            <button type="submit" className="w-full py-3.5 mt-2 font-bold text-white bg-accent hover:opacity-90 rounded-xl transition shadow-lg shadow-accent/20">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  // --- LAYAR DASHBOARD UTAMA ---
  return (
    <div className="flex h-screen w-full bg-background text-primary font-sans overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border transition-colors duration-300">
        <div className="h-20 flex items-center px-6 gap-3 border-b border-transparent">
          <div className="text-accent"><Icons.Target /></div>
          <span className="text-xl font-bold tracking-tight text-primary">CashFlow</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-accent text-white rounded-xl font-medium shadow-md shadow-accent/10 transition">
            <Icons.Home /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-primary hover:bg-background rounded-xl font-medium transition">
            <Icons.Target /> Goals Plans
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-primary hover:bg-background rounded-xl font-medium transition">
            <Icons.Wallet /> Wallet
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-primary hover:bg-background rounded-xl font-medium transition">
            <Icons.Settings /> Settings
          </button>
        </nav>

        <div className="p-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl font-medium transition">
            <Icons.Logout /> Logout
          </button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER ATAS */}
        <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-6 lg:px-8 transition-colors duration-300 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-primary">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            {/* Search Bar (Desain UI) */}
            <div className="hidden md:flex items-center bg-background border border-border rounded-full px-4 py-2">
              <span className="text-muted mr-2"><Icons.Search /></span>
              <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-48 text-primary" />
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
              <button className="p-2 text-muted hover:text-primary transition-colors relative">
                <Icons.Bell />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
              </button>
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-sm ml-2">
                A
              </div>
            </div>
          </div>
        </header>

        {/* KONTEN SCROLLABLE */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* Navigasi Filter (Harian/Bulanan/Tahunan) */}
            <div className="flex items-center gap-2 pb-2">
              {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-5 py-2 text-sm font-semibold rounded-full capitalize transition-all ${
                    filterType === type ? 'bg-accent text-white shadow-md' : 'bg-surface border border-border text-muted hover:text-primary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* BARIS 1: KARTU SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm transition-colors duration-300">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm font-medium text-muted">Total Pemasukan</p>
                  <div className="p-1.5 bg-accent/10 text-accent rounded-lg"><Icons.Wallet /></div>
                </div>
                <p className="text-3xl font-bold text-primary">{isLoadingChart ? '...' : formatRupiah(summary.pemasukan)}</p>
                <p className="text-xs text-muted mt-2">Dari {transactions.filter(t => t.type === 'pemasukan').length} transaksi aktif</p>
              </div>

              <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm transition-colors duration-300">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm font-medium text-muted">Total Pengeluaran</p>
                  <div className="p-1.5 bg-danger/10 text-danger rounded-lg"><Icons.Target /></div>
                </div>
                <p className="text-3xl font-bold text-primary">{isLoadingChart ? '...' : formatRupiah(summary.pengeluaran)}</p>
                <p className="text-xs text-muted mt-2">Dari {transactions.filter(t => t.type === 'pengeluaran').length} transaksi aktif</p>
              </div>

              {/* Kartu Khusus (Total Savings Style) */}
              <div className="bg-brand text-white border border-brand rounded-[20px] p-6 shadow-lg relative overflow-hidden transition-colors duration-300">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-white/80">Selisih Bersih (Neto)</p>
                  <p className="text-3xl font-bold mt-3">{isLoadingChart ? '...' : formatRupiah(summary.selisih)}</p>
                  <p className="text-xs text-white/60 mt-2 mb-4">Status keuangan saat ini</p>
                  <div className="flex gap-3">
                    <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur transition">Lihat Riwayat</button>
                  </div>
                </div>
                {/* Dekorasi Abstrak */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/30 rounded-full blur-2xl"></div>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              </div>
            </div>

            {/* BARIS 2: GRAFIK GELOMBANG & FORM INPUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Analytics Chart */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm flex flex-col transition-colors duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-primary">Analytics</h3>
                  <span className="text-xs bg-background border border-border px-2 py-1 rounded text-muted">{filterType}</span>
                </div>
                <div className="flex-1 w-full min-h-62.5">
                   <WaveChart data={chartData} loading={isLoadingChart} filterType={filterType} />
                </div>
              </div>

              {/* Form Input (Create A New Goal Style) */}
              <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm transition-colors duration-300">
                 <h3 className="text-lg font-bold text-primary mb-6">{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
                 <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 bg-background p-1.5 rounded-xl border border-border">
                      <button type="button" onClick={() => setFormData({ ...formData, type: 'pemasukan', category: '' })} className={`py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === 'pemasukan' ? 'bg-surface text-accent shadow-sm' : 'text-muted'}`}>Pemasukan</button>
                      <button type="button" onClick={() => setFormData({ ...formData, type: 'pengeluaran', category: '' })} className={`py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === 'pengeluaran' ? 'bg-surface text-danger shadow-sm' : 'text-muted'}`}>Pengeluaran</button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Jumlah Uang *</label>
                      <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Kategori *</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition appearance-none" required>
                          <option value="" disabled>Pilih...</option>
                          {formData.type === 'pemasukan' ? (
                            <><option value="Gaji">Gaji</option><option value="Freelance">Freelance</option><option value="Lainnya">Lainnya</option></>
                          ) : (
                            <><option value="Makanan">Makanan</option><option value="Transportasi">Transportasi</option><option value="Belanja">Belanja</option><option value="Tagihan">Tagihan</option><option value="Lainnya">Lainnya</option></>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Tanggal *</label>
                        <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Keterangan</label>
                      <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition" />
                    </div>

                    <div className="flex gap-3 pt-2">
                      {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] }); }} className="flex-1 py-2.5 bg-background border border-border text-muted rounded-lg text-sm font-semibold hover:text-primary transition">Batal</button>
                      )}
                      <button type="submit" disabled={submitTransaction.isPending} className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold shadow-md shadow-accent/20 hover:opacity-90 transition disabled:opacity-50">
                        {submitTransaction.isPending ? 'Loading...' : (editingId ? 'Simpan' : '+ Tambah')}
                      </button>
                    </div>
                 </form>
              </div>
            </div>

            {/* BARIS 3: TABEL RECENT ACTIVITY & DISTRIBUSI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">Recent Activity <span className="p-1 bg-accent/10 text-accent rounded"><Icons.Wallet /></span></h3>
                  <div className="flex text-xs font-medium text-muted gap-4">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent"></span> Terbaru</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-muted border-b border-border">
                        <th className="pb-3 font-medium w-40">Kategori</th>
                        <th className="pb-3 font-medium">Keterangan</th>
                        <th className="pb-3 font-medium">Tanggal</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoadingTransactions ? (
                        <tr><td colSpan={5} className="py-6 text-center text-muted">Memuat data...</td></tr>
                      ) : (
                        transactions.map((trx) => (
                          <tr key={trx.id} className="group hover:bg-background/50 transition">
                            <td className="py-4 font-semibold text-primary">{trx.category}</td>
                            <td className="py-4 text-muted truncate max-w-37.5">{trx.description || '-'}</td>
                            <td className="py-4 text-muted">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="py-4">
                              <span className={`flex items-center gap-1.5 font-medium ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${trx.type === 'pemasukan' ? 'bg-accent' : 'bg-danger'}`}></span>
                                {trx.type === 'pemasukan' ? 'Masuk' : 'Keluar'}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => startEdit(trx)} className="text-muted hover:text-primary transition" title="Edit">Edit</button>
                                <button onClick={() => handleDelete(trx.id)} className="text-danger hover:opacity-80 transition" title="Hapus">Hapus</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Distribution Chart */}
              <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm transition-colors duration-300">
                <DistributionChart data={distributionData} />
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* MOBILE OVERLAY MENU (Jika dibuka) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden flex">
          <div className="w-64 h-full bg-surface border-r border-border p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-primary">CashFlow</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <nav className="flex-1 space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-accent text-white rounded-xl font-medium"><Icons.Home /> Dashboard</button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-muted rounded-xl font-medium"><Icons.Wallet /> Wallet</button>
            </nav>
            <button onClick={handleLogout} className="w-full py-3 bg-danger/10 text-danger rounded-xl font-medium mt-auto">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}