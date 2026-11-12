import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { getCategories, getProducts } from '../../api/catalog.api.js';
import ProductCard from '../../components/catalog/ProductCard.jsx';
import Pagination from '../../components/catalog/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search, Category and Sort States initialized from URL params
  const searchQuery = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Sync state changes to searchParams
  const updateQueryParam = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === '' || value === false || value === null || value === undefined) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
          // Reset to page 1 on any filter change except page
          if (key !== 'page') {
            next.set('page', '1');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Load dynamic categories once
  useEffect(() => {
    let isMounted = true;
    getCategories({ isActive: true })
      .then((data) => {
        if (isMounted && data?.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products on query params changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      await Promise.resolve();
      if (!isMounted) return;
      setLoading(true);

      const query = {
        page,
        limit: 12,
        sort,
      };
      if (searchQuery) query.search = searchQuery;
      if (categoryId) query.categoryId = categoryId;

      try {
        const data = await getProducts(query);
        if (isMounted) {
          setProducts(data?.products || []);
          setPagination({
            page: data?.page || 1,
            limit: data?.limit || 12,
            total: data?.total || 0,
            totalPages: data?.totalPages || 1,
          });
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [searchQuery, categoryId, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateQueryParam('search', searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Find active category label
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.categoryId === categoryId);
  }, [categories, categoryId]);

  const hasActiveFilters = Boolean(searchQuery || categoryId);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Page Header & Controls ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <h1 className="font-display uppercase text-3xl sm:text-4xl text-text-primary tracking-tight leading-tight">
            Explore Sport Materials
          </h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search equipment, gear, brand..."
            className="w-full bg-brand-surface border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-accent transition-colors"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        </form>
      </div>

      {/* ── Toolbar: Filter Status & Sort Selector ────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Active Filters / Product Count */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted mr-1">
            Showing <strong className="text-text-primary">{pagination.total}</strong> products
          </span>

          {activeCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
              <span>Category: {activeCategory.name}</span>
              <button
                type="button"
                onClick={() => updateQueryParam('categoryId', '')}
                className="hover:text-white transition-colors cursor-pointer"
                title="Remove category filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-surface border border-brand-border text-text-primary">
              <span>Search: &quot;{searchQuery}&quot;</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateQueryParam('search', '');
                }}
                className="hover:text-brand-accent transition-colors cursor-pointer"
                title="Remove search query"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-brand-accent hover:underline ml-2 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-text-muted hidden sm:inline">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => updateQueryParam('sort', e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-brand-surface text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Main Full-Width Products Grid ─────────────────── */}
      <div className="w-full flex flex-col gap-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-3.5 gap-2.5"
              >
                <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                <div className="flex items-center justify-between pt-1 px-1 mt-auto">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => updateQueryParam('page', p)}
              className="mt-6"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center bg-brand-surface border border-brand-border rounded-2xl">
            <span className="size-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mb-3">
              <Search size={22} />
            </span>
            <h3 className="text-lg font-bold text-text-primary mb-1">No products found</h3>
            <p className="text-sm text-text-muted max-w-sm mb-6">
              We couldn&apos;t find any gear matching your current filters. Try searching for something else or clearing filters.
            </p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
