import { cn } from '../../lib/cn.js';

/**
 * Reusable Button component built on the brand theme.
 *
 * Variants:
 *   primary  — magenta accent (CTA)
 *   outline  — bordered, transparent fill
 *   ghost    — no border, subtle hover
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-sans font-semibold text-sm rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-brand-accent hover:bg-brand-accent-hover text-white shadow-glow active:scale-95',
    outline:
      'border border-brand-border hover:border-brand-accent text-text-primary hover:text-brand-accent bg-transparent',
    ghost:
      'text-text-muted hover:text-text-primary bg-transparent hover:bg-brand-surface',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-sm sm:text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
