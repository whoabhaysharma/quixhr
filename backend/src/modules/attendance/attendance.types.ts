import { z } from 'zod';
import { AttendanceType, DayType } from '@prisma/client';

export const checkInSchema = z.object({
    date: z.string().transform((str) => new Date(str)).or(z.date()).optional(), // Optional, defaults to now
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export const checkOutSchema = z.object({
    date: z.string().transform((str) => new Date(str)).or(z.date()).optional(), // Optional, defaults to now
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export type CheckInDto = z.infer<typeof checkInSchema>;
export type CheckOutDto = z.infer<typeof checkOutSchema>;

export interface AttendanceResponseDto {
    id: string;
    employeeId: string;
    date: Date;
    checkIn: Date;
    checkOut: Date | null;
    attendanceType: AttendanceType;
    dayType: DayType;
}
