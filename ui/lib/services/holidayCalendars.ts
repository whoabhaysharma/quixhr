import api, { ApiResponse } from '../api'; // Used original import style for response but should use global type
import { ApiResponse as GlobalApiResponse, ApiError } from '@/types/api';

export interface HolidayCalendar {
    id: string;
    name: string;
    description?: string;
    year: number;
    organizationId: string;
    holidays?: Holiday[];
    users?: Array<{
        id: string;
        name: string;
        email: string;
    }>;
    _count?: {
        users: number;
        holidays: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Holiday {
    id: string;
    name: string;
    date: string;
    description?: string;
    calendarId: string;
    createdAt: string;
    updatedAt: string;
}

export const holidayCalendarsService = {
    // Get all calendars for organization
    getAllCalendars: async (): Promise<GlobalApiResponse<{ calendars: HolidayCalendar[] }>> => {
        try {
            const response = await api.get<GlobalApiResponse<{ calendars: HolidayCalendar[] }>>('/holiday-calendars');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch holiday calendars',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Get calendar by ID
    getCalendarById: async (id: string): Promise<GlobalApiResponse<{ calendar: HolidayCalendar }>> => {
        try {
            const response = await api.get<GlobalApiResponse<{ calendar: HolidayCalendar }>>(`/holiday-calendars/${id}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch calendar details',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Create calendar
    createCalendar: async (data: {
        name: string;
        description?: string;
        year: number;
    }): Promise<GlobalApiResponse<{ calendar: HolidayCalendar }>> => {
        try {
            const response = await api.post<GlobalApiResponse<{ calendar: HolidayCalendar }>>('/holiday-calendars', data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to create holiday calendar',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Update calendar
    updateCalendar: async (
        id: string,
        data: {
            name?: string;
            description?: string;
            year?: number;
        }
    ): Promise<GlobalApiResponse<{ calendar: HolidayCalendar }>> => {
        try {
            const response = await api.put<GlobalApiResponse<{ calendar: HolidayCalendar }>>(`/holiday-calendars/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to update holiday calendar',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Delete calendar
    deleteCalendar: async (id: string): Promise<GlobalApiResponse<{ message: string }>> => {
        try {
            const response = await api.delete<GlobalApiResponse<{ message: string }>>(`/holiday-calendars/${id}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to delete holiday calendar',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Assign calendar to users
    assignCalendarToUsers: async (
        calendarId: string,
        userIds: string[]
    ): Promise<GlobalApiResponse<{ message: string }>> => {
        try {
            const response = await api.post<GlobalApiResponse<{ message: string }>>(`/holiday-calendars/${calendarId}/assign`, { userIds });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to assign calendar to users',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },
};
