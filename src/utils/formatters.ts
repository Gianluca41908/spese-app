/**
 * Utility di formattazione numerica standard italiana (it-IT)
 * Assicura che TUTTI gli importi e i numeri nell'app abbiano lo stile con separatore delle migliaia ('.')
 * e virgola per i decimali (',').
 */

/**
 * Formatta un importo in formato valuta Euro con separatore delle migliaia:
 * es. 1234567.89 -> "1.234.567,89 €"
 * es. 12 -> "12,00 €"
 */
export const formatEuro = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return '0,00 €';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
  if (isNaN(num)) return '0,00 €';

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formatta un numero con separatore delle migliaia e decimali configurabili:
 * es. formatNumber(11000, 0, 0) -> "11.000"
 * es. formatNumber(97.99, 2, 3) -> "97,99"
 */
export const formatNumber = (
  value: number | string | null | undefined,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
};

/**
 * Formatta una percentuale con virgola decimale italiana:
 * es. formatPercent(12.5, 1) -> "12,5%"
 */
export const formatPercent = (
  value: number | string | null | undefined,
  decimals = 1
): string => {
  if (value === null || value === undefined || value === '') return '0%';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return '0%';

  return `${new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)}%`;
};
