
/**
 * Convert local date to UTC date (preserving the calendar date)
 * 
 * This is useful when you want to send a date to the backend that should be treated
 * as that specific calendar date regardless of the user's timezone.
 * 
 * Example: User selects "2026-01-09" in IST (GMT+5:30).
 * Normal `toISOString()` might shift it to "2026-01-08T18:30:00.000Z".
 * This function ensures it becomes "2026-01-09T00:00:00.000Z".
 */
export const toUTC = (date: Date): Date => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};
