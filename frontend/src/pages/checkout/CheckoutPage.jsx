import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Lock,
  ArrowLeft,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { processCheckout } from '../../api/order.api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { getProductImage } from '../../lib/productImages.js';
import chapaIcon from '../../assets/chapa.svg';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const idPrefix = useId();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Field validation errors & touched tracking
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Shipping Address State
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    phone: '',
  });

  const [shippingMethod] = useState('Standard Ground');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');

  // Fake Card Fields
  const [card, setCard] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });

  const items = cart?.items || [];

  const validateAddressField = (name, value) => {
    const val = typeof value === 'string' ? value.trim() : '';
    switch (name) {
      case 'fullName':
        return !val ? 'Recipient full name is required' : '';
      case 'street':
        return !val ? 'Street address is required' : '';
      case 'city':
        return !val ? 'City is required' : '';
      case 'state':
        return !val ? 'State / Province is required' : '';
      case 'postalCode':
        return !val ? 'Postal / Zip code is required' : '';
      case 'country':
        return !val ? 'Country is required' : '';
      case 'phone':
        return '';
      default:
        return '';
    }
  };

  const validateCardField = (name, value) => {
    const val = typeof value === 'string' ? value.trim() : '';
    switch (name) {
      case 'number': {
        const digits = val.replace(/\D/g, '');
        if (!digits) return 'Card number is required';
        if (digits.length < 15 || digits.length > 19) return 'Enter a valid 15–16 digit card number';
        return '';
      }
      case 'expiry': {
        if (!val) return 'Expiration date is required';
        const clean = val.replace(/\s+/g, '');
        if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(clean)) return 'Format MM/YY';
        return '';
      }
      case 'cvc': {
        const digits = val.replace(/\D/g, '');
        if (!digits) return 'CVC is required';
        if (digits.length < 3 || digits.length > 4) return '3 or 4 digits';
        return '';
      }
      default:
        return '';
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));

    // Instant validation as user types if already touched or submit attempted
    if (touched[name] || attemptedSubmit) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateAddressField(name, value),
      }));
    }
  };

  const handleAddressBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateAddressField(name, value),
    }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'number') {
      const digits = value.replace(/\D/g, '').slice(0, 19);
      formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (name === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      formatted = digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    } else if (name === 'cvc') {
      formatted = value.replace(/\D/g, '').slice(0, 4);
    }

    setCard((prev) => ({ ...prev, [name]: formatted }));

    if (touched[name] || attemptedSubmit) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateCardField(name, formatted),
      }));
    }
  };

  const handleCardBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateCardField(name, value),
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'CHAPA') {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.number;
        delete copy.expiry;
        delete copy.cvc;
        return copy;
      });
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!cart || items.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    // Validate all fields instantly
    const newErrors = {};
    const requiredAddressFields = ['fullName', 'street', 'city', 'state', 'postalCode', 'country'];
    requiredAddressFields.forEach((f) => {
      const err = validateAddressField(f, address[f]);
      if (err) newErrors[f] = err;
    });

    if (paymentMethod === 'CREDIT_CARD') {
      ['number', 'expiry', 'cvc'].forEach((f) => {
        const err = validateCardField(f, card[f]);
        if (err) newErrors[f] = err;
      });
    }

    setErrors(newErrors);

    const allTouched = {
      fullName: true,
      street: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      ...(paymentMethod === 'CREDIT_CARD' ? { number: true, expiry: true, cvc: true } : {}),
    };
    setTouched(allTouched);

    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    setError(null);

    // Generate unique idempotency key
    const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const payload = {
        cartId: cart.cartId,
        shippingAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          fullName: address.fullName,
          phone: address.phone,
        },
        billingAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          fullName: address.fullName,
          phone: address.phone,
        },
        shippingMethod,
        paymentMethod,
        idempotencyKey,
      };

      const result = await processCheckout(payload);
      clearCart();

      // If Chapa returns a hosted checkout link, redirect customer immediately
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      const createdOrder = result?.order || result;
      navigate(`/orders/${createdOrder.orderId}/confirmation`, {
        state: { order: createdOrder, notice: result.message },
        replace: true,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err.response?.data?.message || err.message || 'Payment processing failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!cart || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">No items to checkout</h2>
        <p className="text-sm text-text-muted mb-6">Your shopping bag is currently empty.</p>
        <Link to="/catalog">
          <Button>Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto">
      {/* ── Breadcrumb & Title ────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center text-center">
        <Link
          to="/cart"
          className="self-start sm:absolute sm:left-0 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-accent transition-colors mb-3 sm:mb-0 sm:top-1/2 sm:-translate-y-1/2"
        >
          <ArrowLeft size={14} /> Back to Bag
        </Link>
        <h1 className="font-display uppercase text-3xl sm:text-4xl text-text-primary tracking-tight text-center leading-tight">
          Secure Checkout
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} noValidate autoComplete="off" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── Left Form Fields ─────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Step 1: Shipping Address */}
          <section className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
              <span className="size-6 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Shipping Destination
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  id={`${idPrefix}-name`}
                  name="fullName"
                  label="Recipient Full Name"
                  placeholder="Alex Morgan"
                  value={address.fullName}
                  onChange={handleAddressChange}
                  onBlur={handleAddressBlur}
                  error={errors.fullName}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  id={`${idPrefix}-street`}
                  name="street"
                  label="Street Address"
                  placeholder="124 Championship Way, Suite 400"
                  value={address.street}
                  onChange={handleAddressChange}
                  onBlur={handleAddressBlur}
                  error={errors.street}
                />
              </div>

              <Input
                id={`${idPrefix}-city`}
                name="city"
                label="City"
                placeholder="Chicago"
                value={address.city}
                onChange={handleAddressChange}
                onBlur={handleAddressBlur}
                error={errors.city}
              />

              <Input
                id={`${idPrefix}-state`}
                name="state"
                label="State / Province"
                placeholder="IL"
                value={address.state}
                onChange={handleAddressChange}
                onBlur={handleAddressBlur}
                error={errors.state}
              />

              <Input
                id={`${idPrefix}-postal`}
                name="postalCode"
                label="Postal / Zip Code"
                placeholder="60601"
                value={address.postalCode}
                onChange={handleAddressChange}
                onBlur={handleAddressBlur}
                error={errors.postalCode}
              />

              <Input
                id={`${idPrefix}-country`}
                name="country"
                label="Country"
                placeholder="USA"
                value={address.country}
                onChange={handleAddressChange}
                onBlur={handleAddressBlur}
                error={errors.country}
              />

              <div className="sm:col-span-2">
                <Input
                  id={`${idPrefix}-phone`}
                  name="phone"
                  label="Contact Phone"
                  placeholder="+251 912192834"
                  value={address.phone}
                  onChange={handleAddressChange}
                  onBlur={handleAddressBlur}
                  error={errors.phone}
                />
              </div>
            </div>
          </section>

          {/* Step 2: Payment Method */}
          <section className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
              <span className="size-6 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('CREDIT_CARD')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                    : 'border-brand-border text-text-muted hover:text-text-primary'
                }`}
              >
                <CreditCard size={16} /> Credit / Debit Card
              </button>

              <button
                type="button"
                onClick={() => handlePaymentMethodChange('CHAPA')}
                className={`p-3 rounded-xl border flex items-center justify-center sm:justify-start gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CHAPA'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-brand-border text-text-muted hover:text-text-primary'
                }`}
              >
                <img
                  src={chapaIcon}
                  alt="Chapa"
                  className="h-5 w-auto object-contain shrink-0 "
                />
                <span>Pay with Chapa</span>
              </button>
            </div>

            {paymentMethod === 'CREDIT_CARD' ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="col-span-2">
                  <Input
                    id={`${idPrefix}-card-num`}
                    name="number"
                    label="Card Number"
                    placeholder="4532 •••• •••• 8892"
                    value={card.number}
                    onChange={handleCardChange}
                    onBlur={handleCardBlur}
                    error={errors.number}
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </div>
                <Input
                  id={`${idPrefix}-card-exp`}
                  name="expiry"
                  label="Expiration"
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={handleCardChange}
                  onBlur={handleCardBlur}
                  error={errors.expiry}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
                <Input
                  id={`${idPrefix}-card-cvc`}
                  name="cvc"
                  label="CVC / CVV"
                  placeholder="•••"
                  value={card.cvc}
                  onChange={handleCardChange}
                  onBlur={handleCardBlur}
                  error={errors.cvc}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-xl bg-brand-bg border border-brand-border text-xs flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-white dark:bg-brand-surface border border-brand-border flex items-center justify-center p-2 shadow-xs shrink-0">
                    <img
                      src={chapaIcon}
                      alt="Chapa Official Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                      <span>Chapa Payment Gateway</span>
                    </h4>
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-border flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border font-semibold text-text-primary">
                    Telebirr
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border font-semibold text-text-primary">
                    CBE Birr
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border font-semibold text-text-primary">
                    Awash Bank
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border font-semibold text-text-primary">
                    Bank Transfer
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border font-semibold text-text-primary">
                    Debit / Credit Card
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Right: Mini Order Review ─────────────────────── */}
        <div className="flex flex-col gap-5 sticky top-24">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary pb-3 border-b border-brand-border">
              Order Review ({items.length} items)
            </h3>

            {/* Item list */}
            <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => {
                const img = getProductImage(item.product);
                return (
                  <div key={item.cartItemId} className="flex items-center gap-3 text-xs">
                    <div className="size-11 rounded-lg bg-brand-bg border border-brand-border shrink-0 overflow-hidden flex items-center justify-center">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="text-brand-border" />
                      )}
                    </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary font-medium truncate">
                      {item.product?.name}
                    </div>
                    <div className="text-text-muted text-[11px]">
                      Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                  <span className="font-bold text-text-primary">
                    ${Number(item.lineTotal).toFixed(2)}
                  </span>
                </div>
              );
            })}
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-2 pt-3 border-t border-brand-border text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span className="text-text-primary font-semibold">
                  ${Number(cart.subtotalAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Shipping</span>
                <span className="text-text-primary font-semibold">
                  {cart.shippingAmount === 0 ? 'FREE' : `$${Number(cart.shippingAmount || 0).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Tax (8%)</span>
                <span className="text-text-primary font-semibold">
                  ${Number(cart.taxAmount || 0).toFixed(2)}
                </span>
              </div>
              {cart.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Coupon ({cart.couponCode})</span>
                  <span>-${Number(cart.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-brand-border font-bold">
                <span className="text-sm text-text-primary">Grand Total</span>
                <span className="text-xl font-black text-brand-accent">
                  ${Number(cart.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order CTA */}
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className={`w-full flex items-center justify-center gap-2 mt-2 shadow-glow ${
                paymentMethod === 'CHAPA'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : ''
              }`}
            >
              {paymentMethod === 'CHAPA' ? (
                <img
                  src={chapaIcon}
                  alt=""
                  className="h-4 w-auto brightness-0 invert object-contain shrink-0"
                />
              ) : (
                <Lock size={15} />
              )}
              <span>
                {paymentMethod === 'CHAPA'
                  ? `Pay with Chapa ($${Number(cart.totalAmount || 0).toFixed(2)})`
                  : `Place Order ($${Number(cart.totalAmount || 0).toFixed(2)})`}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
