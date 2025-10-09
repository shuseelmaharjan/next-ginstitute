export function formatDuration(days: number): string {
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  if (days < 365) {
    const months = days / 30;
    return `${parseFloat(months.toFixed(1))} month${months === 1 ? '' : 's'}`;
  }
  const years = days / 365;
  return `${parseFloat(years.toFixed(1))} year${years === 1 ? '' : 's'}`;
}

