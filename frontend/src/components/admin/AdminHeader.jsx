import { NavLink, Link } from 'react-router-dom';
import { Shield, LayoutDashboard, Layers, Package, ExternalLink, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

/**
 * Shared Header for all Admin Console pages.
 * Displays page title, breadcrumbs, descriptions, and action CTAs.
 * Can optionally render horizontal tabs if requested via showTabs prop.
 */
export default function AdminHeader({ title, description, actions, showTabs = false }) {
  const tabs = [
    {
      to: '/admin',
      label: 'Overview',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/admin/categories',
      label: 'Categories & Taxonomy',
      icon: Layers,
      end: false,
    },
    {
      to: '/admin/products',
      label: 'Products & Inventory',
      icon: Package,
      end: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* ── Top Bar: Title & Action CTA ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb & Portal Badge */}
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-text-muted">
            <Link
              to="/admin"
              className="hover:text-brand-accent transition-colors flex items-center gap-1.5"
            >
              <Shield size={13} className="text-brand-accent" />
              <span>Admin Console</span>
            </Link>
            <ChevronRight size={12} className="text-text-muted/60" />
            <span className="text-text-primary">{title || 'Overview'}</span>
            <Badge variant="accent" size="sm" className="ml-1">
              Staff Portal
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-text-primary tracking-tight">
            {title || 'Marketplace Administration'}
          </h1>
          {description && (
            <p className="text-sm text-text-muted mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-text-muted hover:text-text-primary text-xs font-semibold hover:bg-brand-surface transition-colors"
            title="Browse Live Storefront"
          >
            <span>Live Catalog</span>
            <ExternalLink size={13} />
          </Link>
          {actions}
        </div>
      </div>

      {/* ── Optional Navigation Tabs ─────────────────────────────────────── */}
      {showTabs && (
        <div className="border-b border-brand-border flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 py-3 px-3.5 text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-brand-accent font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-accent rounded-t-full"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
