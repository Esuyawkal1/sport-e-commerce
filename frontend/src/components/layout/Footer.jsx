import { Link } from 'react-router-dom';
import brandLogo from '../../assets/sport market logo.webp';

export default function Footer() {
  return (
    <footer className="border-t border-brand-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted text-sm">
        <div className="flex items-center gap-2.5">
          <img
            src={brandLogo}
            alt="SportMarket"
            className="h-6 w-auto object-contain rounded bg-white px-1 shadow-xs"
          />
          <span>
            Sport<span className="text-brand-accent">Market</span> &copy; {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex gap-5">
          <Link to="/catalog" className="hover:text-text-primary transition-colors">Catalog</Link>
          <Link to="/login"   className="hover:text-text-primary transition-colors">Log in</Link>
          <Link to="/register" className="hover:text-text-primary transition-colors">Register</Link>
        </div>
      </div>
    </footer>
  );
}
