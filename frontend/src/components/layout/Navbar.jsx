import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Dumbbell,
  LayoutDashboard,
  Shield,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import Button from '../ui/Button.jsx';
import SubNavbar from './SubNavbar.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar() {
  const { isAuthenticated, isAdmin, isVendor, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [cartBouncing, setCartBouncing] = useState(false);
  const [wishlistBouncing, setWishlistBouncing] = useState(false);

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
    `font-sans text-sm font-semibold transition-colors duration-200 ${
      isActive ? 'text-brand-accent' : 'text-text-muted hover:text-text-primary'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Dumbbell className="text-brand-accent" size={24} />
          <span className="font-display uppercase text-2xl tracking-tight text-text-primary">
            Sport<span className="text-brand-accent">Market</span>
          </span>
        </Link>

        {/* Centre links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/catalog" className={linkClass}>Catalog</NavLink>
          {isVendor && (
            <NavLink to="/vendor/dashboard" className={linkClass}>
              <span className="flex items-center gap-1.5">
                <LayoutDashboard size={14} /> Vendor
              </span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/categories" className={linkClass}>
              <span className="flex items-center gap-1.5">
                <Shield size={14} /> Admin
              </span>
            </NavLink>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Wishlist Icon (with count badge) */}
          <NavLink
            to="/wishlist"
            id="nav-wishlist-btn"
            className={`relative text-text-muted hover:text-text-primary transition-all p-1.5 rounded-full hover:bg-brand-surface ${
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
            className={`relative text-text-muted hover:text-text-primary transition-all p-1.5 rounded-full hover:bg-brand-surface ${
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

          {/* Theme Toggle (Dark / Light mode) */}
          <ThemeToggle />

          {/* Divider */}
          <div className="h-5 w-px bg-brand-border" />

          {isAuthenticated ? (
            <>
              <NavLink to="/orders" className={linkClass} title="My Orders">
                <Package size={20} />
              </NavLink>
              <NavLink to="/profile" className={linkClass} title={user?.name ?? 'Profile'}>
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

      </nav>

      {/* Sub Navbar with Categories */}
      <SubNavbar />
    </header>
  );
}
