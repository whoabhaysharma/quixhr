import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayCalendarsService, HolidayCalendar } from '../services/holidayCalendars';

export function useHolidayCalendars() {
    return useQuery({
        queryKey: ['holidayCalendars'],
        queryFn: async () => {
            const response = await holidayCalendarsService.getAllCalendars();
            return response.data.calendars;
        },
    });
}

export function useHolidayCalendar(id: string) {
    return useQuery({
        queryKey: ['holidayCalendars', id],
        queryFn: async () => {
            const response = await holidayCalendarsService.getCalendarById(id);
            return response.data.calendar;
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
        },
    });
}

export function useDeleteCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => holidayCalendarsService.deleteCalendar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] });
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
        },
    });
}
