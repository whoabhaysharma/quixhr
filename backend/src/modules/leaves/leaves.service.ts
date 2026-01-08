import { prisma } from '@/utils/prisma';
import { addEmailToQueue, addMultipleEmailsToQueue } from '@/infra/queues/email.queue';
import { addNotificationToQueue } from '@/infra/queues/notification.queue';
import { NotificationType } from '@/constants';
import { AppError } from '@/utils/appError';
import { LeaveStatus, Role } from '@prisma/client';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy, validateOrganizationResource } from '@/utils/prismaHelpers';
import {
    CreateLeaveGradeInput,
    UpdateLeaveGradeInput,
    CreateLeavePolicyInput,
    UpdateLeavePolicyInput,
    CreateLeaveRequestInput,
    UpdateLeaveRequestStatusInput,
    UpdateLeaveRequestInput,
    LeaveRequestQuery,
    LeaveGradeQuery,
} from './leaves.schema';

export class LeaveService {
    // =========================================================================
    // LEAVE GRADES
    // =========================================================================

    static async createGrade(organizationId: string, data: CreateLeaveGradeInput) {
        return await prisma.leaveGrade.create({
            data: {
                ...data,
                organizationId,
            },
            include: { policies: true },
        });
    }

    static async getGrades(
        organizationId: string,
        pagination: ParsedPagination,
        filters: LeaveGradeQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder, search } = pagination;

