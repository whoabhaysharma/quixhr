import { prisma } from '@/utils/prisma';
import { LeaveStatus } from '@prisma/client';
import { startOfWeek, endOfWeek, addDays, format, isSameDay } from 'date-fns';

interface AvailabilityQuery {
    startDate?: string;
    endDate?: string;
}

export class DashboardService {
    /**
     * Get Organization Availability
     */
    static async getAvailability(organizationId: string, query: AvailabilityQuery) {
        // Default to current week (Monday to Sunday) if no dates provided
        const now = new Date();
        const start = query.startDate ? new Date(query.startDate) : startOfWeek(now, { weekStartsOn: 1 });
        const end = query.endDate ? new Date(query.endDate) : endOfWeek(now, { weekStartsOn: 1 });

        // Normalize times
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // 1. Fetch Active Employees
        const employees = await prisma.employee.findMany({
            where: {
                organizationId,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                user: {
                    select: {
                        role: true
                    }
                }
            },
            orderBy: { firstName: 'asc' }
        });

        // 2. Fetch Approved Leaves in Range
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                employee: { organizationId },
                status: LeaveStatus.APPROVED,
                OR: [
                    {
                        startDate: { gte: start, lte: end }
                    },
                    {
                        endDate: { gte: start, lte: end }
                    },
                    {
                        startDate: { lte: start },
                        endDate: { gte: end }
                    }
                ]
            },
            select: {
                id: true,
                employeeId: true,
                startDate: true,
                endDate: true,
                type: true,
                reason: true
            }
        });

        // 3. Generate Week Dates
        const days: { date: string, dayName: string }[] = [];
        let curr = new Date(start);
        while (curr <= end) {
            days.push({
                date: curr.toISOString(),
                dayName: format(curr, 'EEE')
            });
            curr = addDays(curr, 1);
        }

        // 4. Build Availability Map
        const roster = employees.map(emp => {
            const availability = days.map(dayObj => {
                const currentDayDate = new Date(dayObj.date);
                const dayOfWeek = currentDayDate.getDay(); // 0 = Sun, 6 = Sat

                // Rule 1: Sunday is OFF
                if (dayOfWeek === 0) return { status: 'OFF', meta: null };

                // Rule 2: Check Approved Leaves
                const leave = leaves.find(l => {
                    const checkDate = format(currentDayDate, 'yyyy-MM-dd');
                    const sDate = format(new Date(l.startDate), 'yyyy-MM-dd');
                    const eDate = format(new Date(l.endDate), 'yyyy-MM-dd');

                    return l.employeeId === emp.id &&
                        checkDate >= sDate &&
                        checkDate <= eDate;
                });

                if (leave) {
                    return {
                        status: 'ABSENT',
                        meta: {
                            leaveId: leave.id,
                            leaveType: leave.type,
                            reason: leave.reason
                        }
                    };
                }

                // Rule 3: Default Present
                return { status: 'PRESENT', meta: null };
            });

            return {
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                role: emp.user?.role || 'EMPLOYEE',
                dept: 'General', // Placeholder
                avatar: '',
                availability
            };
        });

        return {
            dates: days,
            employees: roster
        };
    }
}
