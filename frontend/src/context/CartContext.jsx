import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} from '../api/cart.api.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data?.cart || data);
      return data;
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError(err.response?.data?.message || 'Failed to load shopping cart.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;
    async function initCart() {
      await Promise.resolve();
      if (!isMounted) return;
      if (isAuthenticated) {
        try {
          const data = await getCart();
          if (isMounted) setCart(data?.cart || data);
        } catch (err) {
          if (isMounted) {
            console.error('Failed to init cart:', err);
            setCart(null);
          }
        }
      } else {
        setCart(null);
      }
    }
    initCart();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (variantId, quantity = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await addToCart({ variantId, quantity });
        const updatedCart = data?.cart || data;
        setCart(updatedCart);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cart-item-added', {
              detail: { totalItems: updatedCart?.totalItems },
            }),
          );
        }
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to add item to bag.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateQuantity = useCallback(
    async (cartItemId, quantity) => {
      setLoading(true);
      setError(null);
      try {
        const data = await updateCartItem(cartItemId, quantity);
        setCart(data?.cart || data);
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to update item quantity.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      setLoading(true);
      setError(null);
      try {
        const data = await removeCartItem(cartItemId);
        setCart(data?.cart || data);
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to remove item.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const applyCouponCode = useCallback(
    async (code) => {
      setLoading(true);
      setError(null);
      try {
        const data = await applyCoupon(code);
        setCart(data?.cart || data);
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Invalid coupon code.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const removeCouponCode = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await removeCoupon();
        setCart(data?.cart || data);
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to remove coupon.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  const cartCount = cart?.totalItems ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        error,
        refreshCart,
        addItem,
        updateQuantity,
        removeItem,
        applyCouponCode,
        removeCouponCode,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
