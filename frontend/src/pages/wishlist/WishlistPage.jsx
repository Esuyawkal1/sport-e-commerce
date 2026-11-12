import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { getProducts, getProductById } from '../../api/catalog.api.js';
import ProductCard from '../../components/catalog/ProductCard.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';

export default function WishlistPage() {
  const { wishlist, wishlistCount, clearWishlist } = useWishlist();
  const [catalogProducts, setCatalogProducts] = useState(null);

  const loading = catalogProducts === null && wishlist.length > 0;

  useEffect(() => {
    if (wishlist.length === 0) {
      return;
    }

    let isMounted = true;

    getProducts({ limit: 100 })
      .then((data) => {
        if (!isMounted) return;
        const catalogList = data?.products || [];
        const matched = wishlist
          .map((id) => catalogList.find((p) => p.productId === id))
          .filter(Boolean);

        const missingIds = wishlist.filter(
          (id) => !catalogList.some((p) => p.productId === id),
        );

        if (missingIds.length > 0) {
          Promise.all(
            missingIds.map((id) =>
              getProductById(id)
                .then((d) => d?.product || d)
                .catch(() => null),
            ),
          ).then((fetchedMissing) => {
            if (!isMounted) return;
            const validMissing = fetchedMissing.filter(Boolean);
            setCatalogProducts([...matched, ...validMissing]);
          });
        } else {
          setCatalogProducts(matched);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        Promise.all(
          wishlist.map((id) =>
            getProductById(id)
              .then((d) => d?.product || d)
              .catch(() => null),
          ),
        ).then((res) => {
          if (!isMounted) return;
          setCatalogProducts(res.filter(Boolean));
        });
      });

    return () => {
      isMounted = false;
    };
  }, [wishlist]);

  const displayedProducts =
    wishlist.length === 0
      ? []
      : (catalogProducts || []).filter((p) => wishlist.includes(p.productId));

  return (
    <div className="flex flex-col gap-8 pb-16 pt-2">
      {/* ── Wishlist Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent shrink-0">
            <Heart size={22} className="fill-brand-accent" />
          </div>
          <div>
            <h1 className="font-display uppercase text-3xl sm:text-4xl text-text-primary tracking-tight leading-tight flex items-center gap-2">
              My Wishlist
              {wishlistCount > 0 && (
                <span className="font-sans text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/30 normal-case">
                  {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </h1>
          </div>
        </div>

        {wishlistCount > 0 && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={clearWishlist}
              className="text-text-muted hover:text-rose-500 hover:border-rose-500/40 text-xs"
            >
              <Trash2 size={14} /> Clear All
            </Button>
            <Link to="/catalog">
              <Button size="sm" className="text-xs">
                Continue Shopping <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Content Grid or Empty State ───────────────────────────── */}
      {loading && displayedProducts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: Math.max(wishlistCount, 4) }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-3.5 gap-2.5"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-xl" />
              <div className="flex items-center justify-between pt-1 px-1 mt-auto">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistCount === 0 || displayedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center bg-brand-surface border border-brand-border rounded-3xl max-w-2xl mx-auto my-6">
          <div className="size-20 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-5">
            <Heart size={36} strokeWidth={1.75} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-2">
            Your Wishlist is Empty
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/catalog">
              <Button size="lg" className="shadow-glow">
                <ShoppingBag size={18} /> Explore Catalog
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
