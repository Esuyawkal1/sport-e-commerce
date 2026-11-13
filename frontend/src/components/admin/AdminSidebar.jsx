import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  Shield,
  ShieldCheck,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LogOut,
  User,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAdminCategories, getAdminProducts } from '../../api/admin.api.js';

/**
 * Clean, responsive Admin Sidebar Control Center.
 * Provides desktop sticky navigation with collapsible rail,
 * live metric badges, administrative quick actions, RBAC security card,
 * user session controls, and a dedicated mobile bar & drawer.
 */
export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop collapsible rail state (persisted to localStorage)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Live Counts for badge indicators
  const [counts, setCounts] = useState({ categories: null, products: null });

  // Toggle collapsed state and persist
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Close mobile drawer on route navigation during render
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileDrawerOpen(false);
  }

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setMobileDrawerOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileDrawerOpen]);

  // Load summary counts for categories & products
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAdminCategories().catch(() => ({ categories: [] })),
      getAdminProducts({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
    ]).then(([catData, prodData]) => {
      if (isMounted) {
        setCounts({
          categories: catData?.categories?.length ?? null,
          products: prodData?.pagination?.total ?? prodData?.products?.length ?? null,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/admin/categories',
      end: false,
      label: 'Categories',
      icon: Layers,
      badge: counts.categories !== null ? counts.categories : undefined,
    },
    {
      to: '/admin/products',
      end: false,
      label: 'Products',
      icon: Package,
      badge: counts.products !== null ? counts.products : undefined,
    },
  ];

  // Active section title for mobile header
  const currentNav = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  ) || navItems[0];

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────
          1. MOBILE ADMIN CONTROLS BAR (< lg screens)
          Sticky bar under top navbar with section indicator, 
          fast 1-tap nav pills, and drawer toggle
         ───────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden w-full mb-6">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 rounded-lg bg-brand-accent/15 text-brand-accent border border-brand-accent/30 shrink-0">
                <Shield size={16} />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent block">
                  Admin Console
                </span>
                <span className="text-sm font-bold text-text-primary truncate block">
                  {currentNav.label}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border hover:border-brand-accent/50 bg-brand-bg text-text-primary text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Open full admin sidebar"
            >
              <SlidersHorizontal size={14} className="text-brand-accent" />
              <span>Controls</span>
            </button>
          </div>

          {/* Quick Nav Pills for instant switching */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-brand-border/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-xs'
                      : 'bg-brand-bg text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon size={13} />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-brand-surface text-text-muted border border-brand-border'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          2. MOBILE DRAWER OVERLAY & SHEET
         ───────────────────────────────────────────────────────────────── */}
      {mobileDrawerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999] lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Off-canvas Sheet */}
            <aside
              className="fixed top-0 left-0 bottom-0 w-[300px] max-w-[85vw] h-dvh bg-brand-surface border-r border-brand-border shadow-2xl flex flex-col z-[1000] animate-slide-in-left overflow-y-auto"
              aria-label="Admin sidebar drawer"
            >
              {/* Drawer Header */}
              <div className="h-16 px-4 border-b border-brand-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-brand-accent/15 text-brand-accent border border-brand-accent/30 flex items-center justify-center">
                    <Shield size={18} />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent block">
                      Admin Portal
                    </span>
                    <span className="font-display uppercase text-lg tracking-tight text-text-primary block">
                      Control Hub
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-bg transition-colors cursor-pointer"
                  title="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-4 flex flex-col justify-between gap-6">
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-xs font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Staff Portal &bull; RBAC Active</span>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                      Navigation Controls
                    </p>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.end
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-brand-accent/15 text-brand-accent border-l-4 border-brand-accent shadow-xs'
                              : 'text-text-muted hover:text-text-primary hover:bg-brand-bg'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={18} />
                            <span className="block leading-snug">{item.label}</span>
                          </div>
                          {typeof item.badge === 'number' && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-bg border border-brand-border text-text-primary">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="space-y-2 pt-2 border-t border-brand-border/60">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                      Quick Shortcuts
                    </p>
                    <Link
                      to="/admin/categories"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-brand-accent hover:bg-brand-bg border border-brand-border/70 transition-colors"
                    >
                      <Plus size={14} className="text-brand-accent" />
                      <span>New Category</span>
                    </Link>
                    <Link
                      to="/admin/products"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-brand-accent hover:bg-brand-bg border border-brand-border/70 transition-colors"
                    >
                      <Plus size={14} className="text-emerald-500" />
                      <span>New Product</span>
                    </Link>
                    <Link
                      to="/catalog"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-brand-bg border border-brand-border/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag size={14} />
                        <span>Live Catalog Storefront</span>
                      </div>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                {/* Profile & Session Footer */}
                <div className="pt-4 border-t border-brand-border space-y-3">
                  <div className="p-3 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-accent/20 border border-brand-accent/30 text-brand-accent flex items-center justify-center font-bold text-xs shrink-0">
                        {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-text-primary truncate">
                          {user?.name || 'Administrator'}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {user?.email || 'admin@sportmarket.com'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Log out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}

      {/* ─────────────────────────────────────────────────────────────────
          3. DESKTOP STICKY SIDEBAR (>= lg screens)
          Features collapsible icon rail or full width control console
         ───────────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-xs sticky top-20 transition-all duration-300 self-start z-30 ${
          collapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
        aria-label="Admin Control Sidebar"
      >
        {/* Sidebar Header & Brand Badge */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-brand-border/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-brand-accent/15 text-brand-accent border border-brand-accent/30 shrink-0 flex items-center justify-center">
              <Shield size={18} />
            </span>
            {!collapsed && (
              <div className="min-w-0 animate-fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent block truncate">
                  Admin Control
                </span>
                <span className="font-display uppercase text-base tracking-tight text-text-primary block truncate">
                  Console Hub
                </span>
              </div>
            )}
          </div>

          {/* Rail Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-bg transition-colors cursor-pointer shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Status Pill (only in expanded mode) */}
        {!collapsed && (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-[11px] font-semibold animate-fade-in">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="truncate">Active Admin Session</span>
          </div>
        )}

        {/* Primary Navigation Menu */}
        <div className="mt-5 space-y-1">
          {!collapsed && (
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 animate-fade-in">
              Core Controls
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center rounded-xl transition-all duration-150 group cursor-pointer ${
                  collapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-brand-accent/15 text-brand-accent font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary hover:bg-brand-bg font-semibold'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <Icon
                    size={18}
                    className={`shrink-0 transition-transform ${
                      isActive ? 'text-brand-accent' : 'group-hover:scale-110'
                    }`}
                  />
                  {!collapsed && (
                    <span className="block text-sm font-semibold leading-snug truncate">
                      {item.label}
                    </span>
                  )}
                </div>

                {!collapsed && typeof item.badge === 'number' && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isActive
                        ? 'bg-brand-accent text-white shadow-xs'
                        : 'bg-brand-bg text-text-primary border border-brand-border'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Active Indicator Line */}
                {collapsed && isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 bg-brand-accent rounded-r-full"
                    aria-hidden="true"
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Administrative Quick Actions (expanded view) */}
        {!collapsed && (
          <div className="mt-6 pt-4 border-t border-brand-border/70 space-y-2 animate-fade-in">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
              Quick Actions
            </p>

            <Link
              to="/admin/categories"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-brand-accent hover:bg-brand-bg border border-brand-border/60 transition-colors group"
              title="Add a new root sport or equipment subcategory"
            >
              <span className="p-1 rounded-md bg-brand-accent/10 text-brand-accent group-hover:scale-110 transition-transform">
                <Plus size={13} />
              </span>
              <span className="truncate">New Category</span>
            </Link>

            <Link
              to="/admin/products"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-emerald-400 hover:bg-brand-bg border border-brand-border/60 transition-colors group"
              title="Add or manage sports products"
            >
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Plus size={13} />
              </span>
              <span className="truncate">New Product</span>
            </Link>

            <Link
              to="/catalog"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-brand-bg border border-brand-border/60 transition-colors group"
              title="Inspect customer live catalog view"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">Live Storefront</span>
              </div>
              <ExternalLink size={12} className="shrink-0 text-text-muted group-hover:text-text-primary" />
            </Link>
          </div>
        )}

        {/* Security & System Info Widget */}
        {!collapsed && (
          <div className="mt-6 px-3 py-2 rounded-xl bg-brand-bg/80 border border-brand-border/60 flex items-center gap-2 text-xs font-semibold text-text-muted animate-fade-in">
            <ShieldCheck size={14} className="text-brand-accent shrink-0" />
            <span className="text-text-primary">RBAC Enforced</span>
          </div>
        )}

        {/* Admin Session Profile Footer */}
        <div className={`mt-6 pt-4 border-t border-brand-border/80 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {collapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 text-brand-accent flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={15} />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-text-primary truncate">
                    {user?.name || 'Admin'}
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded inline-block">
                    Superadmin
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Log out of admin console"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
