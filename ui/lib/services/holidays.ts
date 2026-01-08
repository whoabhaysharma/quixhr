import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';

export interface Holiday {
    id: string;
    name: string;
    date: string;
    endDate?: string | null;
    description?: string;
    calendarId: string;
    createdAt: string;
    updatedAt: string;
}

export const holidaysService = {
    // Get holidays by calendar
    getHolidaysByCalendar: async (calendarId: string): Promise<ApiResponse<{ holidays: Holiday[] }>> => {
        try {
            const response = await api.get<ApiResponse<{ holidays: Holiday[] }>>(`/calendars/${calendarId}/holidays`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch holidays',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Get upcoming holidays for user
    getUpcomingHolidays: async (limit?: number): Promise<ApiResponse<{ holidays: Holiday[] }>> => {
        try {
            const response = await api.get<ApiResponse<{ holidays: Holiday[] }>>('/calendars/upcoming', {
                params: { limit },
            });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch upcoming holidays',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Create holiday
    createHoliday: async (data: {
        name: string;
        date: string;
        endDate?: string;
        description?: string;
        calendarId: string;
    }): Promise<ApiResponse<{ holiday: Holiday }>> => {
        try {
            const response = await api.post<ApiResponse<{ holiday: Holiday }>>('/holidays', data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to create holiday',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Update holiday
    updateHoliday: async (
        id: string,
        data: {
            name?: string;
            date?: string;
            endDate?: string;
            description?: string;
        }
    ): Promise<ApiResponse<{ holiday: Holiday }>> => {
        try {
            const response = await api.put<ApiResponse<{ holiday: Holiday }>>(`/holidays/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to update holiday',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Delete holiday
    deleteHoliday: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        try {
            const response = await api.delete<ApiResponse<{ message: string }>>(`/holidays/${id}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to delete holiday',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Bulk create holidays
    bulkCreateHolidays: async (
        calendarId: string,
        holidays: Array<{
            name: string;
            date: string;
            description?: string;
        }>
    ): Promise<ApiResponse<{ count: number }>> => {
        try {
            const response = await api.post<ApiResponse<{ count: number }>>('/holidays/bulk', { calendarId, holidays });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to bulk create holidays',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },
};
