import api from './client.js';

/**
 * Auth API helpers — thin wrappers that return only the response data.
 */

export const registerUser = (payload) =>
  api.post('/auth/register', payload).then((r) => r.data);

export const loginUser = (payload) =>
  api.post('/auth/login', payload).then((r) => r.data);

export const getMyProfile = () =>
  api.get('/auth/me').then((r) => r.data);
