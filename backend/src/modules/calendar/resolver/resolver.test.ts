import { resolveDay } from './resolver.service';
import { PrismaClient, WeeklyRuleType } from '@prisma/client';
import { cleanDatabase } from '../../../tests/helpers/db.helper';
import { createTestCalendar, createTestEmployee, createCompleteTestUser } from '../../../tests/helpers/auth.helper';

const prisma = new PrismaClient();

describe('Calendar Resolver Service', () => {
    let companyId: string;
    let calendarId: string;
    let employeeId: string;

    beforeEach(async () => {
        await cleanDatabase();
        // Setup base data
        const { company } = await createCompleteTestUser('admin@test.com', 'Pass123!', 'SUPER_ADMIN', 'Test Co', 'Admin');
        companyId = company.id;

        const calendar = await createTestCalendar(companyId, 'General Shift');
        calendarId = calendar.id;

        const employee = await createTestEmployee('Test Emp', companyId);
        // Manually assign calendar since createTestEmployee might not do it depending on changes
        await prisma.employee.update({
            where: { id: employee.id },
            data: { calendarId }
        });
        employeeId = employee.id;

        // Setup Sunday OFF rule for testing
        await prisma.calendarWeeklyRule.create({
            data: {
                calendarId,
                dayOfWeek: 0, // Sunday
                rule: WeeklyRuleType.OFF
            }
        });

        // Setup Saturday rule for Alternate Saturday test (Start as WORKING or just create it when needed)
        // Let's create it as WORKING initially for the "Standard Working Day" checks if Saturday was tested there,
        // but for now we only test Monday there.
        // We will create the Saturday rule in the specific test or here. 
        // Let's create a placeholder Saturday rule validation within the test itself.
    });

    it('should resolve a standard working day', async () => {
        // Monday (Day 1) is typically working by default
        const date = new Date('2025-01-06'); // A Monday
        const resolution = await resolveDay(employeeId, date);

        expect(resolution.dayType).toBe('WORKING');
        expect(resolution.isWorkingDay).toBe(true);
    });

    it('should resolve a weekly off', async () => {
        // Sunday (Day 0) is typically off by default
        const date = new Date('2025-01-05'); // A Sunday
        const resolution = await resolveDay(employeeId, date);

        expect(resolution.dayType).toBe('WEEKLY_OFF');
        expect(resolution.isWorkingDay).toBe(false);
    });

    it('should resolve a holiday overriding a working day', async () => {
        // Set a holiday on a Monday
        await prisma.calendarHoliday.create({
            data: {
                calendarId,
                name: 'Test Holiday',
                startDate: new Date('2025-01-06'), // Monday
                endDate: new Date('2025-01-06')
            }
        });

        const date = new Date('2025-01-06');
        const resolution = await resolveDay(employeeId, date);

        expect(resolution.dayType).toBe('HOLIDAY');
        expect(resolution.isWorkingDay).toBe(false);
        expect(resolution.isHoliday).toBe(true);
    });

    it('should handle alternate saturdays (weekNumbers logic)', async () => {
        // Set Saturday (Day 6) to be OFF only on 1st and 3rd weeks
        // 2nd and 4th Saturdays should be Working

        // First, check basic Saturday is WORKING by default (since we only set Sunday OFF in beforeEach)
        let date = new Date('2025-01-04'); // 1st Saturday of Jan 2025
        let resolution = await resolveDay(employeeId, date);
        expect(resolution.dayType).toBe('WORKING');

        // Now modify rule: Saturday is only OFF on week 1 and 3
        let rule = await prisma.calendarWeeklyRule.findFirst({
            where: { calendarId, dayOfWeek: 6 }
        });

        if (!rule) {
            rule = await prisma.calendarWeeklyRule.create({
                data: {
                    calendarId,
                    dayOfWeek: 6,
                    rule: WeeklyRuleType.OFF,
                    weekNumbers: [1, 3]
                }
            });
        } else {
            await prisma.calendarWeeklyRule.update({
                where: { id: rule.id },
                data: {
                    rule: WeeklyRuleType.OFF,
                    weekNumbers: [1, 3]
                }
            });
        }

        // 1st Saturday (Jan 4) should be OFF
        date = new Date('2025-01-04');
        resolution = await resolveDay(employeeId, date);
        expect(resolution.dayType).toBe('WEEKLY_OFF');

        // 2nd Saturday (Jan 11) should be WORKING (default fallback if rule doesn't match week?)
        // Currently resolver doesn't handle this, so we expect this might fail or need logic definition.
        // If a rule exists for Day 6 but doesn't apply to this week, what happens?
        // Typically it falls back to IsWorking=True or a default rule. 
        // Let's assume default is Working if specific OFF rule doesn't apply.
        date = new Date('2025-01-11');
        resolution = await resolveDay(employeeId, date);
        expect(resolution.dayType).toBe('WORKING');

        // 3rd Saturday (Jan 18) should be OFF
        date = new Date('2025-01-18');
        resolution = await resolveDay(employeeId, date);
        expect(resolution.dayType).toBe('WEEKLY_OFF');
    });
});
