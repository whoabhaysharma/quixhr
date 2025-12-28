import api from "../api"

export interface AttendanceRecord {
    id: string
    date: string
    checkIn: string
    checkOut?: string
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY'
}

export const clockIn = async () => {
    const { data } = await api.post('/attendance/clock-in')
    return data
}

export const clockOut = async () => {
    const { data } = await api.put('/attendance/clock-out')
    return data
}

export const getMyAttendance = async () => {
    const { data } = await api.get<AttendanceRecord[]>('/attendance/me')
    return data
}

export const getTodayStatus = async () => {
    const { data } = await api.get<AttendanceRecord | null>('/attendance/today')
    return data
}

export const getAllAttendance = async () => {
    const response = await api.get('/attendance/all');
    return response.data;
};

export const markAttendance = async (data: { userId: string; date: Date; status: string; clockIn?: Date; clockOut?: Date }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
};
