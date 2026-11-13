import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

/**
 * Root layout shell — wraps every page with the sticky Navbar and Footer.
 * Uses the .antigravity-layout utility from index.css for the base background
 * and text defaults. Dynamically accommodates admin dashboard layouts.
 */
export default function Layout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="antigravity-layout min-h-screen flex flex-col bg-brand-bg text-text-primary overflow-x-clip">
      <Navbar />
      <main
        className={`flex-1 w-full mx-auto py-6 min-w-0 ${
          isAdminRoute
            ? 'max-w-[1536px] px-3 sm:px-6 lg:px-8'
            : 'max-w-7xl px-4 sm:px-6'
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
