import { useState, useEffect, useCallback, useId } from 'react';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Trash2,
  RotateCw,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  adjustAdminInventory,
  getAdminCategories,
} from '../../api/admin.api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import AdminHeader from '../../components/admin/AdminHeader.jsx';

const GEAR_CATEGORIES = [
  'EQUIPMENT',
  'APPAREL',
  'FOOTWEAR',
  'ACCESSORIES',
  'NUTRITION',
];

const SKILL_LEVELS = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'];
const GENDER_GROUPS = ['UNISEX', 'MEN', 'WOMEN', 'KIDS'];

const SPORT_OPTIONS = [
  'Football',
  'Basketball',
  'Tennis',
  'Running',
  'Fitness & Strength',
  'Badminton',
  'Boxing Gear',
  'Swimming',
  'Cycling',
  'Yoga',
];

export default function AdminProductsPage() {
  const idPrefix = useId();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [gearFilter, setGearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Submitting flags
  const [submitting, setSubmitting] = useState(false);

  // Form state for Create
  const [createForm, setCreateForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    basePrice: '',
    brand: '',
    gearCategory: 'EQUIPMENT',
    sportType: ['Football'],
    skillLevel: 'ALL',
    genderAgeGroup: 'UNISEX',
    isBulky: false,
    description: '',
    longDescription: '',
    imageUrl: '',
    initialStock: '20',
    warehouseLocation: 'WAREHOUSE-BAY-A1',
  });

  // Form state for Edit
  const [editForm, setEditForm] = useState({
    name: '',
    categoryId: '',
    basePrice: '',
    brand: '',
    gearCategory: 'EQUIPMENT',
    sportType: [],
    skillLevel: 'ALL',
    genderAgeGroup: 'UNISEX',
    isBulky: false,
    description: '',
    longDescription: '',
    imageUrl: '',
    isActive: true,
  });

  // Form state for Inventory Adjust
  const [inventoryForm, setInventoryForm] = useState({
    mode: 'ADD', // 'ADD', 'SUBTRACT', 'SET'
    quantity: '10',
    reason: 'RESTOCK',
  });

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Load Categories once
  useEffect(() => {
    let isMounted = true;
    getAdminCategories()
      .then((data) => {
        if (isMounted) setCategories(data?.categories || []);
      })
      .catch((err) => console.error('Failed to load categories:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Products
  const loadProducts = useCallback(
    async (pageOverride) => {
      setLoading(true);
      setError(null);
      try {
        const pageToLoad = pageOverride !== undefined ? pageOverride : pagination.page;
        const params = {
          page: pageToLoad,
          limit: pagination.limit,
          sort: sortBy,
        };
        if (search.trim()) params.search = search.trim();
        if (categoryFilter) params.categoryId = categoryFilter;
        if (gearFilter) params.gearCategory = gearFilter;
        if (statusFilter !== '') params.isActive = statusFilter;

        const res = await getAdminProducts(params);
        setProducts(res.products || []);
        setPagination({
          page: res.page || 1,
          limit: res.limit || 15,
          total: res.total || 0,
          totalPages: res.totalPages || 1,
        });
      } catch (err) {
        console.error('Failed to load admin products:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, search, categoryFilter, gearFilter, statusFilter, sortBy]
  );

  useEffect(() => {
    let isMounted = true;
    async function init() {
      await Promise.resolve();
      if (isMounted) loadProducts();
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadProducts]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts(1);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      sku: '',
      categoryId: categories[0]?.categoryId || '',
      basePrice: '',
      brand: '',
      gearCategory: 'EQUIPMENT',
      sportType: ['Football'],
      skillLevel: 'ALL',
      genderAgeGroup: 'UNISEX',
      isBulky: false,
      description: '',
      longDescription: '',
      imageUrl: '',
      initialStock: '20',
      warehouseLocation: 'WAREHOUSE-BAY-A1',
    });
    setCreateModalOpen(true);
  };

  // Submit Create Product
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.sku || !createForm.basePrice || !createForm.categoryId) {
      setError('Please fill in all required fields (Name, SKU, Category, Base Price).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: createForm.name.trim(),
        sku: createForm.sku.trim().toUpperCase(),
        categoryId: createForm.categoryId,
        basePrice: parseFloat(createForm.basePrice),
        brand: createForm.brand.trim() || undefined,
        gearCategory: createForm.gearCategory,
        sportType: createForm.sportType.length > 0 ? createForm.sportType : ['General Sport'],
        skillLevel: createForm.skillLevel,
        genderAgeGroup: createForm.genderAgeGroup,
        isBulky: Boolean(createForm.isBulky),
        description: createForm.description.trim() || undefined,
        longDescription: createForm.longDescription.trim() || undefined,
        images: createForm.imageUrl.trim() ? [createForm.imageUrl.trim()] : [],
        variants: [
          {
            variantName: 'Standard',
            sku: `${createForm.sku.trim().toUpperCase()}-STD`,
            price: parseFloat(createForm.basePrice),
            weightKg: createForm.isBulky ? 15 : 1.2,
            stock: parseInt(createForm.initialStock, 10) || 0,
            warehouseLocation: createForm.warehouseLocation.trim() || 'MAIN-BAY-01',
          },
        ],
      };

      await createAdminProduct(payload);
      showToast(`Product "${payload.name}" created successfully!`);
      setCreateModalOpen(false);
      loadProducts(1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = async (product) => {
    setSelectedProduct(product);
    setError(null);
    try {
      const fullProd = await getAdminProductById(product.productId);
      setSelectedProduct(fullProd);
      setEditForm({
        name: fullProd.name || '',
        categoryId: fullProd.categoryId || '',
        basePrice: fullProd.basePrice !== undefined ? String(fullProd.basePrice) : '',
        brand: fullProd.brand || '',
        gearCategory: fullProd.gearCategory || 'EQUIPMENT',
        sportType: Array.isArray(fullProd.sportType) ? fullProd.sportType : [],
        skillLevel: fullProd.skillLevel || 'ALL',
        genderAgeGroup: fullProd.genderAgeGroup || 'UNISEX',
        isBulky: Boolean(fullProd.isBulky),
        description: fullProd.description || '',
        longDescription: fullProd.longDescription || '',
        imageUrl: fullProd.images?.[0] || '',
        isActive: fullProd.isActive !== false,
      });
      setEditModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch product details.');
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: editForm.name.trim(),
        categoryId: editForm.categoryId,
        basePrice: parseFloat(editForm.basePrice),
        brand: editForm.brand.trim() || undefined,
        gearCategory: editForm.gearCategory,
        sportType: editForm.sportType,
        skillLevel: editForm.skillLevel,
        genderAgeGroup: editForm.genderAgeGroup,
        isBulky: Boolean(editForm.isBulky),
        description: editForm.description.trim() || undefined,
        longDescription: editForm.longDescription.trim() || undefined,
        images: editForm.imageUrl.trim() ? [editForm.imageUrl.trim()] : [],
        isActive: Boolean(editForm.isActive),
      };

      await updateAdminProduct(selectedProduct.productId, payload);
      showToast(`Product "${payload.name}" updated successfully!`);
      setEditModalOpen(false);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active state directly from table
  const handleToggleActive = async (product) => {
    try {
      const newStatus = !product.isActive;
      await updateAdminProduct(product.productId, { isActive: newStatus });
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === product.productId ? { ...p, isActive: newStatus } : p
        )
      );
      showToast(`Product "${product.name}" is now ${newStatus ? 'active' : 'inactive'}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle product status.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (product) => {
    const confirmMsg = `Are you sure you want to delete "${product.name}"? This will deactivate the product catalog entry.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteAdminProduct(product.productId, false);
      showToast(`Product "${product.name}" deleted.`);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete product.');
    }
  };

  // Open Inventory Adjustment Modal
  const handleOpenInventory = (product) => {
    setSelectedProduct(product);
    const primaryVariant = product.variants?.[0] || null;
    setSelectedVariant(primaryVariant);
    setInventoryForm({
      mode: 'ADD',
      quantity: '10',
      reason: 'RESTOCK',
    });
    setInventoryModalOpen(true);
  };

  // Submit Inventory Adjustment
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    if (!selectedVariant) {
      setError('No variant selected for inventory adjustment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const qty = parseInt(inventoryForm.quantity, 10);
      if (isNaN(qty) || qty < 0) {
        throw new Error('Please enter a valid non-negative quantity.');
      }

      const payload = {
        reason: inventoryForm.reason,
      };

      if (inventoryForm.mode === 'ADD') {
        payload.changeQuantity = qty;
      } else if (inventoryForm.mode === 'SUBTRACT') {
        payload.changeQuantity = -qty;
      } else if (inventoryForm.mode === 'SET') {
        payload.newQuantity = qty;
      }

      await adjustAdminInventory(selectedVariant.variantId, payload);
      showToast(`Inventory updated for variant "${selectedVariant.sku}"!`);
      setInventoryModalOpen(false);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to adjust inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle sport in arrays
  const toggleSport = (sport, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => {
        const exists = prev.sportType.includes(sport);
        return {
          ...prev,
          sportType: exists
            ? prev.sportType.filter((s) => s !== sport)
            : [...prev.sportType, sport],
        };
      });
    } else {
      setCreateForm((prev) => {
        const exists = prev.sportType.includes(sport);
        return {
          ...prev,
          sportType: exists
            ? prev.sportType.filter((s) => s !== sport)
            : [...prev.sportType, sport],
        };
      });
    }
  };

  return (
    <div className="pb-16 w-full">
      <AdminHeader
        title="Products & Inventory"
        description="Manage direct sports catalog merchandise, pricing, equipment variants, and warehouse inventory."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProducts()}
              disabled={loading}
              className="gap-2"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="gap-2"
            >
              <Plus size={16} />
              <span>New Product</span>
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successToast && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-sm shadow-sm animate-fade-in">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── Filters Bar ──────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border mb-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, SKU, brand..."
            className="pr-10"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-accent transition-colors"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Gear Category */}
          <select
            value={gearFilter}
            onChange={(e) => {
              setGearFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            <option value="">All Gear Types</option>
            {GEAR_CATEGORIES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive / Drafts</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            <option value="newest">Newest Added</option>
            <option value="oldest">Oldest Added</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* ── Products Table ───────────────────────────────────────────── */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg/40 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Category & Gear</th>
                <th className="py-3.5 px-4 text-right">Base Price</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-sm">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Skeleton className="h-6 w-14 mx-auto rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Skeleton className="h-8 w-20 ml-auto rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 rounded-full bg-brand-bg border border-brand-border text-text-muted">
                        <Package size={28} />
                      </div>
                      <p className="font-semibold text-text-primary text-base">
                        No products found
                      </p>
                      <p className="text-xs max-w-sm text-text-muted">
                        Try adjusting your search keywords, category filters, or click "New Product" to add items to your catalog.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenCreate}
                        className="mt-2 gap-2"
                      >
                        <Plus size={16} />
                        <span>Add Your First Product</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = product.totalStockAvailable ?? 0;
                  const stockBadgeColor =
                    stock > 10
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : stock > 0
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20';

                  return (
                    <tr
                      key={product.productId}
                      className="hover:bg-brand-bg/40 transition-colors"
                    >
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-xl border border-brand-border bg-white p-0.5 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl border border-brand-border bg-brand-bg flex items-center justify-center text-text-muted shrink-0">
                              <Package size={20} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/products/${product.productId}`}
                                className="font-bold text-text-primary hover:text-brand-accent transition-colors truncate block"
                                title={product.name}
                              >
                                {product.name}
                              </Link>
                              {product.isBulky && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 shrink-0">
                                  Bulky
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                              <span className="font-mono">{product.sku}</span>
                              {product.brand && (
                                <>
                                  <span>&bull;</span>
                                  <span>{product.brand}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Gear */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-text-primary text-xs">
                            {product.categoryName || 'General Category'}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-bg border border-brand-border text-text-muted">
                              {product.gearCategory || 'EQUIPMENT'}
                            </span>
                            {Array.isArray(product.sportType) && product.sportType[0] && (
                              <span className="text-[10px] font-medium text-text-muted">
                                {product.sportType[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Base Price */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-text-primary">
                        ${Number(product.basePrice || 0).toFixed(2)}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${stockBadgeColor}`}
                          >
                            {stock} in stock
                          </span>
                          <span className="text-[10px] text-text-muted mt-0.5">
                            {product.variants?.length || 1} variant(s)
                          </span>
                        </div>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            product.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25'
                          }`}
                          title={`Click to ${product.isActive ? 'deactivate' : 'activate'}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              product.isActive ? 'bg-emerald-400' : 'bg-zinc-400'
                            }`}
                          />
                          <span>{product.isActive ? 'Active' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenInventory(product)}
                            className="p-1.5 text-text-muted hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Adjust warehouse inventory"
                          >
                            <Boxes size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-text-muted hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit product catalog details"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ───────────────────────────────────────── */}
        <div className="p-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <div>
            Showing{' '}
            <span className="font-bold text-text-primary">
              {products.length > 0
                ? (pagination.page - 1) * pagination.limit + 1
                : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-text-primary">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-bold text-text-primary">{pagination.total}</span> products
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProducts(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="px-3 py-1 font-semibold text-text-primary">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProducts(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          CREATE PRODUCT MODAL
         ───────────────────────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl my-8 relative animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-brand-accent/15 text-brand-accent">
                  <Package size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    Create Catalog Product
                  </h2>
                  <p className="text-xs text-text-muted">
                    Direct marketplace product registration with inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-create-name`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Product Name *
                  </label>
                  <Input
                    id={`${idPrefix}-create-name`}
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Pro Match Match-Grade Ball"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-create-sku`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    SKU (Stock Keeping Unit) *
                  </label>
                  <Input
                    id={`${idPrefix}-create-sku`}
                    value={createForm.sku}
                    onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                    placeholder="e.g. FTB-BALL-001"
                    className="font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-create-category`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id={`${idPrefix}-create-category`}
                    value={createForm.categoryId}
                    onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-create-price`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Base Price ($) *
                  </label>
                  <Input
                    id={`${idPrefix}-create-price`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.basePrice}
                    onChange={(e) => setCreateForm({ ...createForm, basePrice: e.target.value })}
                    placeholder="49.99"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-create-brand`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Brand Name
                  </label>
                  <Input
                    id={`${idPrefix}-create-brand`}
                    value={createForm.brand}
                    onChange={(e) => setCreateForm({ ...createForm, brand: e.target.value })}
                    placeholder="e.g. Wilson, Nike, Adidas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-create-gear`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Gear Classification
                  </label>
                  <select
                    id={`${idPrefix}-create-gear`}
                    value={createForm.gearCategory}
                    onChange={(e) => setCreateForm({ ...createForm, gearCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                  >
                    {GEAR_CATEGORIES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-create-skill`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Skill Level
                  </label>
                  <select
                    id={`${idPrefix}-create-skill`}
                    value={createForm.skillLevel}
                    onChange={(e) => setCreateForm({ ...createForm, skillLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                  >
                    {SKILL_LEVELS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-create-gender`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Gender / Age Group
                  </label>
                  <select
                    id={`${idPrefix}-create-gender`}
                    value={createForm.genderAgeGroup}
                    onChange={(e) => setCreateForm({ ...createForm, genderAgeGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                  >
                    {GENDER_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sport Type pills */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Associated Sports
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORT_OPTIONS.map((sport) => {
                    const active = createForm.sportType.includes(sport);
                    return (
                      <button
                        type="button"
                        key={sport}
                        onClick={() => toggleSport(sport, false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-brand-accent text-white shadow-xs'
                            : 'bg-brand-bg text-text-muted hover:text-text-primary border border-brand-border'
                        }`}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bulky flag & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-create-image`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Image URL
                  </label>
                  <Input
                    id={`${idPrefix}-create-image`}
                    value={createForm.imageUrl}
                    onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id={`${idPrefix}-create-bulky`}
                    checked={createForm.isBulky}
                    onChange={(e) => setCreateForm({ ...createForm, isBulky: e.target.checked })}
                    className="rounded border-brand-border text-brand-accent focus:ring-brand-accent size-4"
                  />
                  <label
                    htmlFor={`${idPrefix}-create-bulky`}
                    className="text-xs font-semibold text-text-primary cursor-pointer"
                  >
                    Bulky / Heavy Item (Triggers Oversize Shipping Rate)
                  </label>
                </div>
              </div>

              {/* Initial Inventory Section */}
              <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Boxes size={14} className="text-brand-accent" />
                  <span>Initial Warehouse Stock</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`${idPrefix}-create-stock`}
                      className="block text-xs font-medium text-text-muted mb-1"
                    >
                      Units on Hand *
                    </label>
                    <Input
                      id={`${idPrefix}-create-stock`}
                      type="number"
                      min="0"
                      value={createForm.initialStock}
                      onChange={(e) => setCreateForm({ ...createForm, initialStock: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`${idPrefix}-create-bay`}
                      className="block text-xs font-medium text-text-muted mb-1"
                    >
                      Warehouse Bay Location
                    </label>
                    <Input
                      id={`${idPrefix}-create-bay`}
                      value={createForm.warehouseLocation}
                      onChange={(e) => setCreateForm({ ...createForm, warehouseLocation: e.target.value })}
                      placeholder="e.g. BAY-01-ROW-B"
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label
                  htmlFor={`${idPrefix}-create-desc`}
                  className="block text-xs font-semibold text-text-primary mb-1"
                >
                  Short Description
                </label>
                <textarea
                  id={`${idPrefix}-create-desc`}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Key highlight features of the sports gear..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <RotateCw size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Create Product</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          EDIT PRODUCT MODAL
         ───────────────────────────────────────────────────────────────── */}
      {editModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl my-8 relative animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-brand-accent/15 text-brand-accent">
                  <Edit3 size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    Edit Product Catalog
                  </h2>
                  <p className="text-xs text-text-muted font-mono">
                    SKU: {selectedProduct.sku}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-edit-name`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Product Name *
                  </label>
                  <Input
                    id={`${idPrefix}-edit-name`}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-edit-price`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Base Price ($) *
                  </label>
                  <Input
                    id={`${idPrefix}-edit-price`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.basePrice}
                    onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-edit-category`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id={`${idPrefix}-edit-category`}
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-edit-brand`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Brand Name
                  </label>
                  <Input
                    id={`${idPrefix}-edit-brand`}
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}-edit-gear`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Gear Classification
                  </label>
                  <select
                    id={`${idPrefix}-edit-gear`}
                    value={editForm.gearCategory}
                    onChange={(e) => setEditForm({ ...editForm, gearCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                  >
                    {GEAR_CATEGORIES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sport Type pills */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Associated Sports
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORT_OPTIONS.map((sport) => {
                    const active = editForm.sportType.includes(sport);
                    return (
                      <button
                        type="button"
                        key={sport}
                        onClick={() => toggleSport(sport, true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-brand-accent text-white shadow-xs'
                            : 'bg-brand-bg text-text-muted hover:text-text-primary border border-brand-border'
                        }`}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${idPrefix}-edit-image`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Image URL
                  </label>
                  <Input
                    id={`${idPrefix}-edit-image`}
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="flex flex-col justify-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isBulky}
                      onChange={(e) => setEditForm({ ...editForm, isBulky: e.target.checked })}
                      className="rounded border-brand-border text-brand-accent focus:ring-brand-accent size-4"
                    />
                    <span className="text-xs font-semibold text-text-primary">
                      Bulky Item (Oversize Shipping)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="rounded border-brand-border text-emerald-500 focus:ring-emerald-500 size-4"
                    />
                    <span className="text-xs font-semibold text-text-primary">
                      Active on Storefront
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}-edit-desc`}
                  className="block text-xs font-semibold text-text-primary mb-1"
                >
                  Description
                </label>
                <textarea
                  id={`${idPrefix}-edit-desc`}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <RotateCw size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          INVENTORY ADJUSTMENT MODAL
         ───────────────────────────────────────────────────────────────── */}
      {inventoryModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                  <Boxes size={18} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-text-primary">
                    Adjust Warehouse Stock
                  </h2>
                  <p className="text-xs text-text-muted truncate max-w-[240px]">
                    {selectedProduct.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInventoryModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-brand-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInventorySubmit} className="space-y-4">
              {/* Variant Selector */}
              {selectedProduct.variants?.length > 1 && (
                <div>
                  <label
                    htmlFor={`${idPrefix}-inv-variant`}
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Select Variant
                  </label>
                  <select
                    id={`${idPrefix}-inv-variant`}
                    value={selectedVariant?.variantId || ''}
                    onChange={(e) => {
                      const v = selectedProduct.variants.find(
                        (item) => item.variantId === e.target.value
                      );
                      setSelectedVariant(v);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                  >
                    {selectedProduct.variants.map((v) => (
                      <option key={v.variantId} value={v.variantId}>
                        {v.variantName} ({v.sku}) - {v.inventory?.quantityAvailable ?? 0} available
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current Stock Banner */}
              <div className="p-3 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">
                  Current Stock Available:
                </span>
                <span className="text-sm font-extrabold text-brand-accent">
                  {selectedVariant?.inventory?.quantityAvailable ??
                    selectedProduct.totalStockAvailable ??
                    0}{' '}
                  units
                </span>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Adjustment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mode: 'ADD', label: '+ Add Stock' },
                    { mode: 'SUBTRACT', label: '- Deduct' },
                    { mode: 'SET', label: '= Set Exact' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.mode}
                      onClick={() => setInventoryForm({ ...inventoryForm, mode: item.mode })}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        inventoryForm.mode === item.mode
                          ? 'bg-brand-accent text-white border-brand-accent shadow-xs'
                          : 'bg-brand-bg border-brand-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label
                  htmlFor={`${idPrefix}-inv-qty`}
                  className="block text-xs font-semibold text-text-primary mb-1"
                >
                  Units Quantity *
                </label>
                <Input
                  id={`${idPrefix}-inv-qty`}
                  type="number"
                  min="0"
                  value={inventoryForm.quantity}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, quantity: e.target.value })
                  }
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor={`${idPrefix}-inv-reason`}
                  className="block text-xs font-semibold text-text-primary mb-1"
                >
                  Audit Reason
                </label>
                <select
                  id={`${idPrefix}-inv-reason`}
                  value={inventoryForm.reason}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent"
                >
                  <option value="RESTOCK">Restock (Received shipment)</option>
                  <option value="PHYSICAL_COUNT">Physical Inventory Audit</option>
                  <option value="DAMAGED">Damaged / Expired stock removal</option>
                  <option value="RETURN">Customer Return Restock</option>
                  <option value="CORRECTION">Manual Inventory Correction</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInventoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <RotateCw size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Apply Adjustment</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}