import { z } from 'zod';
import { AttendanceType } from '@prisma/client';

export const punchSchema = z.object({
    date: z.string().transform((str) => new Date(str)).or(z.date()).optional(), // Optional, defaults to now
    source: z.string().optional(), // 'WEB', 'MOBILE', 'BIOMETRIC'
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

// Keeping checkIn/checkOut schemas for backward compatibility
export const checkInSchema = punchSchema;
export const checkOutSchema = punchSchema;

export type CheckInDto = z.infer<typeof checkInSchema>;
export type CheckOutDto = z.infer<typeof checkOutSchema>;
export type PunchDto = z.infer<typeof punchSchema>;

export interface AttendanceLogDto {
    id: string;
    punchTime: Date;
    type: 'IN' | 'OUT';
    source?: string;
}

export interface AttendanceResponseDto {
    id: string;
    employeeId: string;
    date: Date;
    firstCheckIn: Date | null;
    lastCheckOut: Date | null;
    totalMinutes: number;
    status: AttendanceType;
    logs?: AttendanceLogDto[];
}
