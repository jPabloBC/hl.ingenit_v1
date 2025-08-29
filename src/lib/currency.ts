/**
 * Utility functions for currency formatting
 * Specifically for Chilean Peso (CLP) with period as thousands separator
 */

/**
 * Format a number as Chilean currency (CLP)
 * Uses period (.) as thousands separator and no decimal places
 * @param amount - The amount to format
 * @param showCurrency - Whether to show the currency symbol ($)
 * @returns Formatted currency string
 */
export const formatCLP = (amount: number, showCurrency: boolean = true): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showCurrency ? '$0' : '0';
  }

  // Round to nearest integer (no decimals for CLP)
  const roundedAmount = Math.round(amount);
  
  // Format with period as thousands separator
  const formatted = new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(roundedAmount);
  
  return showCurrency ? `$${formatted}` : formatted;
};

/**
 * Format a number as Chilean currency without currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string
 */
export const formatNumber = (amount: number): string => {
  return formatCLP(amount, false);
};

/**
 * Parse a formatted currency string back to number
 * @param formattedAmount - The formatted string (e.g., "$1.234.567" or "1.234.567")
 * @returns The numeric value
 */
export const parseCLP = (formattedAmount: string): number => {
  if (!formattedAmount) return 0;
  
  // Remove currency symbol and spaces
  const cleanString = formattedAmount
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, ''); // Remove periods (thousands separators)
  
  const parsed = parseInt(cleanString, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format currency for display in inputs (without currency symbol)
 * @param amount - The amount to format
 * @returns Formatted string for input fields
 */
export const formatCLPForInput = (amount: number): string => {
  return formatNumber(amount);
};

/**
 * Legacy function to maintain compatibility
 * @deprecated Use formatCLP instead
 */
export const formatCurrency = (amount: number): string => {
  return formatCLP(amount);
};
