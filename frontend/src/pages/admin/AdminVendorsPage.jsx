import { useState, useEffect, useCallback, useId } from 'react';
import {
  Store,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Building2,
  Mail,
  Phone,
  RotateCw,
  Tag,
} from 'lucide-react';
import {
  getAdminVendors,
  createAdminVendor,
  assignAdminVendorRole,
} from '../../api/admin.api.js';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

export default function AdminVendorsPage() {
  const idPrefix = useId();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'UNVERIFIED'

  // Modal Controls
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Create Vendor Form State
  const [createForm, setCreateForm] = useState({
    storeName: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    sportsSpecialization: '',
    description: '',
  });

  // Assign Vendor Form State
  const [assignForm, setAssignForm] = useState({
    userId: '',
    storeName: '',
    sportsSpecialization: '',
    description: '',
  });

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminVendors();
      setVendors(data?.vendors || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve vendors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      await Promise.resolve();
      if (isMounted) {
        loadVendors();
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadVendors]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 4000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Create Vendor Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!createForm.storeName.trim()) {
      setFormError('Store name is required.');
      return;
    }
    if (!createForm.email.trim() || !createForm.password.trim()) {
      setFormError('Email and temporary password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const sportsArray = createForm.sportsSpecialization
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createAdminVendor({
        storeName: createForm.storeName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        firstName: createForm.firstName.trim() || 'Vendor',
        lastName: createForm.lastName.trim() || 'Seller',
        sportsSpecialization: sportsArray,
        description: createForm.description.trim() || undefined,
      });

      setSuccessToast(`Vendor "${createForm.storeName}" created successfully!`);
      setCreateModalOpen(false);
      setCreateForm({
        storeName: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        sportsSpecialization: '',
        description: '',
      });
      await loadVendors();
    } catch (err) {
      console.error('Create vendor failed:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to create vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Role Handler
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!assignForm.userId.trim()) {
      setFormError('Target User ID is required.');
      return;
    }
    if (!assignForm.storeName.trim()) {
      setFormError('Store name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const sportsArray = assignForm.sportsSpecialization
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await assignAdminVendorRole(assignForm.userId.trim(), {
        storeName: assignForm.storeName.trim(),
        sportsSpecialization: sportsArray,
        description: assignForm.description.trim() || undefined,
      });

      setSuccessToast(`Seller role successfully assigned to user!`);
      setAssignModalOpen(false);
      setAssignForm({
        userId: '',
        storeName: '',
        sportsSpecialization: '',
        description: '',
      });
      await loadVendors();
    } catch (err) {
      console.error('Assign vendor role failed:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to assign vendor role.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Vendors
  const filteredVendors = vendors.filter((v) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.storeName?.toLowerCase().includes(q) ||
      v.slug?.toLowerCase().includes(q) ||
      v.contactEmail?.toLowerCase().includes(q) ||
      v.user?.email?.toLowerCase().includes(q) ||
      (Array.isArray(v.sportsSpecialization) &&
        v.sportsSpecialization.some((s) => s.toLowerCase().includes(q)));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && v.isVerified) ||
      (statusFilter === 'UNVERIFIED' && !v.isVerified);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pb-16 max-w-7xl mx-auto">
      <AdminHeader
        title="Vendor Management"
        description="Oversee verified marketplace merchants, register new sports vendors, and assign seller privileges."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormError(null);
                setAssignModalOpen(true);
              }}
              className="gap-1.5"
            >
              <UserCheck size={16} />
              <span className="hidden sm:inline">Assign Role</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError(null);
                setCreateModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus size={16} />
              <span>Add Vendor</span>
            </Button>
          </div>
        }
      />

      {/* ── Success Toast Alert ────────────────────────────────────────── */}
      {successToast && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400/80 hover:text-emerald-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Error Banner ──────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by store, email, sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-text-muted">Status:</span>
          <div className="flex rounded-lg border border-brand-border p-0.5 bg-brand-bg text-xs">
            {['ALL', 'VERIFIED', 'UNVERIFIED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-brand-surface text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadVendors}
            disabled={loading}
            title="Refresh Vendors"
            className="p-2"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* ── Vendor Cards Grid / List ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-brand-surface border border-brand-border">
          <Building2 size={36} className="text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-bold text-text-primary mb-1">
            No Vendors Found
          </h3>
          <p className="text-sm text-text-muted mb-5 max-w-sm mx-auto">
            {search
              ? 'No registered vendors matched your search criteria.'
              : 'There are currently no sports vendors registered on the platform.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5"
          >
            <Plus size={16} />
            <span>Onboard First Vendor</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.vendorId}
              className="p-5 rounded-2xl bg-brand-surface border border-brand-border flex flex-col justify-between shadow-xs hover:border-brand-border/80 transition-all"
            >
              <div>
                {/* Header: Store Name & Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center font-bold text-base shrink-0">
                      <Store size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-text-primary truncate">
                        {vendor.storeName}
                      </h3>
                      <p className="text-xs text-text-muted font-mono truncate">
                        /{vendor.slug}
                      </p>
                    </div>
                  </div>

                  {vendor.isVerified ? (
                    <Badge variant="accent" size="sm">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Pending
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {vendor.description && (
                  <p className="text-xs text-text-muted mb-4 line-clamp-2">
                    {vendor.description}
                  </p>
                )}

                {/* Contact Details */}
                <div className="space-y-1.5 py-3 border-t border-brand-border/60 text-xs">
                  <div className="flex items-center gap-2 text-text-muted truncate">
                    <Mail size={13} className="shrink-0" />
                    <span className="truncate">
                      {vendor.contactEmail || vendor.user?.email || 'N/A'}
                    </span>
                  </div>
                  {vendor.contactPhone && (
                    <div className="flex items-center gap-2 text-text-muted truncate">
                      <Phone size={13} className="shrink-0" />
                      <span>{vendor.contactPhone}</span>
                    </div>
                  )}
                  {vendor.user && (
                    <div className="text-[11px] text-text-muted/80 mt-1">
                      Account: {vendor.user.firstName} {vendor.user.lastName} ({vendor.user.userId.slice(0, 8)}...)
                    </div>
                  )}
                </div>
              </div>

              {/* Specializations Tags */}
              <div className="mt-3 pt-3 border-t border-brand-border/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-1.5">
                  Sports Focus:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(vendor.sportsSpecialization) &&
                  vendor.sportsSpecialization.length > 0 ? (
                    vendor.sportsSpecialization.map((sport) => (
                      <span
                        key={sport}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-bg border border-brand-border text-text-primary flex items-center gap-1"
                      >
                        <Tag size={10} className="text-brand-accent" />
                        <span>{sport}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted italic">
                      General Sports Equipment
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Register New Vendor ─────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-brand-accent/15 text-brand-accent">
                  <Building2 size={18} />
                </span>
                <h2 className="text-lg font-bold text-text-primary">
                  Register New Sports Vendor
                </h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Store / Vendor Name *
                </label>
                <Input
                  id={`${idPrefix}-storeName`}
                  placeholder="e.g. Apex Martial Arts, ProStrike Soccer"
                  value={createForm.storeName}
                  onChange={(e) => setCreateForm({ ...createForm, storeName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    First Name
                  </label>
                  <Input
                    id={`${idPrefix}-firstName`}
                    placeholder="Owner First Name"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Last Name
                  </label>
                  <Input
                    id={`${idPrefix}-lastName`}
                    placeholder="Owner Last Name"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Login / Contact Email *
                  </label>
                  <Input
                    id={`${idPrefix}-email`}
                    type="email"
                    placeholder="vendor@company.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Temporary Password *
                  </label>
                  <Input
                    id={`${idPrefix}-password`}
                    type="password"
                    placeholder="Min 8 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Sports Specialization (comma-separated)
                </label>
                <Input
                  id={`${idPrefix}-sports`}
                  placeholder="e.g. boxing, football, tennis, running"
                  value={createForm.sportsSpecialization}
                  onChange={(e) => setCreateForm({ ...createForm, sportsSpecialization: e.target.value })}
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  Tags allow customers to find this vendor in filtered sports searches.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Store Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of the athletic catalog and brands carried..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent transition-colors resize-none"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Register Vendor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Assign Vendor Role to Existing User ─────────────────── */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                  <UserCheck size={18} />
                </span>
                <h2 className="text-lg font-bold text-text-primary">
                  Assign Seller Role to User
                </h2>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  User ID (UUID) *
                </label>
                <Input
                  id={`${idPrefix}-userId`}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  required
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  Promotes an existing registered customer account to SELLER and creates their store profile.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Store / Vendor Name *
                </label>
                <Input
                  id={`${idPrefix}-assignStoreName`}
                  placeholder="e.g. Velocity Sports Hub"
                  value={assignForm.storeName}
                  onChange={(e) => setAssignForm({ ...assignForm, storeName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Sports Specialization (comma-separated)
                </label>
                <Input
                  id={`${idPrefix}-assignSports`}
                  placeholder="e.g. swimming, gym, fitness"
                  value={assignForm.sportsSpecialization}
                  onChange={(e) => setAssignForm({ ...assignForm, sportsSpecialization: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional store summary..."
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-brand-bg border border-brand-border text-sm text-text-primary focus:outline-none focus:border-brand-accent transition-colors resize-none"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAssignModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Assign Role & Verify
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
