import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import {
    LeaveBalance,
    ApplyLeaveDTO,
    LeaveRequestFilters,
    ApproveRejectDTO,
    AdjustLeaveDTO,
    ImportLeaveDTO,
} from './leave.types';
import { LeaveStatus, LeaveType, LedgerEvent, Role } from '@prisma/client';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

/**
 * Get leave balances for employee
 */
export const getMyBalances = async (userId: string): Promise<LeaveBalance[]> => {
    const employee = await prisma.employee.findFirst({
        where: { userId },
        include: {
            leaveAllocations: true,
        },
    });

    if (!employee) {
        throw new AppError('Employee profile not found', 404);
    }

    const currentYear = new Date().getFullYear();

    // Get allocations for current year
    const allocations = employee.leaveAllocations.filter(
        (allocation) => allocation.year === currentYear
    );

    const balances: LeaveBalance[] = allocations.map((allocation) => ({
        leaveType: allocation.leaveType,
        leaveTypeName: allocation.leaveType, // You might want to format this better
        allocated: allocation.allocated,
        used: allocation.used,
        balance: allocation.allocated - allocation.used,
    }));

    return balances;
};

/**
 * Apply for leave
 */
export const applyLeave = async (userId: string, data: ApplyLeaveDTO) => {
    const employee = await prisma.employee.findFirst({
        where: { userId },
    });

    if (!employee) {
        throw new AppError('Employee profile not found', 404);
    }

    // Calculate days
    const startDate = parseISO(data.startDate);
    const endDate = parseISO(data.endDate);
    const daysTaken = data.isHalfDay ? 0.5 : differenceInDays(endDate, startDate) + 1;

    const currentYear = new Date().getFullYear();

    // Check leave balance
    const allocation = await prisma.leaveAllocation.findFirst({
        where: {
            employeeId: employee.id,
            leaveType: data.leaveType,
            year: currentYear,
        },
    });

    if (!allocation) {
        throw new AppError('No leave allocation found for this leave type', 404);
    }

    const balance = allocation.allocated - allocation.used;
    if (balance < daysTaken) {
        throw new AppError(
            `Insufficient leave balance. Available: ${balance}, Requested: ${daysTaken}`,
            400
        );
    }

    // Check for overlapping requests
    const overlapping = await prisma.leaveRequest.findFirst({
        where: {
            employeeId: employee.id,
            status: {
                in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
            },
            OR: [
                {
                    AND: [
                        { startDate: { lte: endDate } },
                        { endDate: { gte: startDate } },
                    ],
                },
            ],
        },
    });

    if (overlapping) {
        throw new AppError('You have an overlapping leave request', 400);
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
        data: {
            employeeId: employee.id,
            type: data.leaveType,
            startDate: startOfDay(startDate),
            endDate: startOfDay(endDate),
            daysTaken,
            reason: data.reason,
            status: LeaveStatus.PENDING,
        },
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return leaveRequest;
};

/**
 * List leave requests
 */
export const listRequests = async (
    userId: string,
    userRole: Role,
    companyId: string | undefined,
    filters: LeaveRequestFilters
) => {
    const where: any = {};

    // Role-based filtering
    if (userRole === Role.EMPLOYEE) {
        // Employee sees only their own requests
        const employee = await prisma.employee.findFirst({
            where: { userId },
        });

        if (!employee) {
            throw new AppError('Employee profile not found', 404);
        }

        where.employeeId = employee.id;
    } else if (userRole === Role.MANAGER || userRole === Role.HR_ADMIN || userRole === Role.ORG_ADMIN) {
        // Manager/HR sees their company's requests
        if (companyId) {
            where.employee = { companyId };
        }
    }
    // SUPER_ADMIN sees all (no filter) or filtered by companyId

    // Apply additional filters
    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.employeeId) {
        where.employeeId = filters.employeeId;
    }

    if (filters.startDate || filters.endDate) {
        where.AND = [];
        if (filters.startDate) {
            where.AND.push({ startDate: { gte: parseISO(filters.startDate) } });
        }
        if (filters.endDate) {
            where.AND.push({ endDate: { lte: parseISO(filters.endDate) } });
        }
    }

    const requests = await prisma.leaveRequest.findMany({
        where,
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return requests;
};

/**
 * Approve or reject leave request
 */
export const approveRejectRequest = async (
    requestId: string,
    companyId: string | undefined,
    data: ApproveRejectDTO
) => {
    const where: any = { id: requestId };

    if (companyId) {
        where.employee = { companyId };
    }

    const leaveRequest = await prisma.leaveRequest.findFirst({
        where,
        include: {
            employee: true,
        },
    });

    if (!leaveRequest) {
        throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
        throw new AppError('Only pending requests can be approved or rejected', 400);
    }

    // Update request status
    const updated = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
            status: data.status as LeaveStatus,
            approvedBy: data.remarks || null,
        },
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    // If approved, deduct from allocation
    if (data.status === 'APPROVED') {
        await prisma.leaveAllocation.updateMany({
            where: {
                employeeId: leaveRequest.employeeId,
                leaveType: leaveRequest.type,
                year: new Date().getFullYear(),
            },
            data: {
                used: {
                    increment: leaveRequest.daysTaken,
                },
            },
        });

        // Create ledger entry
        await prisma.leaveLedger.create({
            data: {
                employeeId: leaveRequest.employeeId,
                event: LedgerEvent.CONSUMPTION,
                amount: -leaveRequest.daysTaken,
                remarks: `Leave approved: ${leaveRequest.reason || 'No reason provided'}`,
                leaveRequestId: leaveRequest.id,
            },
        });
    }

    return updated;
};

/**
 * Cancel leave request (triggers refund)
 */
export const cancelRequest = async (requestId: string, userId: string) => {
    const employee = await prisma.employee.findFirst({
        where: { userId },
    });

    if (!employee) {
        throw new AppError('Employee profile not found', 404);
    }

    const leaveRequest = await prisma.leaveRequest.findFirst({
        where: {
            id: requestId,
            employeeId: employee.id,
        },
    });

    if (!leaveRequest) {
        throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.status === LeaveStatus.CANCELLED) {
        throw new AppError('Request is already cancelled', 400);
    }

    if (leaveRequest.status === LeaveStatus.REJECTED) {
        throw new AppError('Cannot cancel a rejected request', 400);
    }

    // If approved, refund the days
    if (leaveRequest.status === LeaveStatus.APPROVED) {
        await prisma.leaveAllocation.updateMany({
            where: {
                employeeId: employee.id,
                leaveType: leaveRequest.type,
                year: new Date().getFullYear(),
            },
            data: {
                used: {
                    decrement: leaveRequest.daysTaken,
                },
            },
        });

        // Create refund ledger entry
        await prisma.leaveLedger.create({
            data: {
                employeeId: employee.id,
                event: LedgerEvent.ADJUSTMENT,
                amount: leaveRequest.daysTaken,
                remarks: `Leave cancelled: ${leaveRequest.reason || 'No reason provided'}`,
                leaveRequestId: leaveRequest.id,
            },
        });
    }

    // Update request status
    const updated = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
            status: LeaveStatus.CANCELLED,
        },
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return updated;
};

