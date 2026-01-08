import api from "../api"
import { ApiResponse, ApiError } from '@/types/api';

export interface AttendanceRecord {
    id: string
    date: string
    checkIn: string
    checkOut?: string
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY'
}

export const clockIn = async (): Promise<ApiResponse<any>> => {
    try {
        const response = await api.post<ApiResponse<any>>('/attendance/clock-in')
        return response.data
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to clock in',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

export const clockOut = async (): Promise<ApiResponse<any>> => {
    try {
        const response = await api.put<ApiResponse<any>>('/attendance/clock-out')
        return response.data
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to clock out',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

export const getMyAttendance = async (): Promise<ApiResponse<AttendanceRecord[]>> => {
    try {
        const response = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance/me')
        return response.data
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to fetch attendance',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

export const getTodayStatus = async (): Promise<ApiResponse<AttendanceRecord | null>> => {
    try {
        const response = await api.get<ApiResponse<AttendanceRecord | null>>('/attendance/today')
        return response.data
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to fetch today status',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

export const getAllAttendance = async (): Promise<ApiResponse<any>> => {
    try {
        const response = await api.get<ApiResponse<any>>('/attendance/all');
        return response.data;
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to fetch all attendance',
            error.response?.data?.status,
            error.response?.status
        );
    }
};

export const markAttendance = async (data: { userId: string; date: Date; status: string; clockIn?: Date; clockOut?: Date }): Promise<ApiResponse<any>> => {
    try {
        const response = await api.post<ApiResponse<any>>('/attendance/mark', data);
        return response.data;
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to mark attendance',
            error.response?.data?.status,
            error.response?.status
        );
    }
};
