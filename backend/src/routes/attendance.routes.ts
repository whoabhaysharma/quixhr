import express from "express";
import * as attendanceController from "../controllers/attendanceController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

router.post("/clock-in", attendanceController.clockIn);
router.put("/clock-out", attendanceController.clockOut);
router.get("/me", attendanceController.getMyAttendance);
router.get("/today", attendanceController.getTodayStatus);
router.post("/mark", attendanceController.markAttendance);
router.get("/all", attendanceController.getAllAttendance);

export default router;
