import { NavLink, Link } from 'react-router-dom';
import { Shield, LayoutDashboard, Layers, Store, ExternalLink } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

/**
 * Shared Header & Navigation Tab Bar for all Admin Console pages.
 * Provides cohesive desktop and mobile tab navigation between:
 * - Overview Dashboard (/admin)
 * - Category Taxonomy (/admin/categories)
 * - Vendor & Seller Management (/admin/vendors)
 */
export default function AdminHeader({ title, description, actions }) {
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
      to: '/admin/vendors',
      label: 'Vendors & Stores',
      icon: Store,
      end: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* ── Top Bar: Title & Action CTA ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-1.5 rounded-lg bg-brand-accent/15 text-brand-accent border border-brand-accent/30 flex items-center justify-center">
              <Shield size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Admin Control Center
            </span>
            <Badge variant="accent" size="sm">
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

      {/* ── Navigation Tabs ─────────────────────────────────────────────── */}
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
    </div>
  );
}
