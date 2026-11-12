import api from './client.js';

/**
 * Orders & Checkout API client.
 * Interacts with /api/v1/checkout and /api/v1/orders endpoints.
 */

export const processCheckout = (payload) =>
  api.post('/checkout/process', payload).then((r) => r.data);

export const getOrders = () =>
  api.get('/orders').then((r) => r.data);

export const getOrderById = (orderId) =>
  api.get(`/orders/${orderId}`).then((r) => r.data);

export const trackOrder = (orderId) =>
  api.get(`/orders/${orderId}/track`).then((r) => r.data);

export const verifyChapaPayment = (txRef) =>
  api.get(`/checkout/chapa/verify/${txRef}`).then((r) => r.data);
