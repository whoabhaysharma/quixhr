import { PrismaClient, LeaveType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Assign a calendar to an employee and auto-create leave balances
 * This is the "trigger" logic that creates LeaveBalance records based on LeavePolicy
 */
export async function assignCalendarToEmployee(
    employeeId: string,
    calendarId: string,
    year: number = new Date().getFullYear()
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        // Update employee's calendar assignment
        await tx.employee.update({
            where: { id: employeeId },
            data: { calendarId }
        });

        // Fetch all leave policies for this calendar
        const leavePolicies = await tx.leavePolicy.findMany({
            where: { calendarId }
        });

        // Create/upsert leave balances for each policy
        for (const policy of leavePolicies) {
            await tx.leaveBalance.upsert({
                where: {
                    employeeId_type_year: {
                        employeeId,
                        type: policy.leaveType,
                        year
                    }
                },
                update: {
                    allocated: policy.annualAllowance
                },
                create: {
                    employeeId,
                    type: policy.leaveType,
                    year,
                    allocated: policy.annualAllowance,
                    used: 0
                }
            });
        }
    });
}

/**
 * Unassign calendar from employee (sets calendarId to null)
 */
export async function unassignCalendarFromEmployee(employeeId: string): Promise<void> {
    await prisma.employee.update({
        where: { id: employeeId },
        data: { calendarId: null }
    });
}

/**
 * Get employees assigned to a calendar
 */
export async function getEmployeesForCalendar(calendarId: string) {
    return prisma.employee.findMany({
        where: { calendarId },
        include: {
            user: true,
            leaveBalances: true
        }
    });
}
