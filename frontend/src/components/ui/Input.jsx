import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Reusable text input / textarea component styled to the brand theme.
 */
export default function Input({
  label,
  id,
  error,
  className,
  textarea = false,
  ...props
}) {
  const base =
    'w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-brand-accent transition-colors duration-200';

  const Tag = textarea ? 'textarea' : 'input';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="text-sm font-medium text-text-muted">
            {label}
          </label>
        </div>
      )}
      <Tag
        id={id}
        className={cn(
          base,
          error && 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5 pt-0.5">
          <AlertCircle size={13} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
