import ThemeToggle from '../ui/ThemeToggle';

type MenuType = 'dashboard' | 'goals' | 'wallet' | 'settings';

interface HeaderProps {
  activeMenu: MenuType;
  onToggleMobileMenu: () => void;
  userProfile: { name: string; avatar: string | null } | undefined;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function Header({ activeMenu, onToggleMobileMenu, userProfile, isDarkMode, setIsDarkMode }: HeaderProps) {
  return (
    <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-6 lg:px-8 transition-colors duration-300 shrink-0">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-muted" onClick={onToggleMobileMenu}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h1 className="text-xl lg:text-2xl font-bold text-primary capitalize">{activeMenu === 'goals' ? 'Target Plans' : activeMenu}</h1>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        
        {userProfile?.avatar ? (
          <img src={userProfile.avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-border shadow-sm ml-2" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-sm ml-2">
            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </header>
  );
}