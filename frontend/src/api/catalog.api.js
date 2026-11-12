import api from './client.js';

/**
 * Catalog API integration helpers.
 * Interacts with /api/v1 endpoints of the sports marketplace backend.
 */

export const getCategories = (params = {}) =>
  api.get('/categories', { params }).then((r) => r.data);

export const getProducts = (params = {}) =>
  api.get('/products', { params }).then((r) => r.data);

export const getProductById = (productId) =>
  api.get(`/products/${productId}`).then((r) => r.data);

export const getCatalogFacets = (params = {}) =>
  api.get('/facets', { params }).then((r) => r.data);
