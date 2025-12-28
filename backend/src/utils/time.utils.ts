/**
 * Time Conversion Utilities
 * Converts between "HH:MM" string format and minutes from midnight (integer)
 */

/**
 * Convert "HH:MM" to minutes from midnight
 * @example timeToMinutes("09:00") => 540
 * @example timeToMinutes("18:30") => 1110
 */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
    }
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time values: ${time}. Hours must be 0-23, minutes 0-59`);
    }
    return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to "HH:MM"
 * @example minutesToTime(540) => "09:00"
 * @example minutesToTime(1110) => "18:30"
 */
export function minutesToTime(minutes: number): string {
    if (minutes < 0 || minutes > 1440) {
        throw new Error(`Invalid minutes: ${minutes}. Must be 0-1440`);
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Validate time string format
 */
export function isValidTimeFormat(time: string): boolean {
    return /^\d{2}:\d{2}$/.test(time);
}
