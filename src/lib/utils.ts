import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const PIPELINE_STAGES = [
  { id: 'New', label: 'New', color: 'bg-blue-500' },
  { id: 'Interested', label: 'Interested', color: 'bg-indigo-500' },
  { id: 'Site Visit', label: 'Site Visit', color: 'bg-purple-500' },
  { id: 'Quotation Sent', label: 'Quotation Sent', color: 'bg-amber-500' },
  { id: 'Negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'Converted', label: 'Converted', color: 'bg-emerald-500' },
  { id: 'Lost', label: 'Lost', color: 'bg-red-500' },
] as const;

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'WhatsApp',
  'Walk-in',
  'Phone Call',
  'Social Media',
  'Existing Customer',
  'Other',
] as const;

export const ROLES = [
  { id: 'super_admin', label: 'Super Admin', level: 1 },
  { id: 'director', label: 'Director', level: 2 },
  { id: 'sales_manager', label: 'Sales Manager', level: 3 },
  { id: 'sales_executive', label: 'Sales Executive', level: 4 },
  { id: 'marketing', label: 'Marketing Team', level: 5 },
  { id: 'accountant', label: 'Accountant', level: 6 },
  { id: 'warehouse', label: 'Warehouse Manager', level: 7 },
] as const;
