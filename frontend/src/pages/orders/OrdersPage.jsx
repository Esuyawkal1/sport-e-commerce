import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { getOrders } from '../../api/order.api.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      await Promise.resolve();
      try {
        const data = await getOrders();
        if (isMounted) setOrders(data?.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        if (isMounted) setOrders([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'SHIPPED':
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'accent';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl mx-auto">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="pb-4 border-b border-brand-border">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          My Order History
        </h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="flex flex-col gap-4">
          {orders.map((ord) => (
            <div
              key={ord.orderId}
              className="bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-accent/40 transition-colors"
            >
              {/* Order Info */}
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-brand-bg border border-brand-border text-brand-accent flex items-center justify-center shrink-0">
                  <Package size={22} />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-text-primary text-sm sm:text-base">
                      {ord.orderNumber}
                    </span>
                    <Badge variant={getStatusBadgeVariant(ord.orderStatus)} size="xs">
                      {ord.orderStatus || 'CONFIRMED'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString() : 'Recent'}
                    </span>
                    <span>•</span>
                    <span>{ord.itemsCount || 1} item(s)</span>
                    <span>•</span>
                    <span>Payment: <strong className="text-text-primary">{ord.paymentStatus || 'PAID'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Price & Link */}
              <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-text-muted block">Total Amount</span>
                  <span className="text-base sm:text-lg font-black text-text-primary">
                    ${Number(ord.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                <Link to={`/orders/${ord.orderId}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                    <span>Details</span>
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-brand-surface border border-brand-border rounded-2xl p-8">
          <div className="size-16 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-text-muted mb-4">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">No Orders Yet</h2>
          <Link to="/catalog">
            <Button size="sm" className="flex items-center gap-2">
              <span>Start Shopping</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
