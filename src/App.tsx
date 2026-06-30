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
import { useTransaction } from './hooks/useTransaction';
import { useGoals } from './hooks/useGoals';

export default function App() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATES ---
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [walletMonth, setWalletMonth] = useState('');

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
  isGoalModalOpen, 
  setIsGoalModalOpen, 
  goalFormData, 
  setGoalFormData, 
  submitGoal, 
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
      <Sidebar activeMenu={activeMenu} onChangeMenu={changeMenu} onLogout={handleLogout} />

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <Header activeMenu={activeMenu} onToggleMobileMenu={() => setIsMobileMenuOpen(true)} userProfile={userProfile} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

        {/* KONTEN */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* VIEW 1: DASHBOARD */}
            {activeMenu === 'dashboard' && (
              <DashboardView
                filterType={filterType}
                setFilterType={setFilterType}
                openGoalModal={openGoalModal}
                isLoadingChart={isLoadingChart}
                summary={summary}
                chartData={chartData}
                distributionData={distributionData}
                editingId={editingId}
                setEditingId={setEditingId}
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
                handleFormSubmit={handleFormSubmit}
                submitTransaction={submitTransaction}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isLoadingTransactions={isLoadingTransactions}
                filteredTransactions={filteredTransactions}
                startEdit={startEdit}
                handleDelete={handleDelete}
                formatRupiah={formatRupiah}
              />
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
              <WalletView 
              summary={summary}
              transactions={transactions}
              walletMonth={walletMonth}
              setWalletMonth={setWalletMonth}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              formatRupiah={formatRupiah}
              triggerWalletAction={triggerWalletAction}
              />
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
  <MobileMenu activeMenu={activeMenu} onChangeMenu={changeMenu} onClose={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />)}
    </div>
  );
}