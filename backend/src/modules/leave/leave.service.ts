
import { PrismaClient, LeaveStatus } from '@prisma/client';
import { CreateLeaveDto, LeaveQueryDto } from './leave.types';
import { createNotification } from '../notification/notification.service';

const prisma = new PrismaClient();

// Helper to get start/end of day
const startOfDay = (d: Date) => { const date = new Date(d); date.setHours(0, 0, 0, 0); return date; };
const endOfDay = (d: Date) => { const date = new Date(d); date.setHours(23, 59, 59, 999); return date; };

/**
 * Apply for leave
 */
export async function applyLeave(userId: string, dto: CreateLeaveDto) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true },
    });

    if (!user || !user.employee) {
        throw new Error('Employee profile not found');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
        throw new Error('Start date cannot be after end date');
    }

    // Calculate requested days
    let requestedDays = 0;
    if (dto.duration === 'FULL') {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
        requestedDays = 0.5;
    }

    // Check Balance (skip for UNPAID if you want, but standard is strict)
    const currentYear = startDate.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
        where: {
            employeeId_type_year: {
                employeeId: user.employee.id,
                type: dto.type,
                year: currentYear
            }
        }
    });

    if (!balance) {
        throw new Error(`No leave balance allocated for ${dto.type}`);
    }

    // Calculate pending leaves of this type
    const pendingRequests = await prisma.leaveRequest.findMany({
        where: {
            employeeId: user.employee.id,
            status: 'PENDING',
            type: dto.type
        }
    });

    let pendingDays = 0;
    for (const req of pendingRequests) {
        if (req.duration === 'FULL') {
            const diff = Math.abs(req.endDate.getTime() - req.startDate.getTime());
            pendingDays += Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
        } else {
            pendingDays += 0.5;
        }
    }

    if ((balance.used + pendingDays + requestedDays) > balance.allocated) {
        throw new Error(`Insufficient leave balance. Available: ${balance.allocated - balance.used - pendingDays}, Requested: ${requestedDays}`);
    }

    // Check for overlapping leaves
    const overlaps = await prisma.leaveRequest.findFirst({
        where: {
            employeeId: user.employee.id,
            status: { not: 'REJECTED' },
            AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } }
            ]
        }
    });

    if (overlaps) {
        throw new Error('You already have a leave request for this period');
    }

    const leave = await prisma.leaveRequest.create({
        data: {
            employeeId: user.employee.id,
            startDate,
            endDate,
            duration: dto.duration,
            type: dto.type,
            status: 'PENDING',
            reason: dto.reason,
        },
        include: { employee: true }
    });

    // Notify HR Admins of the company
    const hrAdmins = await prisma.user.findMany({
        where: {
            role: { in: ['HR_ADMIN', 'SUPER_ADMIN'] },
            employee: { companyId: user.employee.companyId }
        }
    });

    for (const admin of hrAdmins) {
        await createNotification({
            userId: admin.id,
            title: 'New Leave Request',
            message: `${user.employee.name} has applied for leave from ${startDate.toDateString()} to ${endDate.toDateString()}`,
            type: 'INFO',
            actionUrl: '/dashboard', // Or leave management page
        });
    }

    return leave;
}

/**
 * Get all leaves for a company (Admin view)
 * Retrieves company ID from the admin user ID
 */
export async function getAllLeavesForAdmin(adminUserId: string, query: LeaveQueryDto = {}) {
    const admin = await prisma.user.findUnique({
        where: { id: adminUserId },
        include: { employee: true }
    });

    if (!admin || !admin.employee?.companyId) {
        throw new Error('Admin company not found');
    }

    const companyId = admin.employee.companyId;

    const whereClause: any = {
        employee: { companyId },
    };

    if (query.status) whereClause.status = query.status;
    if (query.employeeId) whereClause.employeeId = query.employeeId;
    if (query.startDate) whereClause.startDate = { gte: new Date(query.startDate) };
    if (query.endDate) whereClause.endDate = { lte: new Date(query.endDate) };

    return prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
            employee: {
                select: {
                    id: true,
                    name: true,
                    user: { select: { email: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get my leaves (Employee view)
 */
export async function getMyLeaves(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true },
    });

    if (!user || !user.employee) return [];

    return prisma.leaveRequest.findMany({
        where: { employeeId: user.employee.id },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get leave by ID
 */
export async function getLeaveById(id: string) {
    return prisma.leaveRequest.findUnique({
        where: { id },
        include: { employee: true }
    });
}

/**
 * Update leave status (Approve/Reject)
 */
export async function updateLeaveStatus(leaveId: string, status: LeaveStatus, adminUserId: string) {
    const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: { employee: { include: { user: true } } }
    });

    if (!leave) throw new Error('Leave request not found');

    // Ideally verify admin belongs to same company. 
    // Assuming controller authorized role, but extra check is good.
    const admin = await prisma.user.findUnique({
        where: { id: adminUserId },
        include: { employee: true }
    });

    if (admin?.employee?.companyId !== leave.employee.companyId) {
        throw new Error('Unauthorized to manage this leave');
    }

    const updatedLeave = await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { status },
    });

    // Notify Employee
    await createNotification({
        userId: leave.employee.user.id,
        title: `Leave ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your leave request for ${new Date(leave.startDate).toDateString()} has been ${status.toLowerCase()}.`,
        type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
        actionUrl: '/dashboard',
    });

    return updatedLeave;
}

/**
 * Cancel leave (Employee)
 */
export async function cancelLeave(leaveId: string, userId: string) {
    const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: { employee: { include: { user: true } } }
    });

    if (!leave) throw new Error('Leave request not found');

    // Verify ownership
    if (leave.employee.user.id !== userId) {
        throw new Error('Unauthorized');
    }

    if (leave.status !== 'PENDING') {
        throw new Error('Only pending leave requests can be cancelled');
    }

    await prisma.leaveRequest.delete({
        where: { id: leaveId }
    });

    return { message: 'Leave request cancelled successfully' };
}

/**
 * Get leave balances for an employee
 */
export async function getLeaveBalances(employeeId: string) {
    const currentYear = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
        where: {
            employeeId,
            year: currentYear
        }
    });

    // We also need to calculate pending leaves to show "Available" accurately if we want to preview it
    // But basic balance is just what's in DB.
    // Let's return the DB objects.
    return balances;
}

/**
 * Assign/Update leave balance (Admin)
 */
export async function assignLeaveBalance(employeeId: string, type: any, allocated: number, year: number) {
    return prisma.leaveBalance.upsert({
        where: {
            employeeId_type_year: {
                employeeId,
                type,
                year
            }
        },
        update: {
            allocated
        },
        create: {
            employeeId,
            type,
            year,
            allocated,
            used: 0
        }
    });
}
