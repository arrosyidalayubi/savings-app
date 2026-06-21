import { useState, useMemo, useEffect, type ChangeEvent, type SyntheticEvent, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WaveChart from './components/WaveChart';
import DistributionChart from './components/DistributionChart';

type FilterType = 'harian' | 'bulanan' | 'tahunan';
type MenuType = 'dashboard' | 'goals' | 'wallet' | 'settings';

interface Transaction { id: number; type: 'pemasukan' | 'pengeluaran'; amount: number; category: string; description: string; transaction_date: string; }
interface Goal { id: number; name: string; target_amount: number; saved_amount: number; deadline: string; icon: string; status: 'Active' | 'Completed'; }
interface ChartSummaryData { date: string; pemasukan: number; pengeluaran: number; selisih: number; }
interface TransactionFormData { type: 'pemasukan' | 'pengeluaran'; amount: string; category: string; description: string; transaction_date: string; }
interface GoalFormData { id: number | null; name: string; target_amount: string; saved_amount: number; deadline: string; icon: string; status: 'Active' | 'Completed'; }
interface UserProfile { name: string; email: string; avatar: string | null; }

// Kumpulan Ikon Lengkap
const Icons = {
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Laptop: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>,
  Car: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ArrowUpRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  ArrowDownLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>,
  Send: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
};

interface ThemeToggleProps { isDarkMode: boolean; setIsDarkMode: (value: boolean) => void; }

function ThemeToggle({ isDarkMode, setIsDarkMode }: ThemeToggleProps) {
  return (
    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-muted hover:text-accent transition-colors" title="Toggle Dark Mode">
      {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
    </button>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATES ---
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Autentikasi berbasis Token
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('cf_auth_session') !== null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [filterType, setFilterType] = useState<FilterType>('bulanan');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0]
  });

  // State Khusus Modal Goals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalFormData, setGoalFormData] = useState<GoalFormData>({ 
    id: null, name: '', target_amount: '', saved_amount: 0, deadline: '', icon: 'Target', status: 'Active' 
  });

  // State Khusus Settings/Profil
  const [profileForm, setProfileForm] = useState({ name: '', avatar: '' as string | null });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });

  // --- API HELPER ---
  const getAuthHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('cf_auth_session')}` });

  // --- QUERIES (FETCH DATA) ---
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => { const res = await fetch('/api/profile', { headers: getAuthHeader() }); const json = await res.json(); return json.data; },
    enabled: isAuthenticated
  });

  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<ChartSummaryData[]>({
    queryKey: ['summary', filterType], 
    queryFn: async () => { const res = await fetch(`/api/summary?type=${filterType}`, { headers: getAuthHeader() }); const json = await res.json(); return json.data; }, 
    enabled: isAuthenticated
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', filterType], 
    queryFn: async () => { const res = await fetch(`/api/transactions?filter=${filterType}`, { headers: getAuthHeader() }); const json = await res.json(); return json.data; }, 
    enabled: isAuthenticated
  });

  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: ['goals'], 
    queryFn: async () => { const res = await fetch(`/api/goals`, { headers: getAuthHeader() }); const json = await res.json(); return json.data || []; }, 
    enabled: isAuthenticated
  });

  // Sinkronisasi data profil ke form saat data berhasil dimuat
  useEffect(() => {
    if (userProfile) {
      const syncData = setTimeout(() => {
        setProfileForm({ name: userProfile.name, avatar: userProfile.avatar });
      }, 0);
      return () => clearTimeout(syncData);
    }
  }, [userProfile]);

  // --- MUTATIONS ---
  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      const data = await res.json();
      if (data.success) { setIsAuthenticated(true); localStorage.setItem('cf_auth_session', data.token); } 
      else { alert(data.message || "Login Gagal: Email atau Password salah!"); }
    } catch { alert("Terjadi kesalahan jaringan."); }
  };

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('cf_auth_session'); queryClient.clear(); };

  const submitTransaction = useMutation({
    mutationFn: async (payload: { id: number | null, data: Omit<Transaction, 'id'> }) => {
      const isEdit = payload.id !== null;
      const res = await fetch(isEdit ? `/api/transactions/${payload.id}` : '/api/transactions', { 
        method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(payload.data) 
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
    mutationFn: async (id: number) => { const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers: getAuthHeader() }); return await res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['summary'] }); queryClient.invalidateQueries({ queryKey: ['transactions'] }); }
  });

  const submitGoal = useMutation({
    mutationFn: async (payload: { id: number | null, data: Omit<Goal, 'id'> }) => {
      const isEdit = payload.id !== null;
      const res = await fetch(isEdit ? `/api/goals/${payload.id}` : '/api/goals', { 
        method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(payload.data) 
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsGoalModalOpen(false);
      setGoalFormData({ id: null, name: '', target_amount: '', saved_amount: 0, deadline: '', icon: 'Target', status: 'Active' });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const updateGoalProgress = useMutation({
    mutationFn: async (payload: { id: number, data: Goal }) => {
      const res = await fetch(`/api/goals/${payload.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(payload.data) });
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: number) => { const res = await fetch(`/api/goals/${id}`, { method: 'DELETE', headers: getAuthHeader() }); return await res.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string, avatar: string | null }) => {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message);
      return json;
    },
    onSuccess: () => { alert('Profil berhasil diperbarui!'); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
    onError: (err: Error) => alert(err.message)
  });

  const updatePassword = useMutation({
    mutationFn: async (data: typeof passwordForm) => { // <--- UBAH any MENJADI typeof passwordForm DI SINI
      const res = await fetch('/api/password', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message);
      return json;
    },
    onSuccess: () => { alert('Password berhasil diubah!'); setPasswordForm({ old_password: '', new_password: '' }); },
    onError: (err: Error) => alert(err.message)
  });

  // --- DERIVED STATE (KALKULASI OTOMATIS) ---
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

  // Fitur Pencarian Lokal
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const lowerQ = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.category.toLowerCase().includes(lowerQ) || 
      (t.description && t.description.toLowerCase().includes(lowerQ))
    );
  }, [transactions, searchQuery]);

  // --- HANDLERS ---
  const changeMenu = (menu: MenuType) => { 
    setActiveMenu(menu); 
    setIsMobileMenuOpen(false); 
    setSearchQuery(''); // Reset pencarian saat pindah menu
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleGoalInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setGoalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!formData.amount || !formData.category) return alert("Mohon isi jumlah");
    submitTransaction.mutate({ id: editingId, data: { ...formData, amount: parseFloat(formData.amount) } });
  };
  const handleGoalSubmit = (e: SyntheticEvent) => {
    e.preventDefault(); if (!goalFormData.name || !goalFormData.target_amount) return alert("Mohon isi Nama & Target");
    submitGoal.mutate({ id: goalFormData.id, data: { ...goalFormData, target_amount: parseFloat(goalFormData.target_amount) } });
  };

  const startEdit = (trx: Transaction) => {
    setEditingId(trx.id);
    setFormData({ type: trx.type, amount: trx.amount.toString(), category: trx.category, description: trx.description || '', transaction_date: trx.transaction_date.split('T')[0] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) { deleteTransaction.mutate(id); }
  };

  const openGoalModal = (goal?: Goal) => {
    if (goal) {
      setGoalFormData({ id: goal.id, name: goal.name, target_amount: goal.target_amount.toString(), saved_amount: goal.saved_amount, deadline: goal.deadline, icon: goal.icon, status: goal.status });
    } else {
      setGoalFormData({ id: null, name: '', target_amount: '', saved_amount: 0, deadline: new Date().toISOString().split('T')[0], icon: 'Target', status: 'Active' });
    }
    setIsGoalModalOpen(true);
  };
  const handleAddMoney = (goal: Goal) => {
    const amountStr = window.prompt(`Berapa uang yang ingin ditambah ke target '${goal.name}'?`);
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        const newSaved = goal.saved_amount + amount;
        updateGoalProgress.mutate({ id: goal.id, data: { ...goal, saved_amount: newSaved, status: newSaved >= goal.target_amount ? 'Completed' : 'Active' } });
      } else { alert("Jumlah tidak valid."); }
    }
  };
  const handleDeleteGoal = (id: number) => {
    if (window.confirm("Hapus Goal ini beserta riwayat tabungannya?")) { deleteGoal.mutate(id); }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) return alert("Ukuran gambar terlalu besar! Maksimal 1MB.");
      const reader = new FileReader();
      reader.onloadend = () => setProfileForm({ ...profileForm, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const triggerWalletAction = (type: 'pemasukan' | 'pengeluaran') => {
    setActiveMenu('dashboard');
    setFormData(prev => ({ ...prev, type, category: '' }));
  };

  const formatRupiah = (num: number): string => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  // --- LAYAR LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 transition-colors duration-300">
        <div className="absolute top-6 right-6">
          <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </div>
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

  // --- LAYAR UTAMA ---
  return (
    <div className="flex h-screen w-full bg-background text-primary font-sans overflow-hidden transition-colors duration-300 relative">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border transition-colors duration-300">
        <div className="h-20 flex items-center px-6 gap-3 border-b border-transparent">
          <div className="text-accent"><Icons.Target /></div>
          <span className="text-xl font-bold tracking-tight text-primary">CashFlow</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => changeMenu('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'dashboard' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Home /> Dashboard</button>
          <button onClick={() => changeMenu('goals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'goals' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Target /> Target</button>
          <button onClick={() => changeMenu('wallet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'wallet' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Wallet /> Dompet</button>
          <button onClick={() => changeMenu('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'settings' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Settings /> Pengaturan</button>
        </nav>

        <div className="p-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl font-medium transition"><Icons.Logout /> Keluar</button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-6 lg:px-8 transition-colors duration-300 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-primary capitalize">{activeMenu === 'goals' ? 'Goals Plans' : activeMenu}</h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            
            {/* Foto Profil Dinamis dari Database */}
            {userProfile?.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover border border-border shadow-sm ml-2" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-sm ml-2">
                {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </header>

        {/* KONTEN */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* VIEW 1: DASHBOARD */}
            {activeMenu === 'dashboard' && (
              <>
                <div className="flex items-center justify-between pb-2 gap-2">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
                      <button key={type} onClick={() => setFilterType(type)} className={`px-5 py-2 text-sm font-semibold rounded-full capitalize transition-all ${filterType === type ? 'bg-accent text-white shadow-md' : 'bg-surface border border-border text-muted hover:text-primary'}`}>{type}</button>
                    ))}
                  </div>
                  <button onClick={() => openGoalModal()} className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg shadow-md hover:opacity-90 flex items-center gap-2 shrink-0">
                    <Icons.Plus /> <span className="hidden sm:inline">Tambah Target</span>
                  </button>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-primary">Analisis</h3></div>
                    <div className="flex-1 w-full min-h-62.5"><WaveChart data={chartData} loading={isLoadingChart} filterType={filterType} /></div>
                  </div>

                  <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-6">{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 bg-background p-1.5 rounded-xl border border-border">
                        <button type="button" onClick={() => setFormData({ ...formData, type: 'pemasukan', category: '' })} className={`py-2 text-sm font-semibold rounded-lg ${formData.type === 'pemasukan' ? 'bg-surface text-accent shadow-sm' : 'text-muted'}`}>Masuk</button>
                        <button type="button" onClick={() => setFormData({ ...formData, type: 'pengeluaran', category: '' })} className={`py-2 text-sm font-semibold rounded-lg ${formData.type === 'pengeluaran' ? 'bg-surface text-danger shadow-sm' : 'text-muted'}`}>Keluar</button>
                      </div>
                      <div><input type="number" name="amount" placeholder="Jumlah Uang" value={formData.amount} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent outline-none" required /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none appearance-none" required>
                          <option value="" disabled>Kategori...</option>
                          {formData.type === 'pemasukan' ? (
                            <>
                              <option value="Gaji">Gaji</option>
                              <option value="Freelance">Freelance</option>
                              {/* Tambahan kategori Lainnya untuk Pemasukan */}
                              <option value="Lainnya">Lainnya</option> 
                            </>
                          ) : (
                            <>
                              <option value="Makanan">Makanan</option>
                              <option value="Transportasi">Transport</option>
                              {/* Tambahan kategori Lainnya untuk Pengeluaran */}
                              <option value="Lainnya">Lainnya</option> 
                            </>
                          )}
                        </select>
                        <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none" required />
                      </div>
                      
                      {/* Opsional: Membuat Keterangan menjadi Wajib (required) jika pengguna memilih "Lainnya" */}
                      <div>
                        <input type="text" name="description" placeholder="Keterangan..." value={formData.description} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent outline-none" required={formData.category === 'Lainnya'} />
                        {formData.category === 'Lainnya' && !formData.description.trim() && (
                          <p className="text-[11px] text-danger mt-1.5 ml-1 font-medium animate-in slide-in-from-top-1">
                            * Silakan sebutkan rincian untuk kategori Lainnya
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] }); }} className="flex-1 py-2.5 bg-background border border-border text-muted rounded-lg text-sm font-semibold">Batal</button>}
                        <button type="submit" disabled={submitTransaction.isPending} className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold shadow-md">{submitTransaction.isPending ? 'Loading...' : 'Simpan'}</button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-primary">Aktivitas Terkini</h3>
                      <div className="flex items-center bg-background border border-border rounded-lg px-3 py-1.5 w-48">
                        <span className="text-muted mr-2"><Icons.Search /></span>
                        <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent outline-none text-xs w-full text-primary" />
                      </div>
                    </div>

                    {/* Tampilan Desktop: Tetap Tabel */}
                    <div className="hidden lg:block overflow-x-auto">
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
                          ) : filteredTransactions.length === 0 ? (
                            <tr><td colSpan={5} className="py-6 text-center text-muted">Data tidak ditemukan.</td></tr>
                          ) : filteredTransactions.slice(0, 5).map((trx) => (
                            <tr key={trx.id} className="group hover:bg-background/50 transition">
                              <td className="py-4 font-semibold text-primary">{trx.category}</td>
                              <td className="py-4 text-muted truncate max-w-37.5">{trx.description || '-'}</td>
                              <td className="py-4 text-muted">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td className={`py-4 font-bold text-right ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>
                                {trx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}
                              </td>
                              <td className="py-4 text-center">
                                <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(trx)} className="text-muted hover:text-primary transition font-medium">Edit</button>
                                  <button onClick={() => handleDelete(trx.id)} className="text-danger hover:opacity-80 transition font-medium">Hapus</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tampilan Mobile: Kartu yang Rapi */}
                    <div className="lg:hidden flex flex-col gap-3">
                      {isLoadingTransactions ? (
                        <div className="py-6 text-center text-muted text-sm">Memuat data...</div>
                      ) : filteredTransactions.length === 0 ? (
                        <div className="py-6 text-center text-muted text-sm">Data tidak ditemukan.</div>
                      ) : filteredTransactions.slice(0, 5).map((trx) => (
                        <div key={trx.id} className="bg-background border border-border p-4 rounded-xl flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                              <p className="font-bold text-sm text-primary">{trx.category}</p>
                              <p className="text-[10px] text-muted">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <p className="text-xs text-muted wrap-break-word leading-relaxed">{trx.description || '-'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <p className={`font-bold text-sm ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>
                              {trx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}
                            </p>
                            <div className="flex gap-2">
                              <button onClick={() => startEdit(trx)} className="text-[10px] text-muted hover:text-primary underline">Edit</button>
                              <button onClick={() => handleDelete(trx.id)} className="text-[10px] text-danger hover:opacity-80 underline">Hapus</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
                    <DistributionChart data={distributionData} />
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: GOALS PLANS */}
            {activeMenu === 'goals' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-surface border border-border rounded-[20px] p-4 px-6 shadow-sm overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    <button className="text-sm font-bold text-primary border-b-2 border-accent pb-1">Semua Target ({goals.length})</button>
                    <button className="text-sm font-medium text-muted pb-1">Active ({goals.filter(g => g.status === 'Active').length})</button>
                    <button className="text-sm font-medium text-muted pb-1">Completed ({goals.filter(g => g.status === 'Completed').length})</button>
                  </div>
                  <button onClick={() => openGoalModal()} className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 min-w-max ml-4"><Icons.Plus /> Tambah Target</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {isLoadingGoals ? (
                    <div className="col-span-full py-12 text-center text-muted font-medium">Memuat data tabungan...</div>
                  ) : goals.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted font-medium border border-dashed border-border rounded-[20px]">Belum ada Target tabungan yang dibuat.</div>
                  ) : goals.map(goal => {
                    const percentage = Math.min(Math.round((goal.saved_amount / goal.target_amount) * 100), 100);
                    return (
                      <div key={goal.id} className="bg-surface border border-border rounded-[20px] p-6 shadow-sm flex flex-col gap-4 relative group">
                        <button onClick={() => handleDeleteGoal(goal.id)} className="absolute top-4 right-4 p-1.5 text-danger opacity-0 group-hover:opacity-100 bg-danger/10 rounded-lg transition" title="Hapus Goal"><Icons.Search /></button>
                        
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary">
                              {goal.icon === 'Laptop' ? <Icons.Laptop /> : goal.icon === 'Car' ? <Icons.Car /> : <Icons.Target />}
                            </div>
                            <div>
                              <h4 className="font-bold text-primary">{goal.name}</h4>
                              <p className="text-sm text-primary font-semibold">{formatRupiah(goal.target_amount)}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${goal.status === 'Active' ? 'text-warning bg-warning/10' : 'text-accent bg-accent/10'}`}>{goal.status}</span>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-2"><span className="text-primary">{percentage}%</span><span className="text-muted">{formatRupiah(goal.saved_amount)} Saved</span></div>
                          <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
                            <div className={`h-full rounded-full transition-all duration-500 ${goal.status === 'Completed' ? 'bg-accent' : 'bg-warning'}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>

                        <p className="text-xs text-muted font-medium">Deadline: {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => openGoalModal(goal)} className="flex-1 py-2 bg-background border border-border rounded-lg text-xs font-bold text-primary hover:bg-border transition">Edit</button>
                          <button onClick={() => handleAddMoney(goal)} disabled={goal.status === 'Completed'} className="flex-1 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:opacity-90 transition disabled:opacity-50">+ Add Money</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: WALLET */}
            {activeMenu === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-brand text-white border border-brand rounded-[20px] p-6 shadow-xl relative overflow-hidden">
                    <p className="text-sm font-medium text-white/80 flex items-center gap-2"><Icons.Wallet /> Saldo</p>
                    <p className="text-4xl font-bold mt-4">{formatRupiah(summary.selisih)}</p>
                    <div className="flex items-center gap-4 mt-6">
                      <span className="flex items-center gap-1 text-xs text-white/80"><span className="w-2 h-2 rounded-full bg-accent"></span> In: {formatRupiah(summary.pemasukan)}</span>
                      <span className="flex items-center gap-1 text-xs text-white/80"><span className="w-2 h-2 rounded-full bg-danger"></span> Out: {formatRupiah(summary.pengeluaran)}</span>
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => triggerWalletAction('pemasukan')} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:bg-background transition group">
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition"><Icons.ArrowDownLeft /></div>
                      <span className="text-xs font-bold text-primary">Deposit</span>
                    </button>
                    <button onClick={() => triggerWalletAction('pengeluaran')} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:bg-background transition group">
                      <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center group-hover:bg-danger group-hover:text-white transition"><Icons.ArrowUpRight /></div>
                      <span className="text-xs font-bold text-primary">Withdraw</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:bg-background transition group">
                      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand dark:text-white flex items-center justify-center group-hover:bg-brand group-hover:text-white transition"><Icons.Send /></div>
                      <span className="text-xs font-bold text-primary">Transfer</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-primary">Riwayat Transaksi</h3>
                    <div className="flex items-center bg-background border border-border rounded-lg px-3 py-1.5 w-48">
                      <span className="text-muted mr-2"><Icons.Search /></span>
                      <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent outline-none text-xs w-full text-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {isLoadingTransactions ? (
                       <div className="text-center py-8 text-muted">Memuat data dompet...</div>
                    ) : filteredTransactions.length === 0 ? (
                       <div className="text-center py-8 text-muted">Data tidak ditemukan.</div>
                    ) : filteredTransactions.map(trx => (
                      <div key={trx.id} className="flex justify-between items-center p-4 bg-background border border-border rounded-xl hover:border-accent transition-colors">
                        <div className="flex gap-4 items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'pemasukan' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                            {trx.type === 'pemasukan' ? <Icons.ArrowDownLeft /> : <Icons.ArrowUpRight />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-primary">{trx.category}</p>
                            <p className="text-xs text-muted mt-0.5">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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

            {/* VIEW 4: SETTINGS (PROFIL & PASSWORD) */}
            {activeMenu === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Form Update Profil */}
                <div className="bg-surface border border-border rounded-[20px] p-6 lg:p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-primary mb-6">Pengaturan Profil</h3>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-sm">
                          {profileForm.avatar ? (
                            <img src={profileForm.avatar} className="w-full h-full object-cover" alt="Profile" />
                          ) : (
                            <div className="w-full h-full bg-accent text-white flex items-center justify-center text-3xl font-bold">{profileForm.name?.charAt(0).toUpperCase() || 'U'}</div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white"><Icons.Camera /></span>
                        </div>
                      </div>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                      <span className="text-xs font-semibold text-muted">Click to change</span>
                    </div>
                    
                    {/* Input Nama & Email */}
                    <div className="flex-1 w-full space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Nama Lengkap</label>
                        <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Email (Tidak bisa diubah)</label>
                        <input type="email" value={userProfile?.email || ''} disabled className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-muted outline-none cursor-not-allowed opacity-70" />
                      </div>
                      <button onClick={() => updateProfile.mutate(profileForm)} disabled={updateProfile.isPending} className="px-6 py-2.5 bg-accent text-white font-bold rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50">
                        {updateProfile.isPending ? 'Menyimpan...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Ganti Password */}
                <div className="bg-surface border border-border rounded-[20px] p-6 lg:p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-primary mb-6">Ganti Password</h3>
                  <form onSubmit={(e) => { e.preventDefault(); updatePassword.mutate(passwordForm); }} className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-1.5">Password Lama</label>
                      <input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-1.5">Password Baru</label>
                      <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent" required />
                    </div>
                    <button type="submit" disabled={updatePassword.isPending} className="px-6 py-2.5 bg-brand text-white font-bold rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50">
                      {updatePassword.isPending ? 'Memproses...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* MODAL POPUP: ADD / EDIT GOAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-[20px] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-primary mb-6">{goalFormData.id ? 'Sunting Target' : 'Buat Target Baru'}</h3>
            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Nama Target</label>
                  <input type="text" name="name" value={goalFormData.name} onChange={handleGoalInputChange} placeholder="e.g. New Laptop" className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-accent outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Jumlah Target (Rp)</label>
                  <input type="number" name="target_amount" value={goalFormData.target_amount} onChange={handleGoalInputChange} placeholder="15000000" className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-accent outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Deadline</label>
                  <input type="date" name="deadline" value={goalFormData.deadline} onChange={handleGoalInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:border-accent outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Kategori</label>
                  <select name="icon" value={goalFormData.icon} onChange={handleGoalInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:border-accent outline-none appearance-none">
                    <option value="Target">Target (Umum)</option>
                    <option value="Laptop">Laptop (Gadget)</option>
                    <option value="Car">Car (Kendaraan)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsGoalModalOpen(false)} className="flex-1 py-3 bg-background border border-border text-muted rounded-xl text-sm font-bold hover:text-primary transition">Cancel</button>
                <button type="submit" disabled={submitGoal.isPending} className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-90 transition disabled:opacity-50">
                  {submitGoal.isPending ? 'Saving...' : (goalFormData.id ? 'Save Changes' : '+ Create Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE OVERLAY MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* AREA KLIK DILUAR UNTUK MENUTUP */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          {/* SIDEBAR MOBILE */}
          <div className="w-64 h-full bg-surface border-r border-border p-6 flex flex-col relative animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-primary">CashFlow</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <nav className="flex-1 space-y-2">
              <button onClick={() => changeMenu('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'dashboard' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Home /> Dashboard</button>
              <button onClick={() => changeMenu('goals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'goals' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Target /> Target</button>
              <button onClick={() => changeMenu('wallet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'wallet' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Wallet /> Dompet</button>
              <button onClick={() => changeMenu('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'settings' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Settings /> Pengaturan</button>
            </nav>
            
            {/* TAMBAHAN: TOMBOL LOGOUT UNTUK MOBILE */}
            <div className="pt-6 border-t border-border">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl font-medium transition"><Icons.Logout /> Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}