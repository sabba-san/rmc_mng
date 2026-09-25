/** Shared helper utilities */

export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-MY', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export const STATUS_COLORS = {
  draft: '#64748b',
  pending: '#f59e0b',
  under_review: '#8b5cf6',
  approved: '#10b981',
  rejected: '#ef4444',
  completed: '#3b82f6',
};

export const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Review',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

export const GRANT_TYPES = ['internal', 'external', 'industry'];
export const OUTPUT_TYPES = ['publication', 'conference', 'patent', 'book_chapter', 'report'];

export const ROLE_LABELS = {
  researcher: 'Researcher',
  admin: 'Admin',
  reviewer: 'Reviewer',
};
export const DOC_TYPES = ['proposal', 'receipt', 'progress_report', 'publication_proof', 'other'];
export const REPORT_TYPES = ['6_month', '12_month', 'final', 'ad_hoc'];
