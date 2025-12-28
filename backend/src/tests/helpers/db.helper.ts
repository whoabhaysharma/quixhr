import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean all data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanDatabase() {
    // Delete in reverse dependency order
    await prisma.attendanceLog.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.leaveBalance.deleteMany();
    await prisma.leavePolicy.deleteMany();
    await prisma.calendarHoliday.deleteMany();
    await prisma.calendarWeeklyRule.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.calendar.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
}

/**
 * Seed basic test data
 */
export async function seedTestData() {
    // This can be expanded based on common test data needs
    // For now, we'll keep it minimal and let individual tests create what they need
}

export { prisma };
