import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  ShieldCheck,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { getOrderById } from '../../api/order.api.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

const STATUS_STEPS = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      await Promise.resolve();
      try {
        const data = await getOrderById(orderId);
        if (isMounted) setOrder(data);
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load order details:', err);
          setError(err.response?.data?.message || err.message || 'Order not found.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="size-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </span>
        <h2 className="text-xl font-bold text-text-primary mb-2">Order Not Found</h2>
        <p className="text-sm text-text-muted mb-6 max-w-sm">
          {error || "The order you are looking for doesn't exist or you don't have access."}
        </p>
        <Link to="/orders">
          <Button>Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const subOrders = order.vendorSubOrders || [];
  const address = order.shippingAddress || {};

  const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus) !== -1
    ? STATUS_STEPS.indexOf(order.orderStatus)
    : 0;

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl mx-auto">
      {/* ── Navigation & Header ──────────────────────────── */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-accent transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {order.orderNumber}
              </h1>
              <Badge variant="accent" size="sm">
                {order.orderStatus}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
              <Calendar size={13} />
              Placed on {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Recent'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-text-muted block">Order Total</span>
            <span className="text-2xl font-black text-brand-accent">
              ${Number(order.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Status Progress Bar ──────────────────────────── */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-4 gap-2 relative">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step} className="flex flex-col items-center text-center gap-2 relative z-10">
                <div
                  className={`size-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isCompleted
                      ? 'bg-brand-accent text-white shadow-glow'
                      : 'bg-brand-bg border border-brand-border text-text-muted'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isCurrent
                      ? 'text-brand-accent'
                      : isCompleted
                      ? 'text-text-primary'
                      : 'text-text-muted'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── Left Column: Items & Vendor Sub-Orders ───────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Order Items Table */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-brand-border">
              Purchased Items ({items.length > 0 ? items.length : order.itemsCount || 1})
            </h2>

            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div
                  key={item.orderItemId || idx}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-brand-bg border border-brand-border text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-lg bg-brand-surface border border-brand-border shrink-0 flex items-center justify-center text-brand-accent">
                      <Package size={20} />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-text-primary truncate">
                        {item.productName || item.sku || `Sports Item #${idx + 1}`}
                      </div>
                      <div className="text-text-muted text-[11px] mt-0.5">
                        Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <span className="font-extrabold text-text-primary">
                    ${Number(item.lineTotal || (item.unitPrice * item.quantity)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Fulfillment Sub-Orders */}
          {subOrders.length > 0 && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-brand-border flex items-center gap-2">
                <Truck size={16} className="text-brand-accent" />
                Vendor Sub-Orders ({subOrders.length})
              </h2>

              <div className="flex flex-col gap-3">
                {subOrders.map((sub, idx) => (
                  <div
                    key={sub.subOrderId || idx}
                    className="p-4 rounded-xl bg-brand-bg border border-brand-border flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">
                        Package: {sub.subOrderNumber}
                      </span>
                      <Badge variant="accent" size="xs">
                        {sub.subOrderStatus || 'PROCESSING'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-text-muted text-[11px] pt-2 border-t border-brand-border">
                      <span>Tracking: {sub.trackingNumber || 'Pending Courier Assignment'}</span>
                      <span className="text-text-primary font-bold">
                        Package Total: ${Number(sub.subtotalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Receipt & Delivery Details ─────── */}
        <div className="flex flex-col gap-6">
          {/* Financial Breakdown */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4 text-xs">
            <h3 className="text-sm font-bold text-text-primary pb-3 border-b border-brand-border">
              Payment Receipt
            </h3>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span className="text-text-primary font-semibold">
                  ${Number(order.subtotalAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Shipping Fee</span>
                <span className="text-text-primary font-semibold">
                  {order.shippingAmount === 0 ? 'FREE' : `$${Number(order.shippingAmount || 0).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Tax</span>
                <span className="text-text-primary font-semibold">
                  ${Number(order.taxAmount || 0).toFixed(2)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({order.couponCode})</span>
                  <span>-${Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-brand-border font-bold">
                <span className="text-sm text-text-primary">Total Paid</span>
                <span className="text-xl font-black text-brand-accent">
                  ${Number(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Security Card */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4 text-xs">
            <h3 className="text-sm font-bold text-text-primary pb-3 border-b border-brand-border flex items-center gap-1.5">
              <Truck size={15} className="text-brand-accent" /> Shipping Address
            </h3>

            <div className="text-text-muted leading-relaxed">
              <div className="text-text-primary font-semibold">{address.fullName || 'Customer'}</div>
              <div>{address.street}</div>
              <div>{address.city}, {address.state} {address.postalCode}</div>
              <div>{address.country}</div>
            </div>

            <div className="pt-3 border-t border-brand-border flex flex-col gap-2 text-text-muted">
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-brand-accent" />
                <span>Payment: <strong className="text-text-primary">{order.paymentStatus}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck size={14} />
                <span>Escrow Guarantee Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
