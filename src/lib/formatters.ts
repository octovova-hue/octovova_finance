/**
 * Currency and Number Formatters for Octovova Finance
 * Optimized for Indian Rupee (₹) formatting (Lakhs & Crores grouping)
 */

export function formatINR(amount: number, compact: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (compact) {
    if (absAmount >= 10000000) {
      // Crores
      const cr = absAmount / 10000000;
      return `${isNegative ? '-' : ''}₹${cr.toFixed(cr >= 10 ? 1 : 2)} Cr`;
    } else if (absAmount >= 100000) {
      // Lakhs
      const lk = absAmount / 100000;
      return `${isNegative ? '-' : ''}₹${lk.toFixed(lk >= 10 ? 1 : 2)} L`;
    } else if (absAmount >= 1000) {
      // Thousands
      const k = absAmount / 1000;
      return `${isNegative ? '-' : ''}₹${k.toFixed(k >= 10 ? 1 : 1)} k`;
    }
  }

  // Full Indian numbering grouping (e.g. 12,34,567)
  const integerPart = Math.round(absAmount).toString();
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount)).toString();
  let lastThree = absAmount.substring(absAmount.length - 3);
  const otherNumbers = absAmount.substring(0, absAmount.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNegative ? '-' : ''}${formatted}`;
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatYears(years: number): string {
  if (years <= 0) return 'Immediate';
  if (years === 1) return '1 year';
  return `${years} years`;
}
