/**
 * Converts a string to Sentence case.
 * Example: "hello world. this is a test." -> "Hello world. This is a test."
 */
export function toSentenceCase(text: string): string {
    return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, function(match) {
            return match.toUpperCase();
        });
}

export function formatDate(dateInput: string | number | Date): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCreatedUpdatedDates(createdAt: string | number | Date, updatedAt: string | number | Date): string {
  const created = formatDate(createdAt);
  const updated = formatDate(updatedAt);

  if (created === updated) {
    return `Created: ${created}`;
  }
  return `Created: ${created} • Updated: ${updated}`;
}