import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';
import { getProductImage, getProductImages } from '../../lib/productImages.js';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { cn } from '../../lib/cn.js';

export default function ProductCard({ product }) {
  const {
    productId,
    name,
    brand,
    basePrice,
  } = product;

  const { isWishlisted: checkWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = checkWishlist(productId);

  const primaryImage = getProductImage(product);
  const [fallbackSrc, setFallbackSrc] = useState(null);
  const [imgError, setImgError] = useState(false);

  const displayBrand = brand || 'SportMarket';
  const currentImg = fallbackSrc || primaryImage;

  const handleImgError = () => {
    const images = getProductImages(product);
    if (images.length > 1 && currentImg === images[0]) {
      setFallbackSrc(images[1]);
    } else {
      const emergencyFallback =
        'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80';
      if (currentImg !== emergencyFallback) {
        setFallbackSrc(emergencyFallback);
      } else {
        setImgError(true);
      }
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId, e.currentTarget);
  };

  return (
    <Link
      to={`/products/${productId}`}
      className="group relative flex flex-col h-full bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-3.5 hover:border-brand-accent/40 hover:shadow-xl dark:hover:shadow-brand-accent/5 hover:-translate-y-1 transition-all duration-300 select-none overflow-hidden"
      aria-label={name}
    >
      {/* ── 1 & 2. Product Image Stage with Title Overlay & Wishlist Heart ── */}
      <div className="relative w-full aspect-[4/5] bg-[#f3f4f6] dark:bg-[#1a202e] rounded-xl overflow-hidden flex items-center justify-center">
        {currentImg && !imgError ? (
          <img
            src={currentImg}
            alt={name}
            loading="lazy"
            onError={handleImgError}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted/50">
            <div className="size-12 rounded-xl bg-brand-surface/80 border border-brand-border flex items-center justify-center text-text-muted group-hover:text-brand-accent transition-colors">
              <Package size={22} strokeWidth={1.75} />
            </div>
          </div>
        )}

        {/* Wishlist Heart Icon (Top-Right) */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={
            isWishlisted
              ? `Remove ${name} from wishlist`
              : `Add ${name} to wishlist`
          }
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={cn(
            'absolute top-2.5 right-2.5 z-10 size-8 sm:size-8.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-90',
            'bg-brand-surface/90 dark:bg-black/50 backdrop-blur-md border border-brand-border/60',
            isWishlisted
              ? 'text-brand-accent border-brand-accent/50 shadow-glow'
              : 'text-text-muted hover:text-brand-accent hover:border-brand-accent/50 hover:scale-110',
          )}
        >
          <Heart
            size={15}
            className={cn(
              'transition-all duration-200',
              isWishlisted ? 'fill-brand-accent text-brand-accent scale-110' : '',
            )}
          />
        </button>

        {/* Product Name Overlaid on the Image */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end pointer-events-none">
          <h3
            className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2 drop-shadow-md group-hover:text-brand-accent transition-colors"
            title={name}
          >
            {name}
          </h3>
        </div>
      </div>

      {/* ── Brand Name and Price ── */}
      <div className="flex items-center justify-between pt-2.5 px-1 gap-2 mt-auto">
        {displayBrand && (
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted truncate">
            {displayBrand}
          </span>
        )}
        <span className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight shrink-0">
          ${Number(basePrice || 0).toFixed(2)}
        </span>
      </div>
    </Link>
  );
}
