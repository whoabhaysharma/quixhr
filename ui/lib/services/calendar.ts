import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';

export interface Calendar {
    id: string;
    companyId: string;
    name: string;
    year: number;
    dayStartTime: string;
    midDayCutoff: string;
    dayEndTime: string;
    weeklyRules: WeeklyRule[];
    holidays: Holiday[];
    assignedEmployees?: {
        id: string;
        name: string;
        role: string;
        email: string;
    }[];
    createdAt: string;
}

export interface WeeklyRule {
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    rule: 'WORKING' | 'OFF' | 'ALTERNATE';
}

export interface Holiday {
    id?: string;
    startDate: string;
    endDate: string;
    name: string;
}

export interface CreateCalendarDto {
    companyId: string;
    name: string;
    year: number;
    dayStartTime: string;
    midDayCutoff: string;
    dayEndTime: string;
    weeklyRules?: WeeklyRule[];
    holidays?: Holiday[];
}

export interface UpdateCalendarDto {
    name?: string;
    dayStartTime?: string;
    midDayCutoff?: string;
    dayEndTime?: string;
}

export const calendarService = {
    // Get all calendars
    getCalendars: async (): Promise<ApiResponse<Calendar[]>> => {
        try {
            const response = await api.get<ApiResponse<Calendar[]>>('/calendars');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch calendars',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Get single calendar by ID
    getCalendar: async (id: string): Promise<ApiResponse<Calendar>> => {
        try {
            const response = await api.get<ApiResponse<Calendar>>(`/calendars/${id}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch calendar details',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Create new calendar
    createCalendar: async (data: CreateCalendarDto): Promise<ApiResponse<Calendar>> => {
        try {
            const response = await api.post<ApiResponse<Calendar>>('/calendars', data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to create calendar',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Update calendar
    updateCalendar: async (id: string, data: UpdateCalendarDto): Promise<ApiResponse<Calendar>> => {
        try {
            const response = await api.patch<ApiResponse<Calendar>>(`/calendars/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to update calendar',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Delete calendar
    deleteCalendar: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        try {
            const response = await api.delete<ApiResponse<{ message: string }>>(`/calendars/${id}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to delete calendar',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Update weekly rule
    updateWeeklyRule: async (id: string, rule: WeeklyRule): Promise<ApiResponse<Calendar>> => {
        try {
            const response = await api.put<ApiResponse<Calendar>>(`/calendars/${id}/rules`, rule);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to update weekly rule',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Get holidays for a calendar
    getHolidays: async (id: string): Promise<ApiResponse<Holiday[]>> => {
        try {
            const response = await api.get<ApiResponse<Holiday[]>>(`/calendars/${id}/holidays`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch holidays',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Add holiday to calendar
    addHoliday: async (id: string, holiday: Omit<Holiday, 'id'>): Promise<ApiResponse<Holiday>> => {
        try {
            const response = await api.post<ApiResponse<Holiday>>(`/calendars/${id}/holidays`, holiday);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to add holiday',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Delete holiday from calendar
    deleteHoliday: async (calendarId: string, holidayId: string): Promise<ApiResponse<{ message: string }>> => {
        try {
            const response = await api.delete<ApiResponse<{ message: string }>>(`/calendars/${calendarId}/holidays/${holidayId}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to delete holiday',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },
};
