import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayCalendarsService, HolidayCalendar } from '../services/holidayCalendars';
import { toast } from 'sonner';

export function useHolidayCalendars() {
    return useQuery({
        queryKey: ['holidayCalendars'],
        queryFn: async () => {
            try {
                const response = await holidayCalendarsService.getAllCalendars();
                return response.data.calendars;
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load holiday calendars');
                throw error;
            }
        },
    });
}

export function useHolidayCalendar(id: string) {
    return useQuery({
        queryKey: ['holidayCalendars', id],
        queryFn: async () => {
            try {
                const response = await holidayCalendarsService.getCalendarById(id);
                return response.data.calendar;
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load holiday calendar details');
                throw error;
            }
        },
        enabled: !!id,
    });
}

export function useCreateCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; description?: string; year: number }) =>
            holidayCalendarsService.createCalendar(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] });
            toast.success('Holiday calendar created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create holiday calendar');
        },
    });
}

export function useUpdateCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { name?: string; description?: string; year?: number };
        }) => holidayCalendarsService.updateCalendar(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] });
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars', variables.id] });
            toast.success('Holiday calendar updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update holiday calendar');
        },
    });
}

export function useDeleteCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => holidayCalendarsService.deleteCalendar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] });
            toast.success('Holiday calendar deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete holiday calendar');
        },
    });
}

export function useAssignCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ calendarId, userIds }: { calendarId: string; userIds: string[] }) =>
            holidayCalendarsService.assignCalendarToUsers(calendarId, userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] });
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast.success('Calendar access updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update calendar access');
        },
    });
}
