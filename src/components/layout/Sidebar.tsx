import { Icons } from '../ui/Icons';

type MenuType = 'dashboard' | 'goals' | 'wallet' | 'settings';

interface SidebarProps {
  activeMenu: MenuType;
  onChangeMenu: (menu: MenuType) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeMenu, onChangeMenu, onLogout }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border transition-colors duration-300">
      <div className="h-20 flex items-center px-6 gap-3 border-b border-transparent">
        <div className="text-accent"><Icons.Target /></div>
        <span className="text-xl font-bold tracking-tight text-primary">CashFlow</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button onClick={() => onChangeMenu('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'dashboard' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Home /> Dashboard</button>
        <button onClick={() => onChangeMenu('goals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'goals' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Target /> Target</button>
        <button onClick={() => onChangeMenu('wallet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'wallet' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Wallet /> Dompet</button>
        <button onClick={() => onChangeMenu('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeMenu === 'settings' ? 'bg-accent text-white shadow-md shadow-accent/10' : 'text-muted hover:text-primary hover:bg-background'}`}><Icons.Settings /> Pengaturan</button>
      </nav>

      <div className="p-4">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl font-medium transition"><Icons.Logout /> Keluar</button>
      </div>
    </aside>
  );
}