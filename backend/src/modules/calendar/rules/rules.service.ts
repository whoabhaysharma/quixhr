import { PrismaClient, WeeklyRuleType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate default weekly rules (Mon-Fri = WORKING, Sat-Sun = OFF)
 */
export function generateDefaultRules(calendarId: string) {
    const defaults = [];
    for (let i = 0; i < 7; i++) {
        defaults.push({
            calendarId,
            dayOfWeek: i,
            rule: (i === 0 || i === 6) ? WeeklyRuleType.OFF : WeeklyRuleType.WORKING
        });
    }
    return defaults;
}

/**
 * Update weekly rule for a specific day
 */
export async function updateWeeklyRule(calendarId: string, dayOfWeek: number, rule: WeeklyRuleType): Promise<void> {
    await prisma.calendarWeeklyRule.upsert({
        where: {
            calendarId_dayOfWeek: {
                calendarId,
                dayOfWeek
            }
        },
        update: { rule },
        create: {
            calendarId,
            dayOfWeek,
            rule
        }
    });
}
