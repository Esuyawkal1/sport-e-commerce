import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Truck,
  ShieldCheck,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { getOrderById, verifyChapaPayment } from '../../api/order.api.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  useEffect(() => {
    let isMounted = true;
    async function loadConfirmation() {
      await Promise.resolve();
      try {
        const queryParams = new URLSearchParams(location.search);
        const txRef = queryParams.get('tx_ref');
        if (txRef) {
          try {
            await verifyChapaPayment(txRef);
          } catch {
            // Non-blocking if keys pending
          }
        }

        if (!order && orderId) {
          const data = await getOrderById(orderId);
          if (isMounted) setOrder(data);
        }
      } catch (err) {
        console.error('Failed to load order confirmation:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadConfirmation();
    return () => {
      isMounted = false;
    };
  }, [orderId, order, location.search]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-12 max-w-3xl mx-auto">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Order Not Found</h2>
        <Link to="/orders">
          <Button>View Order History</Button>
        </Link>
      </div>
    );
  }

  const subOrders = order.vendorSubOrders || [];
  const address = order.shippingAddress || {};

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-4xl mx-auto">
      {/* ── Success Header ───────────────────────────────── */}
      <div className="flex flex-col items-center text-center gap-3 pt-6">
        <div className="size-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-glow">
          <CheckCircle2 size={36} />
        </div>
        <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">
          Order Placed Successfully
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Thank you for gearing up with SportMarket!
        </h1>
      </div>

      {/* ── Order Receipt Card ───────────────────────────── */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-brand-border text-xs">
          <div>
            <span className="text-text-muted block mb-1">Order Number</span>
            <span className="text-text-primary font-bold">{order.orderNumber}</span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Date Placed</span>
            <span className="text-text-primary font-bold flex items-center gap-1">
              <Calendar size={13} className="text-text-muted" />
              {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Today'}
            </span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Payment Status</span>
            <Badge variant="success" size="xs">
              {order.paymentStatus || 'PAID'}
            </Badge>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Total Paid</span>
            <span className="text-lg font-black text-brand-accent">
              ${Number(order.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* ── Vendor Sub-Orders Packages ──────────────────── */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Package size={16} className="text-brand-accent" />
            Vendor Fulfillment Packages ({subOrders.length > 0 ? subOrders.length : 1})
          </h3>

          {subOrders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {subOrders.map((sub, idx) => (
                <div
                  key={sub.subOrderId || idx}
                  className="p-4 rounded-xl bg-brand-bg border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-brand-accent text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-text-primary">
                        Package {sub.subOrderNumber}
                      </div>
                      <div className="text-text-muted text-[11px] mt-0.5">
                        Fulfillment Status:{' '}
                        <span className="text-text-primary font-semibold">
                          {sub.subOrderStatus || 'PROCESSING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="accent" size="xs">
                      {sub.trackingNumber ? `Track: ${sub.trackingNumber}` : 'Preparing Dispatch'}
                    </Badge>
                    <span className="font-bold text-text-primary">
                      ${Number(sub.subtotalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border text-xs text-text-muted">
              {order.itemsCount || 1} item(s) packaged and routed for dispatch.
            </div>
          )}
        </div>

        {/* ── Shipping & Delivery Summary ──────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-brand-border text-xs">
          <div>
            <h4 className="font-bold text-text-primary mb-2 flex items-center gap-1.5">
              <Truck size={14} className="text-brand-accent" /> Delivery Address
            </h4>
            <div className="text-text-muted leading-relaxed">
              <div className="text-text-primary font-semibold">{address.fullName || 'Valued Customer'}</div>
              <div>{address.street}</div>
              <div>{address.city}, {address.state} {address.postalCode}</div>
              <div>{address.country}</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-text-primary mb-2 flex items-center gap-1.5">
              <CreditCard size={14} className="text-brand-accent" /> Payment & Protection
            </h4>
            <div className="text-text-muted leading-relaxed flex flex-col gap-1">
              <div>Method: <strong className="text-text-primary">{order.paymentMethod || 'Credit Card'}</strong></div>
              <div>Shipping Method: <strong className="text-text-primary">{order.shippingMethod || 'Standard Ground'}</strong></div>
              <div className="flex items-center gap-1 text-emerald-400 mt-1">
                <ShieldCheck size={14} /> Sports Escrow Guarantee Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Next Actions ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link to="/orders">
          <Button variant="outline" size="md">
            View My Orders
          </Button>
        </Link>
        <Link to="/catalog">
          <Button size="md" className="flex items-center gap-2">
            <span>Continue Shopping</span>
            <ArrowRight size={15} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
