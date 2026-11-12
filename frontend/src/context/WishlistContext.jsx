import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flyHeartToNav } from '../lib/wishlistAnimation.js';

const WISHLIST_STORAGE_KEY = 'sportmarket_wishlist';

function loadWishlistFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWishlistToStorage(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save wishlist to storage:', err);
  }
}

const WishlistContext = createContext({
  wishlist: [],
  wishlistCount: 0,
  isWishlisted: () => false,
  toggleWishlist: () => false,
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  clearWishlist: () => {},
});

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(loadWishlistFromStorage);

  // Sync across tabs and external custom events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === WISHLIST_STORAGE_KEY) {
        setWishlist(loadWishlistFromStorage());
      }
    };

    const handleWishlistUpdated = (e) => {
      const { id, isWishlisted } = e.detail || {};
      setWishlist((prev) => {
        const exists = prev.includes(id);
        if (isWishlisted && !exists) {
          return [...prev, id];
        }
        if (!isWishlisted && exists) {
          return prev.filter((item) => item !== id);
        }
        return prev;
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, []);

  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlist.includes(productId);
    },
    [wishlist],
  );

  const addToWishlist = useCallback(
    (productId, originElement) => {
      if (!productId) return;
      setWishlist((prev) => {
        if (prev.includes(productId)) return prev;
        const updated = [...prev, productId];
        saveWishlistToStorage(updated);
        window.dispatchEvent(
          new CustomEvent('wishlist-updated', {
            detail: { id: productId, isWishlisted: true },
          }),
        );
        return updated;
      });

      if (originElement) {
        flyHeartToNav(originElement);
      }
    },
    [],
  );

  const removeFromWishlist = useCallback((productId) => {
    if (!productId) return;
    setWishlist((prev) => {
      const updated = prev.filter((id) => id !== productId);
      saveWishlistToStorage(updated);
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { id: productId, isWishlisted: false },
        }),
      );
      return updated;
    });
  }, []);

  const toggleWishlist = useCallback(
    (productId, originElement) => {
      if (!productId) return false;
      const currentlyWishlisted = wishlist.includes(productId);
      if (currentlyWishlisted) {
        removeFromWishlist(productId);
        return false;
      }
      addToWishlist(productId, originElement);
      return true;
    },
    [wishlist, addToWishlist, removeFromWishlist],
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    saveWishlistToStorage([]);
    window.dispatchEvent(
      new CustomEvent('wishlist-updated', {
        detail: { cleared: true },
      }),
    );
  }, []);

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    isWishlisted,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
