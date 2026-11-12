import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely (clsx + twMerge). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
