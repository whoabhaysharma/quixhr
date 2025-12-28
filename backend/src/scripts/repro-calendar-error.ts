
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Attempting to fetch calendars with leaveBalances include...");

    try {
        const calendars = await prisma.calendar.findMany({
            take: 1,
            include: {
                weeklyRules: { orderBy: { dayOfWeek: 'asc' } },
                holidays: { orderBy: { startDate: 'asc' } },
                employees: {
                    include: {
                        employee: {
                            include: {
                                user: true,
                                leaveBalances: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log("Successfully fetched calendars.");
        console.log("Count:", calendars.length);
        if (calendars.length > 0) {
            // Check if we can access the deeply nested property to ensure runtime structure is correct
            const emp = calendars[0].employees[0];
            if (emp) {
                console.log("Employee found:", emp.employee.name);
                console.log("Leave Balances:", (emp.employee as any).leaveBalances);
            }
        }

    } catch (error: any) {
        console.error("CRITICAL ERROR during query execution:");
        console.error(error);
        if (error.meta) {
            console.error("Error Meta:", error.meta);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
