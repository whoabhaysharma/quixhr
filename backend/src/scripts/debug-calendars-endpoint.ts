
import { PrismaClient } from '@prisma/client';
import { getAllCalendars } from '../modules/calendar/calendar.service';

const prisma = new PrismaClient();

async function main() {
    console.log("Debugging getAllCalendars...");

    // We need a valid companyId to test. Let's find one.
    const company = await prisma.company.findFirst();
    if (!company) {
        console.log("No company found to test with.");
        return;
    }
    console.log("Using Company ID:", company.id);

    try {
        const calendars = await getAllCalendars(company.id);
        console.log("Success! Found calendars:", calendars.length);
        if (calendars.length > 0) {
            console.log("First calendar:", JSON.stringify(calendars[0], null, 2));
        }
    } catch (error: any) {
        console.error("Caught Error in getAllCalendars:");
        console.error(error);
        if (error.code) console.error("Error Code:", error.code);
        if (error.meta) console.error("Error Meta:", error.meta);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
