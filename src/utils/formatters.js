/**
 * Formatting helpers for Indian Rupee currency, percentages, and numerical ranges.
 */

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const val = Math.round(Number(amount));
  return '₹' + val.toLocaleString('en-IN');
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return Number(value).toFixed(decimals) + '%';
}

export function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN');
}

export function getBadgeClass(color) {
  switch (color) {
    case 'mint':
      return 'badge-mint';
    case 'amber':
      return 'badge-amber';
    case 'red':
      return 'badge-red';
    default:
      return 'badge-neutral';
  }
}
