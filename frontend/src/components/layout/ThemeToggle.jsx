import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-surface border border-transparent hover:border-brand-border transition-all duration-200 cursor-pointer ${className}`}
    >
      <div className="relative size-5 flex items-center justify-center">
        {isDark ? (
          <Sun
            size={18}
            className="text-amber-400 group-hover:text-amber-300 group-hover:rotate-45 transition-transform duration-300"
          />
        ) : (
          <Moon
            size={18}
            className="text-slate-700 group-hover:text-slate-900 group-hover:-rotate-12 transition-transform duration-300"
          />
        )}
      </div>
    </button>
  );
}
