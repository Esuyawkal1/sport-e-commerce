import { createContext, useContext, useState, useCallback } from 'react';
import { loginUser, registerUser, registerSeller } from '../api/auth.api.js';

const AuthContext = createContext(null);

const STORAGE_TOKEN = 'token';
const STORAGE_USER  = 'user';

function loadStored() {
  try {
    const user  = JSON.parse(localStorage.getItem(STORAGE_USER) ?? 'null');
    const token = localStorage.getItem(STORAGE_TOKEN) ?? null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const stored = loadStored();
  const [user,  setUser]  = useState(stored.user);
  const [token, setToken] = useState(stored.token);

  const persist = useCallback((userData, jwt) => {
    localStorage.setItem(STORAGE_TOKEN, jwt);
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    setUser(userData);
    setToken(jwt);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    const enrichedUser = {
      ...(data.user || {}),
      roles: data.roles || [],
      vendorProfile: data.vendorProfile || null,
    };
    persist(enrichedUser, data.token);
    return enrichedUser;
  }, [persist]);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    const enrichedUser = {
      ...(data.user || {}),
      roles: data.role ? [data.role] : [],
      vendorProfile: null,
    };
    persist(enrichedUser, data.token);
    return enrichedUser;
  }, [persist]);

  const registerVendor = useCallback(async (payload) => {
    const data = await registerSeller(payload);
    const enrichedUser = {
      ...(data.user || {}),
      roles: data.role ? [data.role] : [{ roleType: 'SELLER' }],
      vendorProfile: data.vendorProfile || null,
    };
    persist(enrichedUser, data.token);
    return enrichedUser;
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setUser(null);
    setToken(null);
  }, []);

  const isAuthenticated = Boolean(token);
  const rolesList = (user?.roles || []).map((r) => (typeof r === 'string' ? r : r.roleType));
  const isAdmin  = rolesList.includes('ADMIN') || user?.role === 'admin';
  const isVendor = rolesList.includes('SELLER') || rolesList.includes('VENDOR') || user?.role === 'vendor' || Boolean(user?.vendorProfile);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isAdmin,
      isVendor,
      login,
      register,
      registerVendor,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
