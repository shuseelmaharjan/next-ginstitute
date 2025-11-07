export function formatDate(dateInput: string | number | Date): string {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    const now = new Date();

    // Reset time to midnight for accurate day comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate difference in days
    const diffTime = dateOnly.getTime() - nowOnly.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Calculate difference in years
    const diffYears = Math.abs(date.getFullYear() - now.getFullYear());

    // Format time (e.g., "2:30 PM")
    const timeString = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    // Check if more than 1 year difference
    if (diffYears > 1 || (diffYears === 1 && Math.abs(diffTime) > 365 * 24 * 60 * 60 * 1000)) {
        const yearsDiff = Math.round(Math.abs(diffTime) / (1000 * 60 * 60 * 24 * 365));
        if (diffDays < 0) {
            return `${yearsDiff} year${yearsDiff > 1 ? 's' : ''} ago`;
        } else if (diffDays > 0) {
            return `${yearsDiff} year${yearsDiff > 1 ? 's' : ''} later`;
        }
    }

    // Handle relative dates
    if (diffDays === 0) {
        return `Today, ${timeString}`;
    } else if (diffDays === -1) {
        return `Yesterday, ${timeString}`;
    } else if (diffDays === 1) {
        return `Tomorrow, ${timeString}`;
    } else {
        // For dates 2+ days away (past or future), show formatted date
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
}
