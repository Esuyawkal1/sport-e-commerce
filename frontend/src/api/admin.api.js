import api from './client.js';

/**
 * Admin API integration client.
 * Connects to /api/v1/admin/categories and /api/v1/admin/products endpoints.
 */

// Categories Management
export const getAdminCategories = () =>
  api.get('/admin/categories').then((r) => r.data);

export const createAdminCategory = (payload) =>
  api.post('/admin/categories', payload).then((r) => r.data);

export const updateAdminCategory = (categoryId, payload) =>
  api.put(`/admin/categories/${categoryId}`, payload).then((r) => r.data);

export const deleteAdminCategory = (categoryId, hard = false) =>
  api.delete(`/admin/categories/${categoryId}`, { params: { hard } }).then((r) => r.data);

// Products & Inventory Management
export const getAdminProducts = (params) =>
  api.get('/admin/products', { params }).then((r) => r.data);

export const getAdminProductById = (productId) =>
  api.get(`/admin/products/${productId}`).then((r) => r.data);

export const createAdminProduct = (payload) =>
  api.post('/admin/products', payload).then((r) => r.data);

export const updateAdminProduct = (productId, payload) =>
  api.put(`/admin/products/${productId}`, payload).then((r) => r.data);

export const deleteAdminProduct = (productId, hard = false) =>
  api.delete(`/admin/products/${productId}`, { params: { hard } }).then((r) => r.data);

export const adjustAdminInventory = (variantId, payload) =>
  api.patch(`/admin/products/inventory/${variantId}`, payload).then((r) => r.data);
