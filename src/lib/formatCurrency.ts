/**
 * Formats a numeric value into currency format.
 * Defaults to Euro (€) formatting.
 */
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch {
    // Fallback format
    const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
    return `${symbol}${amount.toFixed(2)}`;
  }
}
