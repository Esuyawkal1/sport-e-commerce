import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Package,
  ShieldCheck,
  Plus,
  ArrowRight,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Boxes,
} from 'lucide-react';
import { getAdminCategories, getAdminProducts } from '../../api/admin.api.js';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

export default function AdminDashboardPage() {
  const [categories, setCategories] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catData, prodData] = await Promise.all([
        getAdminCategories().catch(() => ({ categories: [] })),
        getAdminProducts({ limit: 6 }).catch(() => ({ products: [], total: 0 })),
      ]);

      setCategories(catData?.categories || []);
      setRecentProducts(prodData?.products || []);
      setTotalProducts(prodData?.total || prodData?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setError('Unable to load some administrative dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      await Promise.resolve();
      if (isMounted) {
        loadDashboardData();
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  return (
    <div className="pb-16 w-full">
      <AdminHeader
        title="Admin Overview"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
            className="gap-2"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Stats</span>
          </Button>
        }
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Metric Cards Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Categories Stat */}
        <div className="p-5 rounded-xl bg-brand-surface border border-brand-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Sports Taxonomy
            </span>
            <span className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent">
              <Layers size={18} />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-1">
              {loading ? <Skeleton className="h-8 w-16" /> : categories.length}
            </div>
            <p className="text-xs text-text-muted">Root sports & equipment</p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60">
            <Link
              to="/admin/categories"
              className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
            >
              <span>Manage Categories</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Live Products Stat */}
        <div className="p-5 rounded-xl bg-brand-surface border border-brand-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Catalog Products
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Package size={18} />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-1">
              {loading ? <Skeleton className="h-8 w-16" /> : totalProducts}
            </div>
            <p className="text-xs text-text-muted">Active sports items & gear</p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60">
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
            >
              <span>Manage Products</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Live Storefront Stat */}
        <div className="p-5 rounded-xl bg-brand-surface border border-brand-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Live Storefront
            </span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Boxes size={18} />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-1">
              Active
            </div>
            <p className="text-xs text-text-muted">Direct online shopping</p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60">
            <Link
              to="/catalog"
              className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
            >
              <span>Explore Storefront</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Governance / Security Stat */}
        <div className="p-5 rounded-xl bg-brand-surface border border-brand-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Role Governance
            </span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <ShieldCheck size={18} />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-1">
              RBAC
            </div>
            <p className="text-xs text-text-muted">Admin & Customer access</p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60">
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Full Access Authorized</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Action Shortcuts ─────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border mb-8 shadow-xs">
        <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>Administrative Quick Actions</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/categories"
            className="p-4 rounded-xl border border-brand-border hover:border-brand-accent/50 bg-brand-bg/50 hover:bg-brand-bg transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent group-hover:scale-105 transition-transform">
                <Plus size={18} />
              </span>
              <div>
                <span className="font-bold text-sm text-text-primary block">
                  New Category
                </span>
                <span className="text-xs text-text-muted">Add root sports or equipment hierarchy</span>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/products"
            className="p-4 rounded-xl border border-brand-border hover:border-brand-accent/50 bg-brand-bg/50 hover:bg-brand-bg transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                <Package size={18} />
              </span>
              <div>
                <span className="font-bold text-sm text-text-primary block">
                  New Product
                </span>
                <span className="text-xs text-text-muted">Register gear and set warehouse stock</span>
              </div>
            </div>
          </Link>

          <Link
            to="/catalog"
            className="p-4 rounded-xl border border-brand-border hover:border-brand-accent/50 bg-brand-bg/50 hover:bg-brand-bg transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
                <ExternalLink size={18} />
              </span>
              <div>
                <span className="font-bold text-sm text-text-primary block">
                  Review Storefront
                </span>
                <span className="text-xs text-text-muted">Verify live catalog as customer</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Two-Column Overview: Categories & Products ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Recent Categories */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
              <h2 className="text-base font-bold text-text-primary">
                Taxonomy Hierarchy
              </h2>
              <Link to="/admin/categories">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">
                No categories configured yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {categories.slice(0, 6).map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="p-3 rounded-xl bg-brand-bg/60 border border-brand-border/60 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-2 rounded-full bg-brand-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate">
                          {cat.name}
                        </p>
                        <p className="text-xs text-text-muted font-mono truncate">
                          slug: {cat.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {cat.parentCategoryId ? (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-brand-border/60 text-text-muted">
                          Subcategory
                        </span>
                      ) : (
                        <Badge variant="accent" size="sm">
                          Root Sport
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-brand-border text-center">
            <Link
              to="/admin/categories"
              className="text-xs font-semibold text-brand-accent hover:underline"
            >
              Configure and reorder categories &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Products Catalog */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
              <h2 className="text-base font-bold text-text-primary">
                Catalog Inventory
              </h2>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentProducts.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">
                No products added to catalog yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentProducts.slice(0, 6).map((p) => {
                  const stock = p.totalStockAvailable ?? 0;
                  return (
                    <div
                      key={p.productId}
                      className="p-3 rounded-xl bg-brand-bg/60 border border-brand-border/60 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-brand-border bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-brand-border bg-brand-surface flex items-center justify-center text-text-muted shrink-0">
                            <Package size={18} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-primary truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-mono">{p.sku}</span>
                            <span>&bull;</span>
                            <span className="font-bold text-text-primary">
                              ${Number(p.basePrice || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            stock > 10
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : stock > 0
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {stock} in stock
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-brand-border text-center">
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-brand-accent hover:underline"
            >
              Manage all products & inventory &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}