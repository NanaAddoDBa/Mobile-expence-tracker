/**
 * Formats a Date object or YYYY-MM-DD string to a friendly format.
 */
export function formatDate(dateSource: string | Date): string {
  if (!dateSource) return "";
  const date = typeof dateSource === "string" ? new Date(dateSource) : dateSource;
  if (isNaN(date.getTime())) {
    return String(dateSource);
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
