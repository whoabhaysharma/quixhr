import { z } from 'zod';

export interface HolidayDto {
    startDate: Date;
    endDate: Date;
    name: string;
}

export const addHolidaySchema = z.object({
    startDate: z.string().transform((str) => new Date(str)).or(z.date()),
    endDate: z.string().transform((str) => new Date(str)).or(z.date()),
    name: z.string().min(1, 'Holiday name is required'),
});

export type AddHolidayDto = z.infer<typeof addHolidaySchema>;
