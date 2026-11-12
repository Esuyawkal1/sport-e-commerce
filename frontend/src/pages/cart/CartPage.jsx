import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  Package,
} from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { getProductImage } from "../../lib/productImages.js";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();

  const navigate = useNavigate();

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  if (loading && !cart) {
    return (
      <div className="flex flex-col gap-6 py-8">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 items-start w-full">
          <div className="flex flex-col gap-4 w-full lg:col-span-2">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full lg:col-span-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-20 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-accent mb-4">
          <ShoppingBag size={36} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Your Gear Bag is Empty
        </h1>
        <Link to="/catalog">
          <Button size="lg" className="flex items-center gap-2">
            <span>Explore</span>
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full flex flex-col gap-8 pb-16">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="pb-4 border-b border-brand-border flex items-center justify-between">
        <div>
          <h1 className="font-display uppercase text-3xl sm:text-4xl text-text-primary tracking-tight leading-tight">
            Shopping Cart
          </h1>
        </div>
        <span className="text-xs font-semibold text-text-muted bg-brand-surface border border-brand-border px-3 py-1.5 rounded-lg">
          {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      {/* ── Cart Layout: 2 Columns on Desktop, Stacked on Mobile ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 items-start w-full">
        {/* ── Items List (Left Side on Desktop) ───────────── */}
        <div className="flex flex-col gap-4 w-full lg:col-span-2">
          {items.map((item) => {
            const product = item.product || {};
            const variant = item.variant || {};
            const image = getProductImage(product);

            return (
              <div
                key={item.cartItemId}
                className="w-full bg-brand-surface border border-brand-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-brand-accent/30 transition-colors overflow-hidden"
              >
                {/* Product Image & Details */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                  <Link
                    to={`/products/${product.productId}`}
                    className="size-16 sm:size-20 shrink-0 rounded-lg overflow-hidden bg-brand-bg border border-brand-border flex items-center justify-center"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={28} className="text-brand-border" />
                    )}
                  </Link>

                  <div className="flex flex-col min-w-0 flex-1">
                    <Link
                      to={`/products/${product.productId}`}
                      className="text-sm font-bold text-text-primary hover:text-brand-accent transition-colors line-clamp-2 break-words"
                    >
                      {product.name || "Sports Equipment"}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted break-words">
                        Variant:{" "}
                        <strong className="text-text-primary">
                          {variant.variantName || "Standard"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border shrink-0">
                  {/* Quantity Stepper */}
                  <div className="inline-flex items-center border border-brand-border rounded-lg bg-brand-bg px-2.5 py-1 shrink-0">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity - 1)
                      }
                      className="text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-xs font-bold text-text-primary px-3 select-none">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity + 1)
                      }
                      className="text-text-muted hover:text-text-primary p-0.5"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-16 sm:min-w-20">
                    <span className="text-sm font-extrabold text-text-primary block">
                      ${Number(item.lineTotal).toFixed(2)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartItemId)}
                    className="text-text-muted hover:text-rose-400 transition-colors p-1 shrink-0"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Order Summary (Right Side on Desktop, Sticky Bottom on Mobile) ── */}
        <div className="sticky bottom-0 lg:bottom-auto lg:top-24 z-30 w-full lg:col-span-1 bg-brand-surface/95 backdrop-blur-md border border-brand-border rounded-2xl p-4 sm:p-6 shadow-2xl lg:shadow-sm flex flex-col gap-5 overflow-hidden">
          <h2 className="text-base font-bold text-text-primary pb-3 border-b border-brand-border">
            Order Summary
          </h2>

          {/* Financial Rows */}
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-center text-text-muted gap-2">
              <span>Subtotal</span>
              <span className="text-text-primary font-semibold shrink-0">
                ${Number(cart.subtotalAmount || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-text-muted gap-2">
              <span className="flex items-center gap-1">
                Estimated Shipping
              </span>
              <span className="text-text-primary font-semibold shrink-0">
                {cart.shippingAmount === 0 ? (
                  <span className="text-emerald-400 font-bold uppercase text-[11px]">
                    Free
                  </span>
                ) : (
                  `$${Number(cart.shippingAmount || 0).toFixed(2)}`
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-text-muted gap-2">
              <span>Estimated Tax (8%)</span>
              <span className="text-text-primary font-semibold shrink-0">
                ${Number(cart.taxAmount || 0).toFixed(2)}
              </span>
            </div>

            {cart.discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-400 font-semibold gap-2">
                <span className="flex items-center gap-1">
                  Coupon Discount ({cart.couponCode})
                </span>
                <span className="shrink-0">
                  -${Number(cart.discountAmount).toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-brand-border flex justify-between items-baseline gap-2">
              <span className="text-sm font-bold text-text-primary">
                Estimated Total
              </span>
              <span className="text-xl sm:text-2xl font-black text-text-primary shrink-0">
                ${Number(cart.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Proceed to Checkout Action */}
          <Button
            size="lg"
            onClick={() => navigate("/checkout")}
            className="w-full flex items-center justify-center gap-2 mt-2 shadow-glow"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={16} />
          </Button>

          <div className="text-center pt-1">
            <Link
              to="/catalog"
              className="text-xs text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
