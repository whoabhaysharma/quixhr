import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysService, Holiday } from '../services/holidays';
import { toast } from 'sonner';

export function useHolidays(calendarId: string) {
    return useQuery({
        queryKey: ['holidays', calendarId],
        queryFn: async () => {
            try {
                const response = await holidaysService.getHolidaysByCalendar(calendarId);
                return response.data.holidays;
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load holidays');
                throw error;
            }
        },
        enabled: !!calendarId,
    });
}

export function useUpcomingHolidays(limit?: number) {
    return useQuery({
        queryKey: ['holidays', 'upcoming', limit],
        queryFn: async () => {
            try {
                const response = await holidaysService.getUpcomingHolidays(limit);
                return response.data.holidays;
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load upcoming holidays');
                throw error;
            }
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
            toast.success('Holiday created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create holiday');
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
            toast.success('Holiday updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update holiday');
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
            toast.success('Holiday deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete holiday');
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
            toast.success('Holidays imported successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to import holidays');
        },
    });
}