        const where: any = { organizationId };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['name', 'createdAt'],
            defaultSort: { name: 'asc' },
        });

        const [data, total] = await Promise.all([
            prisma.leaveGrade.findMany({
                where,
                include: { policies: true },
                orderBy: orderBy as any,
                skip,
                take: limit,
            }),
            prisma.leaveGrade.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getGradeById(organizationId: string, gradeId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leaveGrade.findUnique({
            where: { id: gradeId },
            include: { policies: true },
        });
    }

    static async updateGrade(
        organizationId: string,
        gradeId: string,
        data: UpdateLeaveGradeInput
    ) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leaveGrade.update({
            where: { id: gradeId },
            data,
            include: { policies: true },
        });
    }

    static async deleteGrade(organizationId: string, gradeId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        // Check if grade is assigned to employees
        const employeeCount = await prisma.employee.count({
            where: { leaveGradeId: gradeId },
        });

        if (employeeCount > 0) {
            throw new AppError(
                `Cannot delete leave grade assigned to ${employeeCount} employee(s)`,
                400
            );
        }

        await prisma.leaveGrade.delete({ where: { id: gradeId } });
    }

    // =========================================================================
    // LEAVE POLICIES
    // =========================================================================

    static async createPolicy(
        organizationId: string,
        gradeId: string,
        data: CreateLeavePolicyInput
    ) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leavePolicy.create({
            data: {
                ...data,
                leaveGradeId: gradeId,
            },
        });
    }

    static async getPolicies(organizationId: string, gradeId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leavePolicy.findMany({
            where: { leaveGradeId: gradeId },
            orderBy: { leaveType: 'asc' },
        });
    }

    static async updatePolicy(
        organizationId: string,
        gradeId: string,
        policyId: string,
        data: UpdateLeavePolicyInput
    ) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        const policy = await prisma.leavePolicy.findUnique({
            where: { id: policyId },
        });

        if (!policy || policy.leaveGradeId !== gradeId) {
            throw new AppError('Policy not found', 404);
        }

        return await prisma.leavePolicy.update({
            where: { id: policyId },
            data,
        });
    }

    static async deletePolicy(organizationId: string, gradeId: string, policyId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        const policy = await prisma.leavePolicy.findUnique({
            where: { id: policyId },
        });

        if (!policy || policy.leaveGradeId !== gradeId) {
            throw new AppError('Policy not found', 404);
        }

        await prisma.leavePolicy.delete({ where: { id: policyId } });
    }

    static async getPolicyById(policyId: string) {
        return await prisma.leavePolicy.findUnique({
            where: { id: policyId },
            include: { grade: true },
        });
    }

    // =========================================================================
    // LEAVE REQUESTS
    // =========================================================================

    /**
     * Helper: Get all users who should receive leave request notifications
     * Returns: org admins, HR admins, and the employee's manager
     */
    private static async getLeaveRequestNotificationRecipients(
        organizationId: string,
        employeeId: string
    ) {
        // Fetch employee with manager info
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                code: true,
                organizationId: true,
                managerId: true,
                manager: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                employee: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                organization: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!employee) {
            throw new AppError('Employee not found', 404);
        }

        // Fetch all org admins and HR admins
        const admins = await prisma.user.findMany({
            where: {
                role: {
                    in: [Role.ORG_ADMIN, Role.HR_ADMIN],
                },
                employee: {
                    organizationId,
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        const recipients: Array<{
            userId: string;
            email: string;
            name: string;
            role: string;
        }> = [];

        // Add admins
        for (const admin of admins) {
            recipients.push({
                userId: admin.id,
                email: admin.email,
                name: admin.employee
                    ? `${admin.employee.firstName} ${admin.employee.lastName}`
                    : 'Admin',
                role: admin.role,
            });
        }

        // Add manager (if exists and not already in list)
        if (employee.manager?.user) {
            const isAlreadyIncluded = recipients.some(r => r.userId === employee.manager!.user!.id);
            if (!isAlreadyIncluded) {
                recipients.push({
                    userId: employee.manager.user.id,
                    email: employee.manager.user.email,
                    name: employee.manager.user.employee
                        ? `${employee.manager.user.employee.firstName} ${employee.manager.user.employee.lastName}`
                        : 'Manager',
                    role: 'MANAGER',
                });
            }
        }

        return {
            recipients,
            employee: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                code: employee.code,
                organizationName: employee.organization.name,
            },
        };
    }

    static async createRequest(
        organizationId: string,
        employeeId: string,
        data: CreateLeaveRequestInput,
        initialStatus: LeaveStatus = LeaveStatus.PENDING,
        approvedBy?: string
    ) {
        await validateOrganizationResource('employee', employeeId, organizationId, 'Employee');

        // Calculate days taken (simplified - should account for weekends/holidays)
        const start = new Date(data.startDate);
        start.setHours(0, 0, 0, 0); // Normalize to start of day

        const end = new Date(data.endDate);
        end.setHours(23, 59, 59, 999); // Normalize to end of day

        const diffTime = Math.abs(end.getTime() - start.getTime());
        // Add 1 day worth of ms to diff before dividing to include the full last day
        // Or simpler: (End - Start) around 24*days. Since we stretched end to 23:59, diff is almost n days.
        // Let's stick to the original days calculation logic but using clean dates roughly?
        // Actually for daysTaken calculation, usually we want simple dates. 
        // Let's use clean clones for calculation to avoid off-by-one due to 23:59
        const calcStart = new Date(data.startDate); calcStart.setHours(0, 0, 0, 0);
        const calcEnd = new Date(data.endDate); calcEnd.setHours(0, 0, 0, 0);
        const daysTaken = Math.ceil(Math.abs(calcEnd.getTime() - calcStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        console.log('Checking Overlap:', {
            start: start.toISOString(),
            end: end.toISOString()
        });

        // Check for overlapping requests
        const overlappingRequest = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: {
                    not: LeaveStatus.REJECTED,
                },
                AND: [
                    // Existing Start <= New End
                    { startDate: { lte: end } },
                    // Existing End >= New Start
                    { endDate: { gte: start } },
                ],
            },
        });

        console.log('Found Overlap:', overlappingRequest ? {
            id: overlappingRequest.id,
            start: overlappingRequest.startDate.toISOString(),
            end: overlappingRequest.endDate.toISOString()
        } : 'None');
        console.log('---------------------------');

        if (overlappingRequest) {
            throw new AppError(
                `Leave request overlaps with an existing request (${overlappingRequest.startDate.toLocaleDateString()} - ${overlappingRequest.endDate.toLocaleDateString()})`,
                400
            );
        }

        // Get notification recipients (admins + manager)
        const { recipients, employee } = await this.getLeaveRequestNotificationRecipients(
            organizationId,
            employeeId
        );

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId,
                startDate: start,
                endDate: end,
                type: data.type,
                reason: data.reason,
                daysTaken,
                status: initialStatus,
                dayDetails: data.dayDetails ?? undefined,
                approvedBy: initialStatus === LeaveStatus.APPROVED ? approvedBy : undefined,
            },
        });

        // Format dates for notifications
        const startDateFormatted = leaveRequest.startDate.toLocaleDateString();
        const endDateFormatted = leaveRequest.endDate.toLocaleDateString();
        const employeeName = `${employee.firstName} ${employee.lastName}`;

        // Send email notifications to all recipients (admins + manager)
        if (recipients.length > 0) {
            const recipientEmails = recipients.map(r => r.email);

            await addMultipleEmailsToQueue(
                recipientEmails,
                'New Leave Request - Action Required',
                'leave-request',
                {
                    recipientName: 'Team', // Generic greeting since it goes to multiple people
                    employeeName,
                    employeeCode: employee.code,
                    leaveType: leaveRequest.type,
                    startDate: startDateFormatted,
                    endDate: endDateFormatted,
                    daysTaken: leaveRequest.daysTaken,
                    reason: leaveRequest.reason,
                    organizationName: employee.organizationName,
                }
            );
        }

        // Send in-app notifications to all recipients
        const notificationData = {
            employeeName,
            leaveType: leaveRequest.type,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            daysTaken: leaveRequest.daysTaken,
        };

        for (const recipient of recipients) {
            await addNotificationToQueue(
                recipient.userId,
                NotificationType.LEAVE_REQUEST_CREATED,
                notificationData
            );
        }

        return leaveRequest;
    }

    static async getRequests(
        organizationId: string,
        pagination: ParsedPagination,
        filters: LeaveRequestQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder } = pagination;
        const { employeeId, status, type, startDate, endDate } = filters;

        const where: any = {
            employee: { organizationId },
        };

        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
        if (type) where.type = type;
        if (startDate && endDate) {
            where.startDate = { gte: new Date(startDate) };
            where.endDate = { lte: new Date(endDate) };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['startDate', 'endDate', 'type', 'status', 'createdAt'],
            defaultSort: { createdAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.leaveRequest.findMany({
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
                                    email: true
                                }
                            }
                        },
                    },
                },
                orderBy: orderBy as any,
                skip,
                take: limit,
            }),
            prisma.leaveRequest.count({ where }),
        ]);

        const mappedData = data.map(leave => ({
            ...leave,
            user: {
                name: `${leave.employee.firstName} ${leave.employee.lastName}`,
                email: leave.employee.user?.email || 'N/A'
            }
        }));

        return {
            data: mappedData,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getRequestById(organizationId: string, requestId: string) {
        const request = await prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        code: true,
                        organizationId: true,
                    },
                },
            },
        });

        if (!request) {
            throw new AppError('Leave request not found', 404);
        }

        if (request.employee.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        return request;
    }

    static async updateRequestStatus(
        organizationId: string,
        requestId: string,
        data: UpdateLeaveRequestStatusInput,
        approvedBy?: string
    ) {
        const request = await this.getRequestById(organizationId, requestId);

        if (request.status !== LeaveStatus.PENDING) {
            throw new AppError('Only pending requests can be updated', 400);
        }

        const updatedRequest = await prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: data.status,
                approvedBy,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                        organization: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        // Send Email Notification
        if (
            (updatedRequest.status === LeaveStatus.APPROVED || updatedRequest.status === LeaveStatus.REJECTED) &&
            updatedRequest.employee.user?.email
        ) {
            const startDate = new Date(updatedRequest.startDate).toLocaleDateString();
            const endDate = new Date(updatedRequest.endDate).toLocaleDateString();

            await addEmailToQueue({
                to: updatedRequest.employee.user.email,
                subject: `Leave Request ${updatedRequest.status}`,
                template: 'leave-status',
                data: {
                    status: updatedRequest.status,
                    employeeName: `${updatedRequest.employee.firstName} ${updatedRequest.employee.lastName}`,
                    leaveType: updatedRequest.type,
                    startDate,
                    endDate,
                    daysTaken: updatedRequest.daysTaken,
                    organizationName: updatedRequest.employee.organization.name,
                    reason: updatedRequest.reason,
                },
            });
        }

        // Queue in-app notification for employee
        if (updatedRequest.employee.user) {
            const notificationType = updatedRequest.status === LeaveStatus.APPROVED
                ? NotificationType.LEAVE_REQUEST_APPROVED
                : NotificationType.LEAVE_REQUEST_REJECTED;

            await addNotificationToQueue(
                updatedRequest.employee.user.id,
                notificationType,
                {
                    leaveType: updatedRequest.type,
                    startDate: new Date(updatedRequest.startDate).toLocaleDateString(),
                    endDate: new Date(updatedRequest.endDate).toLocaleDateString(),
                    daysTaken: updatedRequest.daysTaken,
                }
            );
        }

        return updatedRequest;
    }

    static async updateRequest(
        organizationId: string,
        requestId: string,
        data: UpdateLeaveRequestInput,
        userRole: string
    ) {
        const request = await this.getRequestById(organizationId, requestId);

        // Validation: Only allow updates if PENDING or if user is Admin
        if (request.status !== LeaveStatus.PENDING && !['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(userRole)) {
            throw new AppError('Cannot edit approved/rejected leaves', 400);
        }

        const updates: any = {};
        if (data.type) updates.type = data.type;
        if (data.reason) updates.reason = data.reason;

        let newDaysTaken = request.daysTaken;

        // Handle date updates explicitly to recalculate daysTaken
        let newStart = request.startDate;
        let newEnd = request.endDate;

        if (data.startDate) {
            newStart = new Date(data.startDate);
            updates.startDate = newStart;
        }
        if (data.endDate) {
            newEnd = new Date(data.endDate);
            updates.endDate = newEnd;
        }

        if (data.startDate || data.endDate) {
            const diffTime = Math.abs(newEnd.getTime() - newStart.getTime());
            newDaysTaken = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            updates.daysTaken = newDaysTaken;
        }

        const updatedRequest = await prisma.leaveRequest.update({
            where: { id: requestId },
            data: updates,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        organization: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        return updatedRequest;
    }
    static async deleteRequest(
        organizationId: string,
        requestId: string,
        user: { userId: string; role: string; employeeId?: string }
    ) {
        const request = await prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: {
                employee: {
                    select: {
                        id: true,
                        userId: true,
                        organizationId: true,
                        managerId: true,
                    },
                },
            },
        });

        if (!request) {
            throw new AppError('Leave request not found', 404);
        }

        // Validate Organization Scope (skip for Super Admin)
        if (user.role !== 'SUPER_ADMIN' && request.employee.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        const isOrgAdmin = user.role === Role.ORG_ADMIN;
        const isHrAdmin = user.role === Role.HR_ADMIN;
        const isOwner = request.employee.userId === user.userId;

        // Authorization Logic
        if (isSuperAdmin || isOrgAdmin || isHrAdmin) {
            // Admins can delete any request
            // Clean up related notifications could be added here if necessary
        } else if (isOwner) {
            // Owner can only delete if PENDING
            if (request.status !== LeaveStatus.PENDING) {
                throw new AppError('You can only delete pending leave requests', 400);
            }
        } else {
            // Anyone else is denied
            throw new AppError('Permission denied', 403);
        }

        await prisma.leaveRequest.delete({ where: { id: requestId } });
    }
}
