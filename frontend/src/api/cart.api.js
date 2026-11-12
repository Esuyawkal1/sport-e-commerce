import api from './client.js';

/**
 * Shopping Cart API client.
 * Interacts with /api/v1/cart endpoints.
 */

export const getCart = () =>
  api.get('/cart').then((r) => r.data);

export const addToCart = ({ variantId, quantity }) =>
  api.post('/cart/items', { variantId, quantity }).then((r) => r.data);

export const updateCartItem = (cartItemId, quantity) =>
  api.patch(`/cart/items/${cartItemId}`, { quantity }).then((r) => r.data);

export const removeCartItem = (cartItemId) =>
  api.delete(`/cart/items/${cartItemId}`).then((r) => r.data);

export const applyCoupon = (code) =>
  api.post('/cart/coupon', { code }).then((r) => r.data);

export const removeCoupon = () =>
  api.delete('/cart/coupon').then((r) => r.data);
