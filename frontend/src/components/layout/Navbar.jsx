import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Dumbbell,
  Shield,
  Package,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import Button from '../ui/Button.jsx';
import SubNavbar from './SubNavbar.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import brandLogo from '../../assets/sport market logo.webp';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [cartBouncing, setCartBouncing] = useState(false);
  const [wishlistBouncing, setWishlistBouncing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Close mobile drawer on route navigation during render
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  // Lock body scroll and handle Escape key when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleItemAdded = () => {
      setCartBouncing(true);
      const timer = setTimeout(() => setCartBouncing(false), 900);
      return () => clearTimeout(timer);
    };

    const handleWishlistLanded = () => {
      setWishlistBouncing(true);
      const timer = setTimeout(() => setWishlistBouncing(false), 900);
      return () => clearTimeout(timer);
    };

    window.addEventListener('cart-item-added', handleItemAdded);
    window.addEventListener('wishlist-item-landed', handleWishlistLanded);
    return () => {
      window.removeEventListener('cart-item-added', handleItemAdded);
      window.removeEventListener('wishlist-item-landed', handleWishlistLanded);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) =>
    `font-sans text-base font-semibold transition-colors duration-200 ${
      isActive ? 'text-brand-accent' : 'text-text-muted hover:text-text-primary'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <img
            src={brandLogo}
            alt="SportMarket"
            className="h-7 sm:h-8 w-auto object-contain rounded bg-white px-1 shadow-xs shrink-0"
          />
          <span className="font-display uppercase text-lg sm:text-2xl tracking-tight text-text-primary">
            Sport<span className="text-brand-accent">Market</span>
          </span>
        </Link>

        {/* Desktop Centre links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/catalog" className={linkClass}>Catalog</NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <span className="flex items-center gap-1.5">
                <Shield size={14} /> Admin
              </span>
            </NavLink>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
          {/* Wishlist Icon (with count badge) */}
          <NavLink
            to="/wishlist"
            id="nav-wishlist-btn"
            className={`relative text-text-muted hover:text-text-primary transition-all p-1.5 rounded-full hover:bg-brand-surface shrink-0 ${
              wishlistBouncing ? 'scale-110 text-brand-accent' : ''
            }`}
            title="Wishlist"
            aria-label={`Wishlist, ${wishlistCount} items`}
          >
            <Heart
              size={20}
              className={`transition-all duration-300 ${
                wishlistBouncing
                  ? 'animate-bounce fill-brand-accent text-brand-accent scale-110'
                  : wishlistCount > 0
                    ? 'fill-brand-accent/25 text-brand-accent'
                    : ''
              }`}
            />
            {wishlistCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-accent text-white text-[10px] font-black flex items-center justify-center shadow-md transition-all duration-300 ${
                  wishlistBouncing
                    ? 'scale-125 ring-2 ring-brand-accent/50'
                    : 'scale-100'
                }`}
              >
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </NavLink>

          {/* Cart Icon (with count badge) */}
          <NavLink
            to="/cart"
            id="nav-cart-btn"
            className={`relative text-text-muted hover:text-text-primary transition-all p-1.5 rounded-full hover:bg-brand-surface shrink-0 ${
              cartBouncing ? 'scale-110 text-brand-accent' : ''
            }`}
            title="Cart"
          >
            <ShoppingCart size={20} className={cartBouncing ? 'animate-bounce' : ''} />
            {cartCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-accent text-white text-[10px] font-black flex items-center justify-center shadow-md transition-all duration-300 ${
                  cartBouncing ? 'scale-125 ring-2 ring-brand-accent/50' : 'scale-100'
                }`}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>

          {/* Theme Toggle (Dark / Light mode) - hidden on mobile, placed inside drawer header on mobile */}
          <ThemeToggle className="hidden sm:inline-flex shrink-0" />

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3.5">
            <div className="h-5 w-px bg-brand-border" />

            {isAuthenticated ? (
              <>
                <NavLink to="/orders" className={linkClass} title="My Orders">
                  <Package size={20} />
                </NavLink>
                <NavLink to="/orders" className={linkClass} title={user?.name ?? 'Profile'}>
                  <User size={20} />
                </NavLink>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="text-text-muted hover:text-brand-accent transition-colors duration-200 cursor-pointer"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Three-Dash Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden shrink-0 p-1.5 sm:p-2 text-text-primary hover:text-brand-accent hover:bg-brand-surface rounded-lg border border-brand-border/80 transition-colors cursor-pointer"
            title="Open menu"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
          </button>
        </div>

      </nav>

      {/* Mobile Drawer & Overlay Portalled to document.body */}
      {mobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999] md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar Drawer */}
            <aside
              className="fixed top-0 right-0 bottom-0 w-[290px] max-w-[85vw] h-dvh bg-brand-surface border-l border-brand-border shadow-2xl flex flex-col z-[1000] animate-slide-in-right"
              aria-label="Mobile navigation sidebar"
            >
            {/* Drawer Header */}
            <div className="h-16 px-4 sm:px-5 border-b border-brand-border flex items-center justify-between shrink-0">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <img
                  src={brandLogo}
                  alt="SportMarket"
                  className="h-7 w-auto object-contain rounded bg-white px-1 shadow-xs"
                />
                <span className="font-display uppercase text-xl tracking-tight text-text-primary">
                  Sport<span className="text-brand-accent">Market</span>
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 sm:p-2 text-text-muted hover:text-text-primary hover:bg-brand-bg rounded-lg transition-colors cursor-pointer"
                  title="Close menu"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between gap-6">
              <div className="space-y-6">
                {/* Account actions for unauthenticated guests */}
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Account
                    </p>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full justify-center">
                        Log in
                      </Button>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <Button variant="primary" className="w-full justify-center">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-1.5">
                 
                  <NavLink
                    to="/catalog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[17px] font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                          : 'text-text-muted hover:text-text-primary hover:bg-brand-bg'
                      }`
                    }
                  >
                    <Dumbbell size={21} />
                    <span>Catalog</span>
                  </NavLink>

                  {isAuthenticated && (
                    <NavLink
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[17px] font-medium transition-colors ${
                          isActive
                            ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                            : 'text-text-muted hover:text-text-primary hover:bg-brand-bg'
                        }`
                      }
                    >
                      <Package size={21} />
                      <span>My Orders</span>
                    </NavLink>
                  )}

                  <NavLink
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-3 rounded-xl text-[17px] font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                          : 'text-text-muted hover:text-text-primary hover:bg-brand-bg'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3.5">
                      <Heart size={21} />
                      <span>Wishlist</span>
                    </div>
                    {wishlistCount > 0 && (
                      <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand-accent text-white text-xs font-bold flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </NavLink>

                  <NavLink
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-3 rounded-xl text-[17px] font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                          : 'text-text-muted hover:text-text-primary hover:bg-brand-bg'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3.5">
                      <ShoppingCart size={21} />
                      <span>Cart</span>
                    </div>
                    {cartCount > 0 && (
                      <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand-accent text-white text-xs font-bold flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </NavLink>

                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[17px] font-medium transition-colors ${
                          isActive
                            ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                            : 'text-text-muted hover:text-text-primary hover:bg-brand-bg'
                        }`
                      }
                    >
                      <Shield size={21} />
                      <span>Admin Portal</span>
                    </NavLink>
                  )}
                </div>
              </div>

              {/* Bottom Profile Footer with Logout icon at the side end */}
              {isAuthenticated && (
                <div className="pt-4 border-t border-brand-border">
                  <div className="p-3 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-brand-accent flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans font-semibold text-sm text-text-primary truncate">
                          {user?.name || user?.email || 'User'}
                        </p>
                        {user?.email && (
                          <p className="font-sans text-xs text-text-muted truncate">
                            {user.email}
                          </p>
                        )}
                        {isAdmin && (
                          <div className="flex gap-1.5 mt-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-accent/15 text-brand-accent">
                              Admin
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Log out"
                      aria-label="Log out"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>,
        document.body
      )}

      {/* Sub Navbar with Categories - excluded on Admin Portal */}
      {!location.pathname.startsWith('/admin') && <SubNavbar />}
    </header>
  );
}
