import { useState, useEffect, useId, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  Settings,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import {
  getMyVendorProfile,
  updateMyVendorProfile,
  getVendorProducts,
  createVendorProduct,
  deleteVendorProduct,
  adjustVendorInventory,
  getVendorOrders,
  updateVendorSubOrderStatus,
  getVendorSettlement,
} from '../../api/vendor.api.js';
import { getCategories } from '../../api/catalog.api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { getProductImage } from '../../lib/productImages.js';

const GEAR_CATEGORIES = [
  'EQUIPMENT',
  'APPAREL',
  'FOOTWEAR',
  'PROTECTIVE',
  'ACCESSORY',
];

const SKILL_LEVELS = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'PROFESSIONAL',
  'ALL',
];

const SPORTS = [
  'football',
  'basketball',
  'running',
  'gym',
  'tennis',
  'cycling',
  'swimming',
  'outdoor',
];

export default function VendorDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'orders' | 'profile'
  const idPrefix = useId();

  // State
  const [profile, setProfile] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Store Profile Form State
  const [profileForm, setProfileForm] = useState({
    storeName: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    sportsOffered: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Modal Controls
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [selectedSubOrder, setSelectedSubOrder] = useState(null);
  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Search in products
  const [productSearch, setProductSearch] = useState('');

  // ── Load All Vendor Data ──────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profData, settData, prodData, ordData, catData] = await Promise.all([
        getMyVendorProfile().catch(() => null),
        getVendorSettlement().catch(() => null),
        getVendorProducts().catch(() => ({ products: [] })),
        getVendorOrders().catch(() => ({ subOrders: [] })),
        getCategories({ isActive: true }).catch(() => ({ categories: [] })),
      ]);

      const resolvedProfile = profData?.profile || profData;
      setProfile(resolvedProfile);
      if (resolvedProfile) {
        setProfileForm({
          storeName: resolvedProfile.storeName || '',
          description: resolvedProfile.description || '',
          contactEmail: resolvedProfile.contactEmail || '',
          contactPhone: resolvedProfile.contactPhone || '',
          sportsOffered: Array.isArray(resolvedProfile.sportsSpecialization)
            ? resolvedProfile.sportsSpecialization.join(', ')
            : '',
        });
      }
      setSettlement(settData);
      setProducts(prodData?.products || []);
      setOrders(ordData?.subOrders || []);
      setCategories(catData?.categories || []);
    } catch (err) {
      console.error('Failed to load vendor dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load seller dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      await Promise.resolve();
      if (isMounted) loadDashboardData();
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // ── Product Creation Form State ───────────────────────────────────────────
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    sku: '',
    basePrice: '',
    sportType: 'football',
    gearCategory: 'EQUIPMENT',
    brand: '',
    skillLevel: 'ALL',
    isBulky: false,
    description: '',
    imagesInput: '',
    variantName: 'Standard',
    variantPrice: '',
    variantWeightKg: '1.0',
    initialStock: '20',
  });
  const [productSubmitting, setProductSubmitting] = useState(false);

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    setProductSubmitting(true);
    setError(null);

    try {
      const images = newProduct.imagesInput
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

      const payload = {
        name: newProduct.name.trim(),
        categoryId: newProduct.categoryId || (categories[0]?.categoryId || 'cat_default'),
        sku: newProduct.sku.trim(),
        basePrice: parseFloat(newProduct.basePrice) || 0,
        sportType: newProduct.sportType,
        gearCategory: newProduct.gearCategory,
        brand: newProduct.brand.trim() || profile?.storeName || 'Sports Gear',
        skillLevel: newProduct.skillLevel,
        isBulky: newProduct.isBulky,
        description: newProduct.description.trim(),
        images,
        variants: [
          {
            variantName: newProduct.variantName.trim() || 'Standard',
            sku: `${newProduct.sku.trim()}-STD`,
            price: parseFloat(newProduct.variantPrice || newProduct.basePrice) || 0,
            weightKg: parseFloat(newProduct.variantWeightKg) || 1,
            initialStock: parseInt(newProduct.initialStock, 10) || 10,
          },
        ],
      };

      await createVendorProduct(payload);
      showToast('Product and initial inventory created successfully!');
      setCreateProductOpen(false);
      setNewProduct({
        name: '',
        categoryId: '',
        sku: '',
        basePrice: '',
        sportType: 'football',
        gearCategory: 'EQUIPMENT',
        brand: '',
        skillLevel: 'ALL',
        isBulky: false,
        description: '',
        imagesInput: '',
        variantName: 'Standard',
        variantPrice: '',
        variantWeightKg: '1.0',
        initialStock: '20',
      });
      loadDashboardData();
    } catch (err) {
      console.error('Create product error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create product.');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this product from the marketplace?')) return;
    try {
      await deleteVendorProduct(productId);
      showToast('Product deactivated successfully.');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  // ── Inventory Stock Adjustment ────────────────────────────────────────────
  const [stockInput, setStockInput] = useState('');
  const [adjustingStock, setAdjustingStock] = useState(false);

  const handleAdjustInventorySubmit = async (e) => {
    e.preventDefault();
    if (!selectedVariant) return;
    setAdjustingStock(true);
    try {
      await adjustVendorInventory(selectedVariant.variantId, {
        quantityOnHand: parseInt(stockInput, 10) || 0,
      });
      showToast('Stock level updated successfully!');
      setAdjustStockModalOpen(false);
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust inventory.');
    } finally {
      setAdjustingStock(false);
    }
  };

  // ── Order Fulfillment Form State ──────────────────────────────────────────
  const [fulfillment, setFulfillment] = useState({
    status: 'SHIPPED',
    trackingNumber: '',
    carrier: 'FedEx Ground',
  });
  const [fulfilling, setFulfilling] = useState(false);

  const handleUpdateFulfillment = async (e) => {
    e.preventDefault();
    if (!selectedSubOrder) return;
    setFulfilling(true);
    try {
      await updateVendorSubOrderStatus(selectedSubOrder.subOrderId, {
        status: fulfillment.status,
        trackingNumber: fulfillment.trackingNumber.trim() || undefined,
        carrier: fulfillment.carrier.trim() || undefined,
      });
      showToast(`Package ${selectedSubOrder.subOrderNumber} updated to ${fulfillment.status}!`);
      setFulfillModalOpen(false);
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update package fulfillment.');
    } finally {
      setFulfilling(false);
    }
  };

  // ── Store Profile Edit Form Actions ───────────────────────────────────────

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    try {
      const sportsSpecialization = profileForm.sportsOffered
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const updated = await updateMyVendorProfile({
        storeName: profileForm.storeName.trim(),
        description: profileForm.description.trim(),
        contactEmail: profileForm.contactEmail.trim(),
        contactPhone: profileForm.contactPhone.trim(),
        sportsSpecialization,
      });
      setProfile(updated.profile || updated);
      showToast('Store settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.sportType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-7xl mx-auto">
      {/* ── Top Store Banner & Header ─────────────────────── */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-brand-bg border border-brand-border text-brand-accent flex items-center justify-center font-black text-xl shadow-glow">
            {profile?.storeName ? profile.storeName.charAt(0).toUpperCase() : 'V'}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                {profile?.storeName || 'Vendor Merchant Portal'}
              </h1>
              <Badge variant="accent" size="xs" className="flex items-center gap-1">
                <ShieldCheck size={12} />
                {profile?.isVerified ? 'Verified Vendor' : 'Seller Partner'}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Commission Rate:{' '}
              <strong className="text-text-primary">
                {Number((profile?.commissionRate ?? 0.1) * 100).toFixed(0)}%
              </strong>{' '}
              • Managed by Sports Marketplace Logistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            loading={loading}
            className="flex items-center gap-1.5 text-xs"
            title="Refresh dashboard stats"
          >
            <RotateCw size={13} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setActiveTab('products');
              setCreateProductOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs shadow-glow"
          >
            <Plus size={14} /> New Sports Gear
          </Button>
        </div>
      </div>

      {/* ── Toasts & Alerts ───────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="p-1 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
            activeTab === 'overview'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <LayoutDashboard size={15} /> Overview & Financials
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
            activeTab === 'products'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Package size={15} /> Products & Inventory ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
            activeTab === 'orders'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Truck size={15} /> Fulfillment & Orders ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
            activeTab === 'profile'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Settings size={15} /> Store Settings
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & FINANCIALS ──────────────────── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-text-muted text-xs">
                <span>Gross Marketplace Sales</span>
                <DollarSign size={16} className="text-brand-accent" />
              </div>
              <span className="text-2xl font-black text-text-primary">
                ${Number(settlement?.grossSales || 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-400">
                Total customer revenue processed
              </span>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-text-muted text-xs">
                <span>Marketplace Fee (Commission)</span>
                <TrendingUp size={16} className="text-text-muted" />
              </div>
              <span className="text-2xl font-black text-text-muted">
                -${Number(settlement?.marketplaceCommission || 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-text-muted">
                Platform maintenance & escrow guarantee
              </span>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-2 shadow-glow">
              <div className="flex items-center justify-between text-text-muted text-xs">
                <span>Net Payout Balance</span>
                <DollarSign size={16} className="text-emerald-400" />
              </div>
              <span className="text-2xl font-black text-brand-accent">
                ${Number(settlement?.netPayoutDue || 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-text-muted">
                Ready for automated merchant disbursement
              </span>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-text-muted text-xs">
                <span>Fulfillment Packages</span>
                <Package size={16} className="text-brand-accent" />
              </div>
              <span className="text-2xl font-black text-text-primary">
                {orders.length}
              </span>
              <span className="text-[11px] text-text-muted">
                {orders.filter((o) => o.subOrderStatus === 'DELIVERED').length} delivered •{' '}
                {orders.filter((o) => o.subOrderStatus !== 'DELIVERED').length} active
              </span>
            </div>
          </div>

          {/* Recent Orders Overview Table */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Recent Assigned Packages
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-xs text-brand-accent hover:underline cursor-pointer"
              >
                View all orders →
              </button>
            </div>

            {orders.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {orders.slice(0, 5).map((ord) => (
                  <div
                    key={ord.subOrderId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-bg border border-brand-border text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-text-primary">
                        {ord.subOrderNumber}
                      </span>
                      <Badge variant="accent" size="xs">
                        {ord.subOrderStatus}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-text-muted">
                      <span>{ord.itemsCount || 1} item(s)</span>
                      <span className="font-bold text-text-primary">
                        ${Number(ord.subtotalAmount || 0).toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSubOrder(ord);
                          setFulfillment({
                            status: ord.subOrderStatus || 'SHIPPED',
                            trackingNumber: ord.trackingNumber || '',
                            carrier: ord.carrier || 'FedEx Ground',
                          });
                          setFulfillModalOpen(true);
                        }}
                        className="py-1 px-2.5 text-[11px]"
                      >
                        Update Status
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-text-muted">
                No orders assigned yet. Once customers purchase your gear, packages will appear here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: PRODUCTS & INVENTORY ───────────────────── */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search products by title, SKU, or sport..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-accent"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>

            <Button
              size="sm"
              onClick={() => setCreateProductOpen(true)}
              className="flex items-center gap-1.5 text-xs shadow-glow"
            >
              <Plus size={14} /> Add Sports Product
            </Button>
          </div>

          {/* Products List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredProducts.map((p) => {
                const img = getProductImage(p);
                const variantsList = p.variants || [];

                return (
                  <div
                    key={p.productId}
                    className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="size-16 rounded-lg bg-brand-bg border border-brand-border overflow-hidden shrink-0 flex items-center justify-center">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={22} className="text-brand-border" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-text-primary text-sm truncate">
                            {p.name}
                          </span>
                          <Badge variant="accent" size="xs" className="capitalize">
                            {p.sportType}
                          </Badge>
                          {p.isBulky && (
                            <Badge variant="warning" size="xs">
                              Heavy Freight
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                          <span>SKU: <strong className="text-text-primary">{p.sku}</strong></span>
                          <span>•</span>
                          <span>Category: {p.gearCategory}</span>
                          <span>•</span>
                          <span>Base: <strong className="text-brand-accent">${Number(p.basePrice).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Stock level & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border">
                      {variantsList.length > 0 && (
                        <div className="text-right pr-2">
                          <span className="text-[11px] text-text-muted block">Variants:</span>
                          <span className="text-xs font-bold text-text-primary">
                            {variantsList.length} options
                          </span>
                        </div>
                      )}

                      {variantsList.length > 0 && variantsList[0]?.variantId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVariant(variantsList[0]);
                            setStockInput(String(variantsList[0].inventory?.quantityOnHand || 20));
                            setAdjustStockModalOpen(true);
                          }}
                          className="py-1 px-2.5 text-xs flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Stock
                        </Button>
                      )}

                      <a
                        href={`/products/${p.productId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-brand-bg border border-brand-border text-text-muted hover:text-text-primary"
                        title="View Public Store Page"
                      >
                        <ExternalLink size={14} />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.productId)}
                        className="p-2 rounded-lg bg-brand-bg border border-brand-border text-text-muted hover:text-red-400"
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-brand-surface border border-brand-border rounded-2xl flex flex-col items-center gap-3">
              <Package size={32} className="text-text-muted" />
              <h3 className="font-bold text-text-primary text-sm">No products found</h3>
              <p className="text-xs text-text-muted max-w-sm">
                You haven&apos;t added any products or none match your search. Add your sports equipment catalog to start selling.
              </p>
              <Button size="sm" onClick={() => setCreateProductOpen(true)}>
                Add First Product
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ORDERS & LOGISTICS ─────────────────────── */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Fulfillment Logistics & Packages
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Update dispatched tracking numbers so customers can track packages.
              </p>
            </div>
            <span className="text-xs text-text-muted font-semibold bg-brand-surface border border-brand-border px-3 py-1.5 rounded-lg">
              {orders.length} total assigned
            </span>
          </div>

          {orders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {orders.map((ord) => (
                <div
                  key={ord.subOrderId}
                  className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-brand-bg border border-brand-border text-brand-accent flex items-center justify-center shrink-0">
                      <Truck size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-text-primary text-sm">
                          Package {ord.subOrderNumber}
                        </span>
                        <Badge variant="accent" size="xs">
                          {ord.subOrderStatus || 'PROCESSING'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted mt-1 flex-wrap">
                        <span>Items: {ord.itemsCount || 1}</span>
                        <span>•</span>
                        <span>
                          Tracking:{' '}
                          <strong className="text-text-primary">
                            {ord.trackingNumber ? `${ord.carrier || 'Courier'}: ${ord.trackingNumber}` : 'Not dispatched yet'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-text-muted block">Package Subtotal</span>
                      <span className="text-base font-black text-text-primary">
                        ${Number(ord.subtotalAmount || 0).toFixed(2)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSubOrder(ord);
                        setFulfillment({
                          status: ord.subOrderStatus || 'SHIPPED',
                          trackingNumber: ord.trackingNumber || '',
                          carrier: ord.carrier || 'FedEx Ground',
                        });
                        setFulfillModalOpen(true);
                      }}
                      className="text-xs py-1.5"
                    >
                      Update Logistics
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-brand-surface border border-brand-border rounded-2xl text-xs text-text-muted">
              No packages require fulfillment at this time.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: STORE SETTINGS ─────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 max-w-2xl">
          <h2 className="text-base font-bold text-text-primary pb-3 border-b border-brand-border">
            Vendor Store Profile
          </h2>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 mt-6">
            <Input
              id={`${idPrefix}-storeName`}
              name="storeName"
              label="Store Public Name"
              placeholder="Alpine Sports Pro"
              value={profileForm.storeName}
              onChange={(e) => setProfileForm((p) => ({ ...p, storeName: e.target.value }))}
              required
            />

            <Input
              id={`${idPrefix}-description`}
              name="description"
              label="About Your Store"
              placeholder="Specialized provider of high-grade athletic equipment..."
              value={profileForm.description}
              onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))}
              textarea
              rows={3}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id={`${idPrefix}-email`}
                name="contactEmail"
                type="email"
                label="Public Business Email"
                placeholder="sales@alpinesports.com"
                value={profileForm.contactEmail}
                onChange={(e) => setProfileForm((p) => ({ ...p, contactEmail: e.target.value }))}
              />
              <Input
                id={`${idPrefix}-phone`}
                name="contactPhone"
                label="Customer Service Phone"
                placeholder="+1 (555) 839-2019"
                value={profileForm.contactPhone}
                onChange={(e) => setProfileForm((p) => ({ ...p, contactPhone: e.target.value }))}
              />
            </div>

            <Input
              id={`${idPrefix}-sports`}
              name="sportsOffered"
              label="Sports Disciplines (comma-separated)"
              placeholder="football, basketball, running, gym"
              value={profileForm.sportsOffered}
              onChange={(e) => setProfileForm((p) => ({ ...p, sportsOffered: e.target.value }))}
            />

            <div className="pt-3">
              <Button type="submit" loading={savingProfile} size="md">
                Save Store Settings
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: CREATE PRODUCT ─────────────────────────── */}
      {createProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="text-base font-bold text-text-primary">
                Add New Sports Equipment
              </h3>
              <button
                type="button"
                onClick={() => setCreateProductOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    id={`${idPrefix}-pname`}
                    label="Product Name"
                    placeholder="Pro Competition Match Ball"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text-muted block mb-1.5">
                    Category
                  </label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-accent cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  id={`${idPrefix}-psku`}
                  label="SKU Identifier"
                  placeholder="BALL-PRO-01"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))}
                  required
                />

                <Input
                  id={`${idPrefix}-pprice`}
                  type="number"
                  step="0.01"
                  label="Base Price ($)"
                  placeholder="39.99"
                  value={newProduct.basePrice}
                  onChange={(e) => setNewProduct((p) => ({ ...p, basePrice: e.target.value }))}
                  required
                />

                <div>
                  <label className="text-sm font-medium text-text-muted block mb-1.5">
                    Sport Type
                  </label>
                  <select
                    value={newProduct.sportType}
                    onChange={(e) => setNewProduct((p) => ({ ...p, sportType: e.target.value }))}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-text-primary capitalize focus:outline-none focus:border-brand-accent cursor-pointer"
                  >
                    {SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-muted block mb-1.5">
                    Gear Category
                  </label>
                  <select
                    value={newProduct.gearCategory}
                    onChange={(e) => setNewProduct((p) => ({ ...p, gearCategory: e.target.value }))}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-accent cursor-pointer"
                  >
                    {GEAR_CATEGORIES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-muted block mb-1.5">
                    Skill Level
                  </label>
                  <select
                    value={newProduct.skillLevel}
                    onChange={(e) => setNewProduct((p) => ({ ...p, skillLevel: e.target.value }))}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-accent cursor-pointer"
                  >
                    {SKILL_LEVELS.map((sl) => (
                      <option key={sl} value={sl}>
                        {sl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    id={`${idPrefix}-images`}
                    label="Image URLs (comma-separated)"
                    placeholder="https://images.unsplash.com/photo-1..., https://..."
                    value={newProduct.imagesInput}
                    onChange={(e) => setNewProduct((p) => ({ ...p, imagesInput: e.target.value }))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    id={`${idPrefix}-desc`}
                    label="Description"
                    placeholder="Detailed specifications, grip texture, materials used..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                    textarea
                    rows={2}
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id={`${idPrefix}-bulky`}
                    checked={newProduct.isBulky}
                    onChange={(e) => setNewProduct((p) => ({ ...p, isBulky: e.target.checked }))}
                    className="rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-brand-bg size-4"
                  />
                  <label htmlFor={`${idPrefix}-bulky`} className="text-xs font-medium text-text-muted cursor-pointer">
                    Heavy / Bulky Equipment (Requires Freight Carrier)
                  </label>
                </div>

                {/* Initial Variant Details */}
                <div className="sm:col-span-2 pt-3 border-t border-brand-border">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                    Initial Variant & Stock
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Input
                      id={`${idPrefix}-vname`}
                      label="Variant Name"
                      placeholder="Size 5"
                      value={newProduct.variantName}
                      onChange={(e) => setNewProduct((p) => ({ ...p, variantName: e.target.value }))}
                    />
                    <Input
                      id={`${idPrefix}-vweight`}
                      label="Weight (Kg)"
                      placeholder="0.45"
                      value={newProduct.variantWeightKg}
                      onChange={(e) => setNewProduct((p) => ({ ...p, variantWeightKg: e.target.value }))}
                    />
                    <Input
                      id={`${idPrefix}-vstock`}
                      type="number"
                      label="Stock Count"
                      placeholder="25"
                      value={newProduct.initialStock}
                      onChange={(e) => setNewProduct((p) => ({ ...p, initialStock: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setCreateProductOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="md" loading={productSubmitting}>
                  Create & List Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: UPDATE LOGISTICS / FULFILLMENT ──────────── */}
      {fulfillModalOpen && selectedSubOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="text-sm font-bold text-text-primary">
                Update Fulfillment: {selectedSubOrder.subOrderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setFulfillModalOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateFulfillment} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-text-muted block mb-1">
                  Package Status
                </label>
                <select
                  value={fulfillment.status}
                  onChange={(e) => setFulfillment((f) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-accent cursor-pointer"
                >
                  <option value="PROCESSING">PROCESSING (Packing in warehouse)</option>
                  <option value="SHIPPED">SHIPPED (Handed to courier)</option>
                  <option value="DELIVERED">DELIVERED (Verified arrival)</option>
                </select>
              </div>

              <Input
                id={`${idPrefix}-carrier`}
                label="Shipping Carrier"
                placeholder="FedEx, UPS, DHL, Heavy Freight Lines"
                value={fulfillment.carrier}
                onChange={(e) => setFulfillment((f) => ({ ...f, carrier: e.target.value }))}
              />

              <Input
                id={`${idPrefix}-tracking`}
                label="Courier Tracking Number"
                placeholder="TRK-9821-4458"
                value={fulfillment.trackingNumber}
                onChange={(e) => setFulfillment((f) => ({ ...f, trackingNumber: e.target.value }))}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setFulfillModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={fulfilling}>
                  Update Package
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADJUST INVENTORY STOCK ─────────────────── */}
      {adjustStockModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <h3 className="text-sm font-bold text-text-primary">
                Adjust Inventory
              </h3>
              <button
                type="button"
                onClick={() => setAdjustStockModalOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Updating quantity on hand for variant:{' '}
              <strong className="text-text-primary">{selectedVariant.variantName}</strong>
            </p>

            <form onSubmit={handleAdjustInventorySubmit} className="flex flex-col gap-4">
              <Input
                id={`${idPrefix}-stock`}
                type="number"
                min="0"
                label="Units In Warehouse"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setAdjustStockModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={adjustingStock}>
                  Save Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
