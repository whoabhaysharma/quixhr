import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysService, Holiday } from '../services/holidays';

export function useHolidays(calendarId: string) {
    return useQuery({
        queryKey: ['holidays', calendarId],
        queryFn: async () => {
            const response = await holidaysService.getHolidaysByCalendar(calendarId);
            return response.data.holidays;
        },
        enabled: !!calendarId,
    });
}

export function useUpcomingHolidays(limit?: number) {
    return useQuery({
        queryKey: ['holidays', 'upcoming', limit],
        queryFn: async () => {
            const response = await holidaysService.getUpcomingHolidays(limit);
            return response.data.holidays;
        },
    });
}

export function useCreateHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            date: string;
            endDate?: string;
            description?: string;
            calendarId: string;
        }) => holidaysService.createHoliday(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['holidays', variables.calendarId] });
            queryClient.invalidateQueries({ queryKey: ['holidays', 'upcoming'] });
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars', variables.calendarId] });
        },
    });
}

export function useUpdateHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { name?: string; date?: string; endDate?: string; description?: string };
        }) => holidaysService.updateHoliday(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] });
        },
    });
}

export function useDeleteHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => holidaysService.deleteHoliday(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] });
        },
    });
}

export function useBulkCreateHolidays() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            calendarId,
            holidays,
        }: {
            calendarId: string;
            holidays: Array<{ name: string; date: string; endDate?: string; description?: string }>;
        }) => holidaysService.bulkCreateHolidays(calendarId, holidays),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['holidays', variables.calendarId] });
            queryClient.invalidateQueries({ queryKey: ['holidays', 'upcoming'] });
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars', variables.calendarId] });
        },
    });
}
