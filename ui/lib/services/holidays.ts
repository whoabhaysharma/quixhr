import api, { ApiResponse } from '../api';

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
        const response = await api.get(`/calendars/${calendarId}/holidays`);
        return response.data;
    },

    // Get upcoming holidays for user
    getUpcomingHolidays: async (limit?: number): Promise<ApiResponse<{ holidays: Holiday[] }>> => {
        const response = await api.get('/calendars/upcoming', {
            params: { limit },
        });
        return response.data;
    },

    // Create holiday
    createHoliday: async (data: {
        name: string;
        date: string;
        endDate?: string;
        description?: string;
        calendarId: string;
    }): Promise<ApiResponse<{ holiday: Holiday }>> => {
        const response = await api.post('/holidays', data);
        return response.data;
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
        const response = await api.put(`/holidays/${id}`, data);
        return response.data;
    },

    // Delete holiday
    deleteHoliday: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.delete(`/holidays/${id}`);
        return response.data;
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
        const response = await api.post('/holidays/bulk', { calendarId, holidays });
        return response.data;
    },
};
