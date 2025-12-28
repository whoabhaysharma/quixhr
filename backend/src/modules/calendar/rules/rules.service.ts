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
export async function updateWeeklyRule(calendarId: string, dayOfWeek: number, rule: WeeklyRuleType, weekNumbers?: number[]): Promise<void> {
    // Find existing rule
    const existing = await prisma.calendarWeeklyRule.findFirst({
        where: {
            calendarId,
            dayOfWeek
        }
    });

    if (existing) {
        // Update existing rule
        await prisma.calendarWeeklyRule.update({
            where: { id: existing.id },
            data: {
                rule,
                weekNumbers: weekNumbers || existing.weekNumbers || []
            }
        });
    } else {
        // Create new rule
        await prisma.calendarWeeklyRule.create({
            data: {
                calendarId,
                dayOfWeek,
                rule,
                weekNumbers: weekNumbers || []
            }
        });
    }
}
