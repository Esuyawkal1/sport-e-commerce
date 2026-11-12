import api from './client.js';

/**
 * Vendor API integration client.
 * Connects to /api/v1/vendors and /api/v1/vendor endpoints.
 */

// ── Profile ───────────────────────────────────────────────────────────────
export const getMyVendorProfile = () =>
  api.get('/vendors/me/profile').then((r) => r.data);

export const updateMyVendorProfile = (payload) =>
  api.put('/vendors/me/profile', payload).then((r) => r.data);

// ── Products & Inventory ─────────────────────────────────────────────────
export const getVendorProducts = (params = {}) =>
  api.get('/vendor/products', { params }).then((r) => r.data);

export const getVendorProductById = (productId) =>
  api.get(`/vendor/products/${productId}`).then((r) => r.data);

export const createVendorProduct = (payload) =>
  api.post('/vendor/products', payload).then((r) => r.data);

export const updateVendorProduct = (productId, payload) =>
  api.put(`/vendor/products/${productId}`, payload).then((r) => r.data);

export const deleteVendorProduct = (productId) =>
  api.delete(`/vendor/products/${productId}`).then((r) => r.data);

export const adjustVendorInventory = (variantId, payload) =>
  api.patch(`/vendor/inventory/${variantId}`, payload).then((r) => r.data);

// ── Orders & Logistics ───────────────────────────────────────────────────
export const getVendorOrders = (params = {}) =>
  api.get('/vendor/orders', { params }).then((r) => r.data);

export const getVendorSubOrderById = (subOrderId) =>
  api.get(`/vendor/orders/${subOrderId}`).then((r) => r.data);

export const updateVendorSubOrderStatus = (subOrderId, payload) =>
  api.patch(`/vendor/orders/${subOrderId}/status`, payload).then((r) => r.data);

// ── Settlement & Financials ──────────────────────────────────────────────
export const getVendorSettlement = () =>
  api.get('/vendor/settlements').then((r) => r.data);
