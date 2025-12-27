/**
 * Holiday details response
 */
export interface HolidayResponseDto {
    id: string;
    name: string;
    date: Date;
    endDate: Date | null;
    description: string | null;
    calendarId: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Transform database Holiday model to response DTO
 */
export function toHolidayResponseDto(holiday: {
    id: string;
    name: string;
    date: Date;
    endDate: Date | null;
    description: string | null;
    calendarId: string;
    createdAt: Date;
    updatedAt: Date;
}): HolidayResponseDto {
    return {
        id: holiday.id,
        name: holiday.name,
        date: holiday.date,
        endDate: holiday.endDate,
        description: holiday.description,
        calendarId: holiday.calendarId,
        createdAt: holiday.createdAt,
        updatedAt: holiday.updatedAt,
    };
}
