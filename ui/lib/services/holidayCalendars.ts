import api, { ApiResponse } from '../api';

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
    getAllCalendars: async (): Promise<ApiResponse<{ calendars: HolidayCalendar[] }>> => {
        const response = await api.get('/holiday-calendars');
        return response.data;
    },

    // Get calendar by ID
    getCalendarById: async (id: string): Promise<ApiResponse<{ calendar: HolidayCalendar }>> => {
        const response = await api.get(`/holiday-calendars/${id}`);
        return response.data;
    },

    // Create calendar
    createCalendar: async (data: {
        name: string;
        description?: string;
        year: number;
    }): Promise<ApiResponse<{ calendar: HolidayCalendar }>> => {
        const response = await api.post('/holiday-calendars', data);
        return response.data;
    },

    // Update calendar
    updateCalendar: async (
        id: string,
        data: {
            name?: string;
            description?: string;
            year?: number;
        }
    ): Promise<ApiResponse<{ calendar: HolidayCalendar }>> => {
        const response = await api.put(`/holiday-calendars/${id}`, data);
        return response.data;
    },

    // Delete calendar
    deleteCalendar: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.delete(`/holiday-calendars/${id}`);
        return response.data;
    },

    // Assign calendar to users
    assignCalendarToUsers: async (
        calendarId: string,
        userIds: string[]
    ): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post(`/holiday-calendars/${calendarId}/assign`, { userIds });
        return response.data;
    },
};
