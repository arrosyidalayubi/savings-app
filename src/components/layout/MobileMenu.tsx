import { Icons } from '../ui/Icons';

type MenuType = 'dashboard' | 'goals' | 'wallet' | 'settings';

interface MobileMenuProps {
  activeMenu: MenuType;
  onChangeMenu: (menu: MenuType) => void;
  onClose: () => void;
  onLogout: () => void;
}

export default function MobileMenu({ activeMenu, onChangeMenu, onClose, onLogout }: MobileMenuProps) {
  return (
    <div className="fixed inset-0 z-60 lg:hidden flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="w-64 h-full bg-surface border-r border-border p-6 flex flex-col relative animate-in slide-in-from-left duration-200">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xl font-bold text-primary">CashFlow</span>
          <button onClick={onClose} className="text-muted"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => { onChangeMenu('dashboard'); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'dashboard' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Home /> Dashboard</button>
          <button onClick={() => { onChangeMenu('goals'); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'goals' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Target /> Target</button>
          <button onClick={() => { onChangeMenu('wallet'); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'wallet' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Wallet /> Dompet</button>
          <button onClick={() => { onChangeMenu('settings'); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${activeMenu === 'settings' ? 'bg-accent text-white' : 'text-muted'}`}><Icons.Settings /> Pengaturan</button>
        </nav>
        
        <div className="pt-6 border-t border-border">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl font-medium transition"><Icons.Logout /> Keluar</button>
        </div>
      </div>
    </div>
  );
}