import api, { ApiResponse } from '../api';

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
        const response = await api.get('/calendars');
        return response.data;
    },

    // Get single calendar by ID
    getCalendar: async (id: string): Promise<ApiResponse<Calendar>> => {
        const response = await api.get(`/calendars/${id}`);
        return response.data;
    },

    // Create new calendar
    createCalendar: async (data: CreateCalendarDto): Promise<ApiResponse<Calendar>> => {
        const response = await api.post('/calendars', data);
        return response.data;
    },

    // Update calendar
    updateCalendar: async (id: string, data: UpdateCalendarDto): Promise<ApiResponse<Calendar>> => {
        const response = await api.patch(`/calendars/${id}`, data);
        return response.data;
    },

    // Delete calendar
    deleteCalendar: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.delete(`/calendars/${id}`);
        return response.data;
    },

    // Update weekly rule
    updateWeeklyRule: async (id: string, rule: WeeklyRule): Promise<ApiResponse<Calendar>> => {
        const response = await api.put(`/calendars/${id}/rules`, rule);
        return response.data;
    },

    // Get holidays for a calendar
    getHolidays: async (id: string): Promise<ApiResponse<Holiday[]>> => {
        const response = await api.get(`/calendars/${id}/holidays`);
        return response.data;
    },

    // Add holiday to calendar
    addHoliday: async (id: string, holiday: Omit<Holiday, 'id'>): Promise<ApiResponse<Holiday>> => {
        const response = await api.post(`/calendars/${id}/holidays`, holiday);
        return response.data;
    },

    // Delete holiday from calendar
    deleteHoliday: async (calendarId: string, holidayId: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.delete(`/calendars/${calendarId}/holidays/${holidayId}`);
        return response.data;
    },
};
