import { z } from 'zod';

export const clockInSchema = {
    body: z.object({
        gpsCoords: z.object({
            latitude: z.number().optional(),
            longitude: z.number().optional()
        }).optional(),
        method: z.string().optional()
    })
};

export const clockOutSchema = {
    body: z.object({
        gpsCoords: z.object({
            latitude: z.number().optional(),
            longitude: z.number().optional()
        }).optional(),
        method: z.string().optional()
    })
};

export const dateQuerySchema = {
    query: z.object({
        date: z.string().optional(), // ISO Date string
        month: z.string().optional(), // 1-12
        year: z.string().optional()
    })
};
