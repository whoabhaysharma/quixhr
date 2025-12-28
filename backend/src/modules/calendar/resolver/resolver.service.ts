import { PrismaClient, WeeklyRuleType } from '@prisma/client';
import { DayResolution } from '../calendar.types';

const prisma = new PrismaClient();

/**
 * Helper: Identify week of the month (1-5)
 */
function getWeekOfMonth(date: Date): number {
    const day = date.getDate();
    return Math.ceil(day / 7);
}

/**
 * Resolves the day type for an employee on a specific date
 */
export async function resolveDay(employeeId: string, date: Date): Promise<DayResolution> {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            calendar: {
                include: {
                    weeklyRules: true,
                    holidays: true
                }
            }
        }
    });

    if (!employee || !employee.calendar) {
        throw new Error('Employee has no assigned calendar');
    }

    const { calendar } = employee;

    // Check for Holiday
    const holiday = calendar.holidays.find((h: { startDate: Date; endDate: Date }) => {
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        return date >= start && date <= end;
    });

    if (holiday) {
        return { dayType: 'HOLIDAY', isWorkingDay: false, isHoliday: true };
    }

    // Check Weekly Rule
    const dayOfWeek = date.getDay();
    const weeklyRule = calendar.weeklyRules.find((r: { dayOfWeek: number }) => r.dayOfWeek === dayOfWeek);

    if (weeklyRule) {
        // Check if this rule applies to the current week number
        if (weeklyRule.weekNumbers && weeklyRule.weekNumbers.length > 0) {
            const currentWeek = getWeekOfMonth(date);
            if (!weeklyRule.weekNumbers.includes(currentWeek)) {
                // Determine what to do if the rule DOES NOT apply.
                // If the specific rule (e.g. OFF) doesn't apply, it typically defaults to the opposite or a standard working day.
                // For "Alternate Saturdays OFF", the rule is OFF for weeks [1, 3], so for weeks [2, 4] it is WORKING.
                // So if we found a rule but it doesn't match the week, we treat it as WORKING.
                return { dayType: 'WORKING', isWorkingDay: true };
            }
        }

        const rule = weeklyRule.rule;

        if (rule === WeeklyRuleType.OFF) {
            return { dayType: 'WEEKLY_OFF', isWorkingDay: false };
        }

        if (rule === WeeklyRuleType.HALF_DAY) {
            return { dayType: 'WORKING', isWorkingDay: true }; // You might want to distinguish HALF_DAY in IsWorkingDay if needed, but typically it is a working day.
        }
    }

    // Default if no rule found
    return { dayType: 'WORKING', isWorkingDay: true };
}
