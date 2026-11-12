import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Package,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { getProductById } from "../../api/catalog.api.js";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { getProductImages } from "../../lib/productImages.js";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { cn } from "../../lib/cn.js";

function getVariantSizeName(variant, gearCategory) {
  const sizeAttr = variant?.attributes?.size;
  if (sizeAttr) {
    const trimmed = String(sizeAttr).trim();
    // For shoes / footwear, extract clean realistic numeric size (e.g. "US 9.5" -> "9.5", "Size 10" -> "10")
    const shoeMatch = trimmed.match(/^(?:US\s*|Size\s*)?(\d{1,2}(?:\.5)?)$/i);
    if (shoeMatch) {
      return shoeMatch[1];
    }
    return trimmed;
  }
  if (variant?.attributes?.gripSize)
    return `Grip ${variant.attributes.gripSize}`;
  if (variant?.attributes?.sizeOunces)
    return `${variant.attributes.sizeOunces} oz`;
  if (variant?.attributes?.weightKg) return `${variant.attributes.weightKg} kg`;
  if (variant?.attributes?.seatHeight) return variant.attributes.seatHeight;
  if (variant?.attributes?.weightClass) return variant.attributes.weightClass;

  // Extract clean number or realistic label from variantName if present
  if (variant?.variantName) {
    const vn = variant.variantName;
    const shoeMatch = vn.match(/\b(?:US\s*|Size\s*)?(\d{1,2}(?:\.5)?)\b/i);
    if (gearCategory === "FOOTWEAR" && shoeMatch) {
      return shoeMatch[1];
    }
    const weightMatch = vn.match(/\b(\d+\s*kg)\b/i);
    if (weightMatch) return weightMatch[1];
    const ozMatch = vn.match(/\b(\d+\s*oz)\b/i);
    if (ozMatch) return ozMatch[1];
    const ballMatch = vn.match(/\bSize\s*(\d+)\b/i);
    if (ballMatch) return `Size ${ballMatch[1]}`;
    const gripMatch = vn.match(/Grip\s*Size\s*(\d+)\s*\(([^)]+)\)/i);
    if (gripMatch) return `Grip ${gripMatch[1]} (${gripMatch[2]})`;
    if (vn.includes(" - ")) {
      return vn.split(" - ")[0].trim();
    }
    return vn;
  }
  return null;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const buySectionRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageHeight, setImageHeight] = useState(null);

  // Variant & Quantity state
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [flyingItems, setFlyingItems] = useState([]);

  // Collapsible Shipping & Returns Accordion
  const [isShippingOpen, setIsShippingOpen] = useState(false);

  // Wishlist state & actions
  const { isWishlisted: checkWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = checkWishlist(productId);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      await Promise.resolve();
      if (!isMounted) return;
      setLoading(true);
      setError(null);

      try {
        const prodData = await getProductById(productId);
        if (!isMounted) return;
        setProduct(prodData);
        setSelectedImageIndex(0);
        if (prodData?.variants && prodData.variants.length > 0) {
          setSelectedVariantId(prodData.variants[0].variantId);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load product details:", err);
        setError(
          err.response?.data?.message || err.message || "Product not found.",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Always scroll to the top so breadcrumbs, hero image, and title are visible
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [productId, product]);

  useEffect(() => {
    if (!buySectionRef.current) return;
    const updateHeight = () => {
      if (
        typeof window !== "undefined" &&
        window.innerWidth >= 1024 &&
        buySectionRef.current
      ) {
        setImageHeight(buySectionRef.current.offsetHeight);
      } else {
        setImageHeight(null);
      }
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(buySectionRef.current);
    window.addEventListener("resize", updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [product, selectedVariantId, quantity]);

  const handleToggleWishlist = (e) => {
    toggleWishlist(productId, e?.currentTarget);
  };

  const handleQuantityInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val, 10);
    if (num <= 0) {
      setQuantity(1);
      return;
    }
    if (currentAvailable > 0 && num > currentAvailable) {
      setQuantity(currentAvailable);
      return;
    }
    setQuantity(num);
  };

  const handleQuantityBlur = () => {
    const num = parseInt(quantity, 10);
    if (!num || num < 1) {
      setQuantity(1);
    } else if (currentAvailable > 0 && num > currentAvailable) {
      setQuantity(currentAvailable);
    } else {
      setQuantity(num);
    }
  };

  const triggerFlyAnimation = (e) => {
    try {
      const cartEl =
        document.getElementById("nav-cart-btn") ||
        document.querySelector('a[href="/cart"]');
      if (!cartEl) return;
      const cartRect = cartEl.getBoundingClientRect();

      let startX = window.innerWidth / 2;
      let startY = window.innerHeight / 2;

      if (e?.currentTarget) {
        const btnRect = e.currentTarget.getBoundingClientRect();
        startX = btnRect.left + btnRect.width / 2;
        startY = btnRect.top + btnRect.height / 2;
      } else {
        const heroImg = document.getElementById("product-hero-image");
        if (heroImg) {
          const imgRect = heroImg.getBoundingClientRect();
          startX = imgRect.left + imgRect.width / 2;
          startY = imgRect.top + imgRect.height / 2;
        }
      }

      const endX = cartRect.left + cartRect.width / 2;
      const endY = cartRect.top + cartRect.height / 2;

      const flyId = Date.now() + Math.random();
      const currentImages = getProductImages(product);
      const activeImg = currentImages[0] || null;

      setFlyingItems((prev) => [
        ...prev,
        { id: flyId, startX, startY, endX, endY, image: activeImg },
      ]);

      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== flyId));
      }, 850);
    } catch (err) {
      console.warn("Animation trigger error:", err);
    }
  };

  const handleAddToCart = async (e) => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: `/products/${productId}` } },
      });
      return;
    }
    const currentActiveVariant =
      product?.variants?.find((v) => v.variantId === selectedVariantId) ||
      product?.variants?.[0];
    if (!currentActiveVariant?.variantId) return;

    const finalQuantity = Math.max(1, parseInt(quantity, 10) || 1);
    setAddingToCart(true);
    setCartError(null);
    try {
      await addItem(currentActiveVariant.variantId, finalQuantity);
      triggerFlyAnimation(e);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3500);
    } catch (err) {
      setCartError(
        err.response?.data?.message ||
          err.message ||
          "Failed to add item to bag.",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full pb-20 sm:pb-16">
        {/* Mobile Skeleton (< md) */}
        <div className="md:hidden flex flex-col gap-4">
          <div className="flex gap-3.5 items-start">
            <Skeleton className="size-28 sm:size-32 rounded-2xl shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-3 w-2/3 rounded mt-1" />
            </div>
          </div>
          <div className="flex gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>

        {/* Desktop Skeleton (>= md) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          <div className="md:col-span-1 lg:col-span-7 flex flex-col gap-6">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
          <div className="md:col-span-1 lg:col-span-5 flex flex-col gap-6">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <div className="flex gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 w-28 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="size-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </span>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Item Unavailable
        </h2>
        <p className="text-sm font-normal text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
          {error ||
            "The sports gear you're searching for does not exist or has been removed."}
        </p>
        <Link to="/catalog">
          <Button className="rounded-xl">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const {
    name,
    brand,
    sportType,
    gearCategory,
    description,
    longDescription,
    basePrice,
    isBulky,
    specifications = {},
    variants = [],
  } = product;

  // Selected Variant details
  const activeVariant =
    variants.find((v) => v.variantId === selectedVariantId) || variants[0];
  const currentPrice = activeVariant?.price ?? basePrice;
  const currentAvailable = activeVariant?.inventory?.quantityAvailable ?? 0;
  const isOutOfStock = variants.length > 0 ? currentAvailable <= 0 : false;
  const effectiveQuantity = Math.max(1, parseInt(quantity, 10) || 1);

  const displayImages = getProductImages(product);

  // Active variant attributes
  const activeSizeName = activeVariant
    ? getVariantSizeName(activeVariant, gearCategory)
    : null;

  // Determine if variants exist for selection
  const showVariantSelector = variants.length > 1;

  // Construct Compact Product Attributes
  const attributesList = [];

  if (gearCategory) {
    const formattedCategory =
      gearCategory.charAt(0).toUpperCase() +
      gearCategory.slice(1).toLowerCase();
    attributesList.push({ label: "Category", value: formattedCategory });
  }

  if (brand) {
    attributesList.push({ label: "Brand", value: brand });
  }

  if (specifications?.material) {
    attributesList.push({ label: "Material", value: specifications.material });
  } else if (specifications?.construction) {
    attributesList.push({
      label: "Material",
      value: specifications.construction,
    });
  }

  const activeSize =
    activeSizeName ||
    specifications?.size ||
    (specifications?.headSizeSqIn
      ? `${specifications.headSizeSqIn} sq in`
      : null);

  if (activeSize) {
    const sizeDisplay =
      gearCategory === "FOOTWEAR"
        ? String(activeSize).startsWith("US")
          ? activeSize
          : `US ${activeSize}`
        : String(activeSize);
    attributesList.push({ label: "Size", value: sizeDisplay });
  }

  // Weight attribute if specified
  const weight =
    activeVariant?.weightKg ||
    specifications?.weightKg ||
    (specifications?.unstrungWeightGrams
      ? `${specifications.unstrungWeightGrams}g`
      : null);
  if (weight && typeof weight === "number" && weight > 0) {
    attributesList.push({ label: "Weight", value: `${weight} kg` });
  } else if (weight && typeof weight === "string") {
    attributesList.push({ label: "Weight", value: weight });
  }

  return (
    <div className="w-full pb-24 sm:pb-16 select-none sm:select-auto">
      {/* ── Breadcrumb Navigation ───────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-6 sm:mb-8 flex-wrap"
      >
        <Link
          to="/"
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Home
        </Link>
        <ChevronRight size={12} className="text-neutral-400 shrink-0" />
        <Link
          to="/catalog"
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Catalog
        </Link>
        {sportType && (
          <>
            <ChevronRight size={12} className="text-neutral-400 shrink-0" />
            <Link
              to={`/catalog?sport=${encodeURIComponent(Array.isArray(sportType) ? sportType[0] : sportType)}`}
              className="hover:text-neutral-900 dark:hover:text-white capitalize transition-colors"
            >
              {Array.isArray(sportType) ? sportType[0] : sportType}
            </Link>
          </>
        )}
        <ChevronRight size={12} className="text-neutral-400 shrink-0" />
        <span className="text-neutral-900 dark:text-white font-medium truncate max-w-[200px] sm:max-w-xs">
          {name}
        </span>
      </nav>

      {/* ── Mobile Layout (< md): Full-Width Image Stage + Product Info Below ──── */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Full-Width Product Image Stage */}
        <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl bg-[#f4f4f5] dark:bg-[#18181b] overflow-hidden flex items-center justify-center p-6 select-none border border-neutral-200/60 dark:border-neutral-800/60">
          {displayImages.length > 0 ? (
            <img
              src={displayImages[selectedImageIndex] || displayImages[0]}
              alt={name}
              className="w-full h-full object-contain object-center"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-400">
              <Package size={40} strokeWidth={1.5} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Sport Gear
              </span>
            </div>
          )}

          {/* Floating Wishlist Heart Button (Top-right overlay) */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={
              isWishlisted
                ? `Remove ${name} from wishlist`
                : `Add ${name} to wishlist`
            }
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            className={cn(
              "absolute top-3 right-3 z-10 size-9 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm active:scale-95",
              "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800",
              isWishlisted
                ? "text-brand-accent"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
            )}
          >
            <Heart
              size={16}
              className={cn(
                "transition-all duration-150",
                isWishlisted ? "fill-brand-accent text-brand-accent" : "",
              )}
            />
          </button>
        </div>

        {/* Mobile Gallery Thumbnails (if multiple images exist) */}
        {displayImages.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                className={cn(
                  "size-14 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#f4f4f5] dark:bg-[#18181b] shrink-0 cursor-pointer",
                  selectedImageIndex === idx ||
                    (!selectedImageIndex && idx === 0)
                    ? "border-brand-accent shadow-sm"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-contain object-center"
                />
              </button>
            ))}
          </div>
        )}

        {/* Product Brand, Title & Description stacked under Full-Width Image */}
        <div className="flex flex-col gap-1.5 pt-1">
          {brand && (
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {brand}
            </p>
          )}
          <h1 className="font-display uppercase text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight leading-tight">
            {name}
          </h1>
          {isOutOfStock && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <span className="size-1.5 rounded-full bg-rose-500" />
              Out of Stock
            </div>
          )}
          {(description || longDescription) && (
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mt-0.5">
              {description || longDescription}
            </p>
          )}
        </div>

        {/* Mobile Size / Option Selector */}
        {showVariantSelector && (
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {gearCategory === "FOOTWEAR" ? "Size (US)" : "Size"}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {variants.map((v) => {
                const isSelected = selectedVariantId === v.variantId;
                const sizeLabel =
                  getVariantSizeName(v, gearCategory) || v.variantName;
                const available = v.inventory?.quantityAvailable ?? 0;
                const isVarOutOfStock = available <= 0;

                return (
                  <button
                    key={v.variantId}
                    type="button"
                    disabled={isVarOutOfStock}
                    onClick={() => {
                      setSelectedVariantId(v.variantId);
                      setQuantity(1);
                    }}
                    className={cn(
                      "min-w-10 h-10 px-3 rounded-full border text-xs sm:text-sm font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                        : isVarOutOfStock
                          ? "border-neutral-200 dark:border-neutral-800 text-neutral-400 opacity-40 cursor-not-allowed line-through"
                          : "border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900",
                    )}
                  >
                    {sizeLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Product Attributes */}
        {attributesList.length > 0 && (
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
              Product Attributes
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              {attributesList.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {label}
                  </dt>
                  <dd className="font-semibold text-neutral-900 dark:text-white capitalize">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Mobile Cart Feedback Messages */}
        {cartError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{cartError}</span>
          </div>
        )}
        {addedToast && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle2
              size={15}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <span>Added {effectiveQuantity} item(s) to your bag.</span>
          </div>
        )}

        {/* Mobile Shipping & Returns Accordion */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setIsShippingOpen((prev) => !prev)}
            className="w-full py-3 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100"
          >
            <span>Shipping & Returns</span>
            <ChevronDown
              size={16}
              className={cn(
                "text-neutral-400 transition-transform duration-200",
                isShippingOpen && "rotate-180",
              )}
            />
          </button>
          {isShippingOpen && (
            <div className="pb-3 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed flex flex-col gap-2">
              <p>
                <strong className="font-semibold text-neutral-900 dark:text-white">
                  Free Standard Delivery:
                </strong>{" "}
                Complimentary shipping on orders over $99. Orders dispatch
                within 24 hours.
              </p>
              {isBulky && (
                <p>
                  <strong className="font-semibold text-amber-600 dark:text-amber-400">
                    Freight Delivery:
                  </strong>{" "}
                  Bulky equipment requires scheduled curbside delivery.
                </p>
              )}
              <p>
                <strong className="font-semibold text-neutral-900 dark:text-white">
                  30-Day Returns:
                </strong>{" "}
                Unused items can be returned within 30 days for a full refund.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop/Tablet Two-Column Layout (>= md) ───────────────── */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* ── Left Column: Product Gallery & Attributes (7 cols) ─── */}
        <div className="md:col-span-1 lg:col-span-7 flex flex-col gap-5">
          {/* Main Hero Image Stage (Height aligned with Add to Cart) */}
          <div
            className="group relative w-full h-[320px] sm:h-[400px] lg:h-auto rounded-2xl bg-[#f4f4f5] dark:bg-[#18181b] overflow-hidden flex items-center justify-center p-6 sm:p-8 select-none transition-[height] duration-150"
            style={imageHeight ? { height: `${imageHeight}px` } : undefined}
          >
            {displayImages.length > 0 ? (
              <img
                id="product-hero-image"
                src={displayImages[selectedImageIndex] || displayImages[0]}
                alt={name}
                className="w-full h-full object-contain object-center transition-transform duration-300 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <Package size={48} strokeWidth={1.5} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Sport Gear
                </span>
              </div>
            )}

            {/* Floating Wishlist Heart Button (Top-right overlay) */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={
                isWishlisted
                  ? `Remove ${name} from wishlist`
                  : `Add ${name} to wishlist`
              }
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              className={cn(
                "absolute top-4 right-4 z-10 size-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm hover:scale-105 active:scale-95",
                "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800",
                isWishlisted
                  ? "text-brand-accent"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
              )}
            >
              <Heart
                size={18}
                className={cn(
                  "transition-all duration-150",
                  isWishlisted ? "fill-brand-accent text-brand-accent" : "",
                )}
              />
            </button>
          </div>

          {/* Desktop Gallery Thumbnails (if multiple images exist) */}
          {displayImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                  className={cn(
                    "size-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#f4f4f5] dark:bg-[#18181b] shrink-0 cursor-pointer",
                    selectedImageIndex === idx ||
                      (!selectedImageIndex && idx === 0)
                      ? "border-brand-accent shadow-sm scale-105"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-contain object-center"
                  />
                </button>
              ))}
            </div>
          )}

          {/* ── Compact Product Attributes Section (Under Hero Image) ── */}
          {attributesList.length > 0 && (
            <div className="pt-2 sm:pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3.5">
                Product Attributes
              </h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3.5 text-xs sm:text-sm">
                {attributesList.map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-neutral-500 dark:text-neutral-400 font-medium">
                      {label}
                    </dt>
                    <dd className="font-semibold text-neutral-900 dark:text-white capitalize">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* ── Right Column: Product Information Hierarchy ────────── */}
        <div className="md:col-span-1 lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
          <div ref={buySectionRef} className="flex flex-col gap-6">
            {/* 1. Brand name — small, uppercase, muted text */}
            {brand && (
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {brand}
              </p>
            )}

            {/* 2. Product name — prominent, bold, clean typography */}
            <h1 className="font-display uppercase text-3xl sm:text-4xl text-neutral-900 dark:text-white tracking-tight leading-tight">
              {name}
            </h1>

            {/* Out of Stock indicator if unavailable */}
            {isOutOfStock && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400">
                  <span className="size-2 rounded-full bg-rose-500" />
                  Out of Stock
                </span>
              </div>
            )}

            {/* Short description — maximum 2-3 lines, no unnecessary lengthy text */}
            {(description || longDescription) && (
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                {description || longDescription}
              </p>
            )}

            {/* Product Variants Selection — Clean Size Pills */}
            {showVariantSelector && (
              <div className="flex flex-col gap-3 pt-1">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {gearCategory === "FOOTWEAR" ? "Size (US)" : "Size"}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {variants.map((v) => {
                    const isSelected = selectedVariantId === v.variantId;
                    const sizeLabel =
                      getVariantSizeName(v, gearCategory) || v.variantName;
                    const available = v.inventory?.quantityAvailable ?? 0;
                    const isVarOutOfStock = available <= 0;

                    return (
                      <button
                        key={v.variantId}
                        type="button"
                        disabled={isVarOutOfStock}
                        onClick={() => {
                          setSelectedVariantId(v.variantId);
                          setQuantity(1);
                        }}
                        className={cn(
                          "min-w-10 h-10 px-3.5 rounded-full border text-xs sm:text-sm font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer",
                          isSelected
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                            : isVarOutOfStock
                              ? "border-neutral-200 dark:border-neutral-800 text-neutral-400 opacity-40 cursor-not-allowed line-through"
                              : "border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900",
                        )}
                      >
                        {sizeLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Horizontally updating Price */}
            <div className="flex items-center gap-4 pt-1">
              <div className="inline-flex items-center h-11 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-1">
                <button
                  type="button"
                  disabled={effectiveQuantity <= 1 || isOutOfStock}
                  onClick={() =>
                    setQuantity((q) => Math.max(1, (parseInt(q, 10) || 1) - 1))
                  }
                  className="size-9 flex items-center justify-center rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isOutOfStock}
                  value={quantity}
                  onChange={handleQuantityInputChange}
                  onBlur={handleQuantityBlur}
                  className="w-12 text-center text-sm font-semibold text-neutral-900 dark:text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-accent/50 rounded select-all"
                  aria-label="Product quantity"
                />
                <button
                  type="button"
                  disabled={
                    isOutOfStock ||
                    (currentAvailable > 0 &&
                      effectiveQuantity >= currentAvailable)
                  }
                  onClick={() =>
                    setQuantity((q) => {
                      const curr = parseInt(q, 10) || 1;
                      if (currentAvailable > 0 && curr >= currentAvailable)
                        return curr;
                      return curr + 1;
                    })
                  }
                  className="size-9 flex items-center justify-center rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Price updating based on quantity starting from real price */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  ${(Number(currentPrice || 0) * effectiveQuantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* 8. Add to Cart button — prominent, full-width red/pink button with shopping bag icon */}
            <button
              type="button"
              disabled={isOutOfStock || addingToCart}
              onClick={handleAddToCart}
              className={cn(
                "w-full h-13 sm:h-14 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 text-white transition-all duration-200 shadow-sm cursor-pointer select-none",
                isOutOfStock
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none"
                  : "bg-brand-accent hover:bg-brand-accent-hover active:scale-[0.99] shadow-brand-accent/20 hover:shadow-md hover:shadow-brand-accent/30",
              )}
            >
              {addingToCart ? (
                <>
                  <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding to Bag...</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={20} />
                  <span>{isOutOfStock ? "Sold Out" : "Add to Bag"}</span>
                </>
              )}
            </button>

            {/* Cart Feedback */}
            {cartError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{cartError}</span>
              </div>
            )}

            {addedToast && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-sm">
                <CheckCircle2
                  size={15}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <span>Added {effectiveQuantity} item(s) to your bag.</span>
              </div>
            )}
          </div>

          {/* ── Collapsible Shipping & Returns Accordion ───────────── */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsShippingOpen((prev) => !prev)}
              className="w-full py-3 flex items-center justify-between text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
            >
              <span>Shipping & Returns</span>
              <ChevronDown
                size={16}
                className={cn(
                  "text-neutral-400 transition-transform duration-200",
                  isShippingOpen && "rotate-180",
                )}
              />
            </button>
            {isShippingOpen && (
              <div className="pb-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed flex flex-col gap-2.5">
                <p>
                  <strong className="font-semibold text-neutral-900 dark:text-white">
                    Free Standard Delivery:
                  </strong>{" "}
                  Complimentary shipping on all orders over $99. Orders dispatch
                  within 24 hours and arrive in 2–4 business days.
                </p>
                {isBulky && (
                  <p>
                    <strong className="font-semibold text-amber-600 dark:text-amber-400">
                      Freight Delivery:
                    </strong>{" "}
                    Bulky equipment requires scheduled curbside delivery. Our
                    freight carrier will coordinate delivery times directly with
                    you.
                  </p>
                )}
                <p>
                  <strong className="font-semibold text-neutral-900 dark:text-white">
                    30-Day Returns:
                  </strong>{" "}
                  Unused items in original packaging with tags intact can be
                  returned within 30 days for a full refund.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 p-3 shadow-lg flex items-center gap-2">
        <div className="h-11 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between px-1 w-24 shrink-0">
          <button
            type="button"
            disabled={effectiveQuantity <= 1 || isOutOfStock}
            onClick={() =>
              setQuantity((q) => Math.max(1, (parseInt(q, 10) || 1) - 1))
            }
            className="p-1 text-neutral-500 disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={isOutOfStock}
            value={quantity}
            onChange={handleQuantityInputChange}
            onBlur={handleQuantityBlur}
            className="w-8 text-center text-xs font-semibold text-neutral-900 dark:text-white bg-transparent focus:outline-none select-all"
            aria-label="Product quantity"
          />
          <button
            type="button"
            disabled={
              isOutOfStock ||
              (currentAvailable > 0 && effectiveQuantity >= currentAvailable)
            }
            onClick={() =>
              setQuantity((q) => {
                const curr = parseInt(q, 10) || 1;
                if (currentAvailable > 0 && curr >= currentAvailable)
                  return curr;
                return curr + 1;
              })
            }
            className="p-1 text-neutral-500 disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          type="button"
          disabled={isOutOfStock || addingToCart}
          onClick={handleAddToCart}
          className={cn(
            "flex-1 h-11 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 text-white select-none transition-all duration-150",
            isOutOfStock
              ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-brand-accent active:scale-[0.99]",
          )}
        >
          <ShoppingBag size={15} />
          <span>
            {isOutOfStock
              ? "Sold Out"
              : `Add to Bag • $${(Number(currentPrice || 0) * effectiveQuantity).toFixed(2)}`}
          </span>
        </button>
      </div>

      {/* Flying Particle / Thumbnail Animation towards Cart Icon */}
      {flyingItems.map((fly) => (
        <div
          key={fly.id}
          className="fixed pointer-events-none z-[9999] overflow-hidden rounded-full shadow-2xl ring-2 ring-brand-accent bg-brand-surface"
          style={{
            left: `${fly.startX}px`,
            top: `${fly.startY}px`,
            width: "46px",
            height: "46px",
            transform: "translate(-50%, -50%)",
            animation:
              "flyToCart 800ms cubic-bezier(0.2, 0.8, 0.25, 1) forwards",
            "--end-x": `${fly.endX - fly.startX}px`,
            "--end-y": `${fly.endY - fly.startY}px`,
          }}
        >
          {fly.image ? (
            <img
              src={fly.image}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-accent text-white">
              <ShoppingBag size={20} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
