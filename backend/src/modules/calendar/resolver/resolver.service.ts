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
    const employeeCalendar = await prisma.employeeCalendar.findUnique({
        where: { employeeId },
        include: {
            calendar: {
                include: {
                    weeklyRules: true,
                    holidays: true
                }
            }
        }
    });

    if (!employeeCalendar) {
        throw new Error('Employee has no assigned calendar');
    }

    const { calendar } = employeeCalendar;

    // Check for Holiday
    const holiday = calendar.holidays.find(h => {
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        return date >= start && date <= end;
    });

    if (holiday) {
        return { dayType: 'HOLIDAY', isWorkingDay: false };
    }

    // Check Weekly Rule
    const dayOfWeek = date.getDay();
    const weeklyRule = calendar.weeklyRules.find(r => r.dayOfWeek === dayOfWeek);

    const rule = weeklyRule ? weeklyRule.rule : WeeklyRuleType.WORKING;

    if (rule === WeeklyRuleType.OFF) {
        return { dayType: 'WEEKLY_OFF', isWorkingDay: false };
    }

    if (rule === WeeklyRuleType.ALTERNATE) {
        const weekNumber = getWeekOfMonth(date);
        const isOff = weekNumber % 2 === 0;
        return {
            dayType: isOff ? 'WEEKLY_OFF' : 'WORKING',
            isWorkingDay: !isOff
        };
    }

    return { dayType: 'WORKING', isWorkingDay: true };
}
