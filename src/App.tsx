import { useState, useMemo, useEffect, type ChangeEvent, type SyntheticEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WaveChart from './components/WaveChart';
import DistributionChart from './components/DistributionChart';

type FilterType = 'harian' | 'bulanan' | 'tahunan';
type MenuType = 'dashboard' | 'goals' | 'wallet' | 'settings';

interface Transaction {
  id: number; type: 'pemasukan' | 'pengeluaran'; amount: number; category: string; description: string; transaction_date: string;
}
interface ChartSummaryData {
  date: string; pemasukan: number; pengeluaran: number; selisih: number;
}
interface TransactionFormData {
  type: 'pemasukan' | 'pengeluaran'; amount: string; category: string; description: string; transaction_date: string;
}

// Kumpulan Ikon Lengkap
const Icons = {
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Laptop: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>,
  Car: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ArrowUpRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  ArrowDownLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>,
  Send: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
};

interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

function ThemeToggle({ isDarkMode, setIsDarkMode }: ThemeToggleProps) {
  return (
    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-muted hover:text-accent transition-colors" title="Toggle Dark Mode">
      {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
    </button>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  
  // --- STATES ---
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard'); // STATE UNTUK ROUTING HALAMAN
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cf_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('cf_theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('cf_theme', 'light'); }
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

  // --- LOGIC BACKEND DASHBOARD ---
  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      const data = await res.json();
      if (data.success) { setIsAuthenticated(true); localStorage.setItem('cf_auth_session', 'true'); } 
      else { alert("Login Gagal: Email atau Password salah!"); }
    } catch { alert("Terjadi kesalahan jaringan."); }
  };

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('cf_auth_session'); queryClient.clear(); };

  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<ChartSummaryData[]>({
    queryKey: ['summary', filterType], queryFn: async () => { const res = await fetch(`/api/summary?type=${filterType}`); const json = await res.json(); return json.data; }, enabled: isAuthenticated
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', filterType], queryFn: async () => { const res = await fetch(`/api/transactions?filter=${filterType}`); const json = await res.json(); return json.data; }, enabled: isAuthenticated
  });

  const submitTransaction = useMutation({
    mutationFn: async (payload: { id: number | null, data: Omit<Transaction, 'id'> }) => {
      const isEdit = payload.id !== null;
      const res = await fetch(isEdit ? `/api/transactions/${payload.id}` : '/api/transactions', { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload.data) });
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
    e.preventDefault(); if (!formData.amount || !formData.category) return alert("Mohon isi jumlah");
    submitTransaction.mutate({ id: editingId, data: { ...formData, amount: parseFloat(formData.amount) } });
  };

  const startEdit = (trx: Transaction) => {
    setEditingId(trx.id);
    setFormData({ type: trx.type, amount: trx.amount.toString(), category: trx.category, description: trx.description || '', transaction_date: trx.transaction_date.split('T')[0] });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) { deleteTransaction.mutate(id); }
  };

  const formatRupiah = (num: number): string => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  // ==============================================================================
  // DATA DUMMY SEMENTARA UNTUK GOALS & WALLET (Tahap 1 UI/UX)
  // ==============================================================================
  const dummyGoals = [
    { id: 1, name: 'Beli Laptop Baru', icon: <Icons.Laptop />, target: 15000000, saved: 12000000, deadline: '12 Aug 2026', status: 'Active' },
    { id: 2, name: 'Liburan & Travel', icon: <Icons.Car />, target: 5000000, saved: 1800000, deadline: '20 Dec 2026', status: 'Active' },
    { id: 3, name: 'Smart Watch', icon: <Icons.Target />, target: 2000000, saved: 2000000, deadline: '1 Jan 2026', status: 'Completed' },
  ];

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

  // --- LAYAR UTAMA DENGAN ROUTING ---
  return (
    <div className="flex h-screen w-full bg-background text-primary font-sans overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border transition-colors duration-300">
        <div className="h-20 flex items-center px-6 gap-3 border-b border-transparent">
          <div className="text-accent"><Icons.Target /></div>
          <span className="text-xl font-bold tracking-tight text-primary">CashFlow</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => setActiveMenu('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'dashboard' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}>
            <Icons.Home /> Dashboard
          </button>
          <button onClick={() => setActiveMenu('goals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'goals' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}>
            <Icons.Target /> Goals Plans
          </button>
          <button onClick={() => setActiveMenu('wallet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'wallet' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}>
            <Icons.Wallet /> Wallet
          </button>
          <button onClick={() => setActiveMenu('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'settings' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}>
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
            <h1 className="text-xl lg:text-2xl font-bold text-primary capitalize">{activeMenu === 'goals' ? 'Goals Plans' : activeMenu}</h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden md:flex items-center bg-background border border-border rounded-full px-4 py-2">
              <span className="text-muted mr-2"><Icons.Search /></span>
              <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-48 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
              <button className="p-2 text-muted hover:text-primary transition-colors relative"><Icons.Bell /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span></button>
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-sm ml-2">A</div>
            </div>
          </div>
        </header>

        {/* KONTEN DINAMIS BERDASARKAN MENU YANG AKTIF */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* ========================================================================= */}
            {/* VIEW 1: DASHBOARD (Kode Lama Tetap Aman) */}
            {/* ========================================================================= */}
            {activeMenu === 'dashboard' && (
              <>
                {/* Navigasi Filter & KARTU SUMMARY */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex gap-2">
                    {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
                      <button key={type} onClick={() => setFilterType(type)} className={`px-5 py-2 text-sm font-semibold rounded-full capitalize transition-all ${filterType === type ? 'bg-accent text-white shadow-md' : 'bg-surface border border-border text-muted hover:text-primary'}`}>{type}</button>
                    ))}
                  </div>
                  <button className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg shadow-md hover:opacity-90 flex items-center gap-2"><Icons.Plus /> Add Goal</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-muted">Total Pemasukan</p><div className="p-1.5 bg-accent/10 text-accent rounded-lg"><Icons.ArrowDownLeft /></div></div>
                    <p className="text-3xl font-bold text-primary">{isLoadingChart ? '...' : formatRupiah(summary.pemasukan)}</p>
                  </div>
                  <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-muted">Total Pengeluaran</p><div className="p-1.5 bg-danger/10 text-danger rounded-lg"><Icons.ArrowUpRight /></div></div>
                    <p className="text-3xl font-bold text-primary">{isLoadingChart ? '...' : formatRupiah(summary.pengeluaran)}</p>
                  </div>
                  <div className="bg-brand text-white border border-brand rounded-[20px] p-6 shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-white/80">Total Savings (Neto)</p>
                      <p className="text-3xl font-bold mt-3">{isLoadingChart ? '...' : formatRupiah(summary.selisih)}</p>
                      <p className="text-xs text-white/60 mt-2 mb-4">Status keuangan saat ini</p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/30 rounded-full blur-2xl"></div>
                  </div>
                </div>

                {/* GRAFIK & FORM */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-primary">Analytics</h3></div>
                    <div className="flex-1 w-full min-h-62.5"><WaveChart data={chartData} loading={isLoadingChart} filterType={filterType} /></div>
                  </div>

                  <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-6">{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 bg-background p-1.5 rounded-xl border border-border">
                        <button type="button" onClick={() => setFormData({ ...formData, type: 'pemasukan', category: '' })} className={`py-2 text-sm font-semibold rounded-lg ${formData.type === 'pemasukan' ? 'bg-surface text-accent shadow-sm' : 'text-muted'}`}>Masuk</button>
                        <button type="button" onClick={() => setFormData({ ...formData, type: 'pengeluaran', category: '' })} className={`py-2 text-sm font-semibold rounded-lg ${formData.type === 'pengeluaran' ? 'bg-surface text-danger shadow-sm' : 'text-muted'}`}>Keluar</button>
                      </div>
                      <div><input type="number" name="amount" placeholder="Jumlah Uang" value={formData.amount} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm" required /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm" required>
                          <option value="" disabled>Kategori...</option>
                          {formData.type === 'pemasukan' ? (<><option value="Gaji">Gaji</option><option value="Freelance">Freelance</option></>) : (<><option value="Makanan">Makanan</option><option value="Transportasi">Transport</option></>)}
                        </select>
                        <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm" required />
                      </div>
                      <div><input type="text" name="description" placeholder="Keterangan..." value={formData.description} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm" /></div>
                      <button type="submit" disabled={submitTransaction.isPending} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-semibold shadow-md">{submitTransaction.isPending ? 'Loading...' : 'Simpan'}</button>
                    </form>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm overflow-x-auto">
                    <h3 className="text-lg font-bold text-primary mb-6">Recent Activity</h3>
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-muted border-b border-border">
                          <th className="pb-3 font-medium w-32">Kategori</th>
                          <th className="pb-3 font-medium">Keterangan</th>
                          <th className="pb-3 font-medium">Tanggal</th>
                          <th className="pb-3 font-medium text-right">Jumlah</th>
                          <th className="pb-3 font-medium text-center w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {isLoadingTransactions ? (
                          <tr><td colSpan={5} className="py-6 text-center text-muted font-medium">Memuat data...</td></tr>
                        ) : transactions.length === 0 ? (
                          <tr><td colSpan={5} className="py-6 text-center text-muted">Belum ada data.</td></tr>
                        ) : transactions.slice(0, 5).map((trx) => (
                          <tr key={trx.id} className="group hover:bg-background/50 transition">
                            <td className="py-4 font-semibold text-primary">{trx.category}</td>
                            <td className="py-4 text-muted truncate max-w-37.5">{trx.description || '-'}</td>
                            <td className="py-4 text-muted">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className={`py-4 font-bold text-right ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>
                              {trx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}
                            </td>
                            {/* Tombol Aksi Muncul saat di-Hover */}
                            <td className="py-4 text-center">
                              <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(trx)} className="text-muted hover:text-primary transition font-medium" title="Edit">Edit</button>
                                <button onClick={() => handleDelete(trx.id)} className="text-danger hover:opacity-80 transition font-medium" title="Hapus">Hapus</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm"><DistributionChart data={distributionData} /></div>
                </div>
              </>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: GOALS PLANS (Mockup UI) */}
            {/* ========================================================================= */}
            {activeMenu === 'goals' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-surface border border-border rounded-[20px] p-4 px-6 shadow-sm">
                  <div className="flex gap-4">
                    <button className="text-sm font-bold text-primary border-b-2 border-accent pb-1">All Goals</button>
                    <button className="text-sm font-medium text-muted pb-1">Active</button>
                    <button className="text-sm font-medium text-muted pb-1">Completed</button>
                  </div>
                  <button className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2"><Icons.Plus /> Add Goal</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {dummyGoals.map(goal => {
                    const percentage = Math.round((goal.saved / goal.target) * 100);
                    return (
                      <div key={goal.id} className="bg-surface border border-border rounded-[20px] p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary">{goal.icon}</div>
                            <div>
                              <h4 className="font-bold text-primary">{goal.name}</h4>
                              <p className="text-sm text-primary font-semibold">{formatRupiah(goal.target)}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${goal.status === 'Active' ? 'text-warning bg-warning/10' : 'text-accent bg-accent/10'}`}>{goal.status}</span>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-2"><span className="text-primary">{percentage}%</span><span className="text-muted">{formatRupiah(goal.saved)} Saved</span></div>
                          <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>

                        <p className="text-xs text-muted font-medium">Deadline: {goal.deadline}</p>
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 py-2 bg-background border border-border rounded-lg text-xs font-bold text-primary hover:bg-border transition">Edit</button>
                          <button className="flex-1 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition">+ Add Money</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: WALLET (Mockup UI) */}
            {/* ========================================================================= */}
            {activeMenu === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Kolom Kiri: Kartu Saldo */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-brand text-white border border-brand rounded-[20px] p-6 shadow-xl relative overflow-hidden">
                    <p className="text-sm font-medium text-white/80 flex items-center gap-2"><Icons.Wallet /> Balance</p>
                    <p className="text-4xl font-bold mt-4">{formatRupiah(12500000)}</p>
                    <div className="flex items-center gap-4 mt-6">
                      <span className="flex items-center gap-1 text-xs text-white/80"><span className="w-2 h-2 rounded-full bg-accent"></span> In: {formatRupiah(15000000)}</span>
                      <span className="flex items-center gap-1 text-xs text-white/80"><span className="w-2 h-2 rounded-full bg-danger"></span> Out: {formatRupiah(2500000)}</span>
                    </div>
                    {/* Background Dekoratif */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:bg-background transition group">
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition"><Icons.ArrowDownLeft /></div>
                      <span className="text-xs font-bold text-primary">Deposit</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:bg-background transition group">
                      <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center group-hover:bg-danger group-hover:text-white transition"><Icons.ArrowUpRight /></div>
                      <span className="text-xs font-bold text-primary">Withdraw</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:bg-background transition group">
                      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand dark:text-white flex items-center justify-center group-hover:bg-brand group-hover:text-white transition"><Icons.Send /></div>
                      <span className="text-xs font-bold text-primary">Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Kolom Kanan: History Wallet */}
                <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-primary">Transaction History</h3>
                    <div className="flex text-xs font-medium text-muted gap-4">
                      <span className="flex items-center gap-1 border-b border-accent pb-1 text-primary">Newest</span>
                      <span className="flex items-center gap-1 pb-1">All</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {transactions.slice(0, 8).map(trx => (
                      <div key={trx.id} className="flex justify-between items-center p-4 bg-background border border-border rounded-xl">
                        <div className="flex gap-4 items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'pemasukan' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                            {trx.type === 'pemasukan' ? <Icons.ArrowDownLeft /> : <Icons.ArrowUpRight />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-primary">{trx.category}</p>
                            <p className="text-xs text-muted mt-0.5">{trx.transaction_date.split('T')[0]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>{trx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}</p>
                          <p className="text-xs text-accent mt-0.5 font-medium">Success</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* END OF KONTEN DINAMIS */}

          </div>
        </main>
      </div>

      {/* MOBILE OVERLAY MENU (Jika dibuka) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden flex">
          <div className="w-64 h-full bg-surface border-r border-border p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-primary">CashFlow</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted"><Icons.Search /></button>
            </div>
            <nav className="flex-1 space-y-2">
              <button onClick={() => { setActiveMenu('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'dashboard' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Home /> Dashboard</button>
              <button onClick={() => { setActiveMenu('goals'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'goals' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Target /> Goals Plans</button>
              <button onClick={() => { setActiveMenu('wallet'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'wallet' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Wallet /> Wallet</button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}