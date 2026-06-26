import { Icons } from './Icons';

interface ThemeToggleProps { 
  isDarkMode: boolean; 
  setIsDarkMode: (value: boolean) => void; 
}

export default function ThemeToggle({ isDarkMode, setIsDarkMode }: ThemeToggleProps) {
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