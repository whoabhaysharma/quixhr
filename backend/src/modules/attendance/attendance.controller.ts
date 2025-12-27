import { Request, Response } from "express";
import * as attendanceService from './attendance.service';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const clockIn = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const attendance = await attendanceService.clockIn(userId);
        res.status(201).json(attendance);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const clockOut = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const attendance = await attendanceService.clockOut(userId);
        res.status(200).json(attendance);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getMyAttendance = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const attendance = await attendanceService.getMyAttendance(userId);
        res.status(200).json(attendance);
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTodayStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const status = await attendanceService.getTodayStatus(userId);
        res.status(200).json(status);
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const markAttendance = async (req: Request, res: Response) => {
    try {
        const { userId, date, status, clockIn, clockOut } = req.body;

        // Basic validation
        if (!userId || !date || !status) {
            return res.status(400).json({ message: "userId, date, and status are required" });
        }

        const attendance = await attendanceService.markAttendance(
            userId,
            new Date(date),
            status,
            clockIn ? new Date(clockIn) : undefined,
            clockOut ? new Date(clockOut) : undefined
        );

        res.status(200).json(attendance);
    } catch (error: any) {
        console.error("Mark Attendance Error:", error);
        res.status(500).json({ message: "Failed to mark attendance" });
    }
};

export const getAllAttendance = async (req: Request, res: Response) => {
    try {
        const attendance = await attendanceService.getAllAttendance();
        res.status(200).json(attendance);
    } catch (error: any) {
        console.error("Get All Attendance Error:", error);
        res.status(500).json({ message: "Failed to fetch attendance records" });
    }
};
