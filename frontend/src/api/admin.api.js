import api from './client.js';

/**
 * Admin API integration client.
 * Connects to /api/v1/admin/categories endpoints.
 */

export const getAdminCategories = () =>
  api.get('/admin/categories').then((r) => r.data);

export const createAdminCategory = (payload) =>
  api.post('/admin/categories', payload).then((r) => r.data);

export const updateAdminCategory = (categoryId, payload) =>
  api.put(`/admin/categories/${categoryId}`, payload).then((r) => r.data);

export const deleteAdminCategory = (categoryId, hard = false) =>
  api.delete(`/admin/categories/${categoryId}`, { params: { hard } }).then((r) => r.data);

/**
 * Admin Vendor Management endpoints.
 * Connects to /api/v1/admin/vendors endpoints.
 */
export const getAdminVendors = () =>
  api.get('/admin/vendors').then((r) => r.data);

export const createAdminVendor = (payload) =>
  api.post('/admin/vendors', payload).then((r) => r.data);

export const assignAdminVendorRole = (userId, payload) =>
  api.post(`/admin/vendors/assign/${userId}`, payload).then((r) => r.data);
