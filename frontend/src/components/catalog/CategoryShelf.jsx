import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import Skeleton from '../ui/Skeleton.jsx';

/**
 * Category Shelf: Displays the clean category title at the top,
 * and a smooth, horizontally scrollable row of products directly beneath it.
 */
export default function CategoryShelf({
  category,
  products = [],
  loading = false,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [products]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollTo({
      left: direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  // If not loading and no products exist for this category, skip rendering
  if (!loading && products.length === 0) {
    return null;
  }

  const categoryName = category?.name || 'Category';
  const categoryId = category?.categoryId;
  const slug = category?.slug;
  const sectionId = slug ? `category-${slug}` : `category-${categoryId}`;

  return (
    <section
      id={sectionId}
      data-category-slug={slug}
      data-category-id={categoryId}
      className="flex flex-col gap-4 scroll-mt-36 pt-2"
    >
      {/* Secondary Anchor so searching by categoryId also matches */}
      {categoryId && <div id={`category-${categoryId}`} className="sr-only" />}

      {/* ── Category Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-brand-border/60">
        <h2 className="font-display uppercase text-3xl sm:text-4xl text-text-primary tracking-tight leading-tight">
          {categoryName}
        </h2>

        {/* ── Action & Scroll Controls ─────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${categoryName} left`}
              className={`size-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                canScrollLeft
                  ? 'bg-brand-surface border-brand-border text-text-primary hover:border-brand-accent hover:text-brand-accent cursor-pointer active:scale-95'
                  : 'bg-brand-surface/40 border-brand-border/30 text-text-muted/40 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label={`Scroll ${categoryName} right`}
              className={`size-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                canScrollRight
                  ? 'bg-brand-surface border-brand-border text-text-primary hover:border-brand-accent hover:text-brand-accent cursor-pointer active:scale-95'
                  : 'bg-brand-surface/40 border-brand-border/30 text-text-muted/40 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Horizontal Products Track ─────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar pb-3 pt-1 snap-x snap-mandatory focus:outline-none"
        tabIndex={0}
        aria-label={`${categoryName} products row`}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="w-[270px] sm:w-[290px] shrink-0 snap-start flex flex-col bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-3.5 gap-2.5"
              >
                <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                <div className="flex items-center justify-between pt-1 px-1 mt-auto">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <div
                key={product.productId}
                className="w-[270px] sm:w-[290px] shrink-0 snap-start h-full"
              >
                <ProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
}
