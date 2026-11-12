import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

/**
 * Root layout shell — wraps every page with the sticky Navbar and Footer.
 * Uses the .antigravity-layout utility from index.css for the base background
 * and text defaults.
 */
export default function Layout({ children }) {
  return (
    <div className="antigravity-layout min-h-screen flex flex-col bg-brand-bg text-text-primary overflow-x-clip">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 min-w-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
