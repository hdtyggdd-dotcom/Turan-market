/** Keep the amount separate from display grouping; never send spaces to the API. */
export function normalizePriceInput(text: string): string | null {
  const raw = text.replace(/\s/g, '');
  // Preserve decimal amounts, but reject signs, letters and multiple decimal points.
  return /^\d*(?:\.\d*)?$/.test(raw) ? raw : null;
}

export function formatPriceInput(raw: string): string {
  const [whole, fraction] = raw.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}
