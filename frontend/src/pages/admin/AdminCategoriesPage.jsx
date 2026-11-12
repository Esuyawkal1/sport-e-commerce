import { useState, useEffect, useId, useCallback } from 'react';
import {
  Shield,
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Trash2,
  Check,
  RotateCw,
} from 'lucide-react';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../api/admin.api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

export default function AdminCategoriesPage() {
  const idPrefix = useId();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Modal Controls
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentCategoryId: '',
    iconUrl: '',
    imageUrl: '',
    displayOrder: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCategories();
      setCategories(data?.categories || []);
    } catch (err) {
      console.error('Failed to load admin categories:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      await Promise.resolve();
      if (isMounted) loadCategories();
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim() || formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        parentCategoryId: formData.parentCategoryId || null,
        iconUrl: formData.iconUrl.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        displayOrder: parseInt(formData.displayOrder, 10) || 1,
      };

      await createAdminCategory(payload);
      showToast(`Category "${payload.name}" created successfully!`);
      setCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        slug: '',
        parentCategoryId: '',
        iconUrl: '',
        imageUrl: '',
        displayOrder: 1,
      });
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setSubmitting(true);
    setError(null);

    try {
      await updateAdminCategory(selectedCategory.categoryId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim(),
        parentCategoryId: formData.parentCategoryId || null,
        iconUrl: formData.iconUrl.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        displayOrder: parseInt(formData.displayOrder, 10) || 1,
      });
      showToast(`Category "${formData.name}" updated successfully!`);
      setEditModalOpen(false);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      await updateAdminCategory(cat.categoryId, {
        isActive: !cat.isActive,
      });
      showToast(`Category "${cat.name}" marked as ${!cat.isActive ? 'Active' : 'Inactive'}.`);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle category status.');
    }
  };

  const handleDelete = async (categoryId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    try {
      await deleteAdminCategory(categoryId, false);
      showToast(`Category "${catName}" archived successfully.`);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto">
      {/* ── Admin Header ─────────────────────────────────── */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-brand-bg border border-brand-border text-brand-accent flex items-center justify-center font-bold text-xl shadow-glow">
            <Shield size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                Taxonomy & Category Manager
              </h1>
              <Badge variant="accent" size="xs">
                Admin Panel
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Dynamically structure sports disciplines, hierarchy, and store catalog taxonomy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            loading={loading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RotateCw size={13} /> Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                slug: '',
                parentCategoryId: '',
                iconUrl: '',
                imageUrl: '',
                displayOrder: categories.length + 1,
              });
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs shadow-glow"
          >
            <Plus size={14} /> Add Category
          </Button>
        </div>
      </div>

      {/* ── Feedback Toasts ──────────────────────────────── */}
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

      {/* ── Summary Counters ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-text-muted">Total Disciplines / Categories</span>
          <span className="text-2xl font-black text-text-primary">{categories.length}</span>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-text-muted">Active in Marketplace</span>
          <span className="text-2xl font-black text-emerald-400">
            {categories.filter((c) => c.isActive).length}
          </span>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-text-muted">Sub-Categories / Nested</span>
          <span className="text-2xl font-black text-brand-accent">
            {categories.filter((c) => c.parentCategoryId).length}
          </span>
        </div>
      </div>

      {/* ── Search & Filter ──────────────────────────────── */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter categories by name, slug, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-brand-surface border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-accent"
        />
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>

      {/* ── Categories Table ─────────────────────────────── */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="divide-y divide-brand-border">
            {filteredCategories.map((cat) => (
              <div
                key={cat.categoryId}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-bg/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-10 rounded-lg bg-brand-bg border border-brand-border text-brand-accent flex items-center justify-center font-bold text-xs shrink-0">
                    <Layers size={18} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-text-primary text-sm">
                        {cat.name}
                      </span>
                      <span className="font-mono text-[11px] text-text-muted bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
                        /{cat.slug}
                      </span>
                      <Badge variant={cat.isActive ? 'success' : 'default'} size="xs">
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {cat.parentCategoryId && (
                        <Badge variant="default" size="xs">
                          Sub-Category
                        </Badge>
                      )}
                    </div>

                    {cat.description && (
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(cat)}
                    className="py-1 px-2.5 text-xs flex items-center gap-1"
                    title={cat.isActive ? 'Deactivate Category' : 'Activate Category'}
                  >
                    <Check size={12} /> {cat.isActive ? 'Hide' : 'Publish'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setFormData({
                        name: cat.name || '',
                        description: cat.description || '',
                        slug: cat.slug || '',
                        parentCategoryId: cat.parentCategoryId || '',
                        iconUrl: cat.iconUrl || '',
                        imageUrl: cat.imageUrl || '',
                        displayOrder: cat.displayOrder || 1,
                      });
                      setEditModalOpen(true);
                    }}
                    className="py-1 px-2.5 text-xs flex items-center gap-1"
                  >
                    <Edit3 size={12} /> Edit
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDelete(cat.categoryId, cat.name)}
                    className="p-1.5 rounded-lg bg-brand-bg border border-brand-border text-text-muted hover:text-red-400 cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-text-muted">
            No categories match your search. Click &quot;Add Category&quot; to expand the sports catalog.
          </div>
        )}
      </div>

      {/* ── MODAL: CREATE / EDIT CATEGORY ─────────────────── */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-lg p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="text-base font-bold text-text-primary">
                {createModalOpen ? 'Create Sports Category' : `Edit Category: ${selectedCategory?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={createModalOpen ? handleCreateSubmit : handleEditSubmit}
              className="flex flex-col gap-4 text-xs"
            >
              <Input
                id={`${idPrefix}-catname`}
                label="Category Name"
                placeholder="Racket Sports & Squash"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                required
              />

              <Input
                id={`${idPrefix}-catslug`}
                label="URL Slug (Optional — auto-generated from name)"
                placeholder="racket-sports"
                value={formData.slug}
                onChange={(e) => setFormData((f) => ({ ...f, slug: e.target.value }))}
              />

              <div>
                <label className="font-semibold text-text-muted block mb-1">
                  Parent Category (Hierarchy)
                </label>
                <select
                  value={formData.parentCategoryId}
                  onChange={(e) => setFormData((f) => ({ ...f, parentCategoryId: e.target.value }))}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-accent cursor-pointer"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => c.categoryId !== selectedCategory?.categoryId)
                    .map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <Input
                id={`${idPrefix}-catdesc`}
                label="Description"
                placeholder="Equipment and accessories for tennis, badminton, squash..."
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                textarea
                rows={2}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id={`${idPrefix}-order`}
                  type="number"
                  label="Display Order"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData((f) => ({ ...f, displayOrder: e.target.value }))}
                />
                <Input
                  id={`${idPrefix}-icon`}
                  label="Icon / Emoji"
                  placeholder="🎾 or https://..."
                  value={formData.iconUrl}
                  onChange={(e) => setFormData((f) => ({ ...f, iconUrl: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={submitting}>
                  {createModalOpen ? 'Create Category' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