/**
 * Get leave ledger (audit trail)
 */
export const getLeaveLedger = async (
    employeeId: string,
    companyId: string | undefined,
    leaveType?: LeaveType
) => {
    const where: any = { id: employeeId };

    if (companyId) {
        where.companyId = companyId;
    }

    const employee = await prisma.employee.findFirst({
        where,
    });

    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    const ledgerWhere: any = { employeeId };

    // Note: The new schema doesn't have leaveType in LeaveLedger
    // You'll need to join through leaveRequest if you want to filter by type
    // For now, we'll fetch all ledger entries

    const ledger = await prisma.leaveLedger.findMany({
        where: ledgerWhere,
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return {
        employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
        },
        ledger,
    };
};

/**
 * Manual leave adjustment (HR Admin)
 */
export const adjustLeave = async (companyId: string, data: AdjustLeaveDTO) => {
    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
        where: {
            id: data.employeeId,
            companyId,
        },
    });

    if (!employee) {
        throw new AppError('Employee not found in this company', 404);
    }

    const currentYear = new Date().getFullYear();

    // Get or create allocation
    let allocation = await prisma.leaveAllocation.findFirst({
        where: {
            employeeId: data.employeeId,
            leaveType: data.leaveType,
            year: currentYear,
        },
    });

    if (!allocation) {
        allocation = await prisma.leaveAllocation.create({
            data: {
                employeeId: data.employeeId,
                leaveType: data.leaveType,
                year: currentYear,
                allocated: 0,
                used: 0,
            },
        });
    }

    // Update allocation
    const updateData: any = {};
    if (data.amount > 0) {
        // Credit (add to allocated)
        updateData.allocated = { increment: data.amount };
    } else {
        // Debit (add to used)
        updateData.used = { increment: Math.abs(data.amount) };
    }

    await prisma.leaveAllocation.update({
        where: { id: allocation.id },
        data: updateData,
    });

    // Create ledger entry
    const ledgerEntry = await prisma.leaveLedger.create({
        data: {
            employeeId: data.employeeId,
            event: LedgerEvent.ADJUSTMENT,
            amount: data.amount,
            remarks: data.reason,
        },
    });

    return ledgerEntry;
};

/**
 * Bulk import leave balances
 */
export const importLeaves = async (companyId: string, data: ImportLeaveDTO) => {
    const results = {
        success: [] as any[],
        failed: [] as any[],
    };

    for (const record of data.records) {
        try {
            // Find employee by code
            const employee = await prisma.employee.findFirst({
                where: {
                    code: record.employeeCode,
                    companyId,
                },
            });

            if (!employee) {
                results.failed.push({
                    employeeCode: record.employeeCode,
                    reason: 'Employee not found',
                });
                continue;
            }

            // Create or update allocation
            await prisma.leaveAllocation.upsert({
                where: {
                    employeeId_year_leaveType: {
                        employeeId: employee.id,
                        year: record.year,
                        leaveType: record.leaveType,
                    },
                },
                create: {
                    employeeId: employee.id,
                    leaveType: record.leaveType,
                    year: record.year,
                    allocated: record.allocated,
                    used: record.used || 0,
                },
                update: {
                    allocated: record.allocated,
                    used: record.used || 0,
                },
            });

            // Create ledger entry
            await prisma.leaveLedger.create({
                data: {
                    employeeId: employee.id,
                    event: LedgerEvent.IMPORT,
                    amount: record.allocated,
                    remarks: 'Bulk import - Initial allocation',
                },
            });

            results.success.push({
                employeeCode: record.employeeCode,
                leaveType: record.leaveType,
                allocated: record.allocated,
            });
        } catch (error: any) {
            results.failed.push({
                employeeCode: record.employeeCode,
                reason: error.message || 'Unknown error',
            });
        }
    }

    return results;
};
