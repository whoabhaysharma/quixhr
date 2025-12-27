/**
 * Holiday calendar details response
 */
export interface CalendarResponseDto {
    id: string;
    name: string;
    description: string | null;
    year: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    holidays?: Array<{
        id: string;
        name: string;
        date: Date;
        endDate: Date | null;
        description: string | null;
    }>;
}

/**
 * Transform database HolidayCalendar model to response DTO
 */
export function toCalendarResponseDto(calendar: {
    id: string;
    name: string;
    description: string | null;
    year: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    holidays?: Array<{
        id: string;
        name: string;
        date: Date;
        endDate: Date | null;
        description: string | null;
    }>;
}): CalendarResponseDto {
    return {
        id: calendar.id,
        name: calendar.name,
        description: calendar.description,
        year: calendar.year,
        organizationId: calendar.organizationId,
        createdAt: calendar.createdAt,
        updatedAt: calendar.updatedAt,
        holidays: calendar.holidays,
    };
}
