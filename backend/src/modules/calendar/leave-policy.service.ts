import { PrismaClient, LeaveType } from '@prisma/client';
import { LeavePolicyDto } from './calendar.types';

const prisma = new PrismaClient();

/**
 * Create leave policies for a calendar
 */
export async function createLeavePolicies(
    calendarId: string,
    policies: LeavePolicyDto[]
): Promise<void> {
    await prisma.leavePolicy.createMany({
        data: policies.map(p => ({
            calendarId,
            leaveType: p.leaveType,
            annualAllowance: p.annualAllowance,
            canCarryForward: p.canCarryForward || false,
            maxCarryOver: p.maxCarryOver || 0
        }))
    });
}

/**
 * Get leave policies for a calendar
 */
export async function getCalendarPolicies(calendarId: string) {
    return prisma.leavePolicy.findMany({
        where: { calendarId }
    });
}

/**
 * Update a leave policy
 */
export async function updateLeavePolicy(
    policyId: string,
    updates: Partial<LeavePolicyDto>
): Promise<void> {
    await prisma.leavePolicy.update({
        where: { id: policyId },
        data: updates
    });
}

/**
 * Delete a leave policy
 */
export async function deleteLeavePolicy(policyId: string): Promise<void> {
    await prisma.leavePolicy.delete({
        where: { id: policyId }
    });
}

/**
 * Upsert leave policy (create or update)
 */
export async function upsertLeavePolicy(
    calendarId: string,
    leaveType: LeaveType,
    policy: LeavePolicyDto
): Promise<void> {
    await prisma.leavePolicy.upsert({
        where: {
            calendarId_leaveType: {
                calendarId,
                leaveType
            }
        },
        update: {
            annualAllowance: policy.annualAllowance,
            canCarryForward: policy.canCarryForward,
            maxCarryOver: policy.maxCarryOver
        },
        create: {
            calendarId,
            leaveType: policy.leaveType,
            annualAllowance: policy.annualAllowance,
            canCarryForward: policy.canCarryForward || false,
            maxCarryOver: policy.maxCarryOver || 0
        }
    });
}
