
import { PrismaClient } from '@prisma/client';
import { getCalendarById } from '../modules/calendar/calendar.service';

const prisma = new PrismaClient();

async function main() {
    // Find a calendar
    const calendar = await prisma.calendar.findFirst();
    if (!calendar) {
        console.log("No calendar found");
        return;
    }

    console.log(`Checking calendar: ${calendar.name} (${calendar.id})`);

    // Call service method
    const result = await getCalendarById(calendar.id);

    if (!result) {
        console.log("Service returned null");
        return;
    }

    console.log("Assigned Employees:", result.assignedEmployees.length);
    if (result.assignedEmployees.length > 0) {
        const emp = result.assignedEmployees[0];
        console.log("First Employee:", emp.name);
        console.log("Leave Balances:", JSON.stringify(emp.leaveBalances, null, 2));
    } else {
        console.log("No employees assigned to check balances for.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
