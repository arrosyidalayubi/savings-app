import { useState, useMemo, useEffect, type ChangeEvent, type SyntheticEvent, useRef } from 'react';
import DashboardView from './views/DashboardView';
import type { FilterType, MenuType, Transaction, Goal, ChartSummaryData, UserProfile } from './types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icons } from './components/ui/Icons';
import ThemeToggle from './components/ui/ThemeToggle';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileMenu from './components/layout/MobileMenu';
import WalletView from './views/WalletView';
import GoalsView from './views/GoalsView';
import SettingsView from './views/SettingsView';
import { useTransaction } from './hooks/useTransaction';
import { useGoals } from './hooks/useGoals';

export default function App() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATES ---
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [walletMonth, setWalletMonth] = useState('');

  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [selectedGoalForMoney, setSelectedGoalForMoney] = useState<Goal | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State Khusus Settings/Profil
  const [profileForm, setProfileForm] = useState({ name: '', avatar: '' as string | null });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });

  // --- API HELPER ---
  const getAuthHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('cf_auth_session')}` });

  const { 
  transactions, 
  isLoadingTransactions, 
  submitTransaction, 
  deleteTransaction, 
  formData, 
  setFormData, 
  editingId, 
  setEditingId 
} = useTransaction(filterType, activeMenu, getAuthHeader);

const { 
  goals, 
  isLoadingGoals, 
  setIsGoalModalOpen, 
  setGoalFormData,
  updateGoalProgress, 
  deleteGoal 
} = useGoals(getAuthHeader);

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

  const handleFormSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!formData.amount || !formData.category) return alert("Mohon isi jumlah");
    submitTransaction.mutate({ id: editingId, data: { ...formData, amount: parseFloat(formData.amount) } });
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
    setSelectedGoalForMoney(goal);
    setAddMoneyAmount('');
    setIsAddMoneyModalOpen(true);
  };

  const submitAddMoney = (e: SyntheticEvent) => {
    e.preventDefault();
    if (!selectedGoalForMoney) return;
    
    const amount = parseFloat(addMoneyAmount);
    if (!isNaN(amount) && amount > 0) {
      const newSaved = selectedGoalForMoney.saved_amount + amount;
      updateGoalProgress.mutate({ 
        id: selectedGoalForMoney.id, 
        data: { ...selectedGoalForMoney, saved_amount: newSaved, status: newSaved >= selectedGoalForMoney.target_amount ? 'Completed' : 'Active' } 
      });
      setIsAddMoneyModalOpen(false); // Tutup modal setelah sukses
    } else { 
      alert("Jumlah tidak valid."); 
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
      <Sidebar activeMenu={activeMenu} onChangeMenu={changeMenu} onLogout={handleLogout} />

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <Header activeMenu={activeMenu} onToggleMobileMenu={() => setIsMobileMenuOpen(true)} userProfile={userProfile} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

        {/* KONTEN */}
        {/* KONTEN */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {activeMenu === 'dashboard' && (
              <DashboardView
                filterType={filterType} setFilterType={setFilterType} openGoalModal={openGoalModal}
                isLoadingChart={isLoadingChart} summary={summary} chartData={chartData}
                distributionData={distributionData} editingId={editingId} setEditingId={setEditingId}
                formData={formData} setFormData={setFormData} handleInputChange={handleInputChange}
                handleFormSubmit={handleFormSubmit} submitTransaction={submitTransaction}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} isLoadingTransactions={isLoadingTransactions}
                filteredTransactions={filteredTransactions} startEdit={startEdit} handleDelete={handleDelete}
                formatRupiah={formatRupiah}
              />
            )}

            {activeMenu === 'goals' && (
              <GoalsView 
                goals={goals} isLoadingGoals={isLoadingGoals} openGoalModal={openGoalModal}
                handleDeleteGoal={handleDeleteGoal} handleAddMoney={handleAddMoney} formatRupiah={formatRupiah}
              />
            )}

            {activeMenu === 'wallet' && (
              <WalletView 
                transactions={transactions} walletMonth={walletMonth} setWalletMonth={setWalletMonth}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} formatRupiah={formatRupiah}
                triggerWalletAction={triggerWalletAction}
              />
            )}

            {activeMenu === 'settings' && (
              <SettingsView 
                profileForm={profileForm} setProfileForm={setProfileForm} userProfile={userProfile}
                fileInputRef={fileInputRef} handleImageUpload={handleImageUpload} updateProfile={updateProfile}
                passwordForm={passwordForm} setPasswordForm={setPasswordForm} updatePassword={updatePassword}
              />
            )}

          </div>
        </main>
      </div>

      {/* MODAL POPUP: ADD / EDIT GOAL */}
      {isAddMoneyModalOpen && selectedGoalForMoney && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-[20px] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-primary mb-2">Tambah Uang</h3>
            <p className="text-sm text-muted mb-6">
              Berapa uang yang ingin ditambah ke target <span className="font-bold text-primary">{selectedGoalForMoney.name}</span>?
            </p>
            <form onSubmit={submitAddMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Jumlah Uang (Rp)</label>
                <input 
                  type="number" 
                  value={addMoneyAmount} 
                  onChange={(e) => setAddMoneyAmount(e.target.value)} 
                  placeholder="Contoh: 50000" 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-accent outline-none" 
                  required 
                  autoFocus 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddMoneyModalOpen(false)} className="flex-1 py-3 bg-background border border-border text-muted rounded-xl text-sm font-bold hover:text-primary transition">Batal</button>
                <button type="submit" disabled={updateGoalProgress.isPending} className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-90 transition disabled:opacity-50">
                  {updateGoalProgress.isPending ? 'Menyimpan...' : 'Tambah Uang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE OVERLAY MENU */}
      {isMobileMenuOpen && (
  <MobileMenu activeMenu={activeMenu} onChangeMenu={changeMenu} onClose={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />)}
    </div>
  );
}