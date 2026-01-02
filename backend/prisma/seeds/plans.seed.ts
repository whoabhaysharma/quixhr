import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
    console.log('🌱 Seeding subscription plans...');

    // Create Starter Plan
    const starterPlan = await prisma.plan.upsert({
        where: { id: 'starter-plan-id' },
        update: {},
        create: {
            id: 'starter-plan-id',
            name: 'Starter',
            description: 'Perfect for small teams getting started',
            maxEmployees: 10,
            priceMonthly: 999,
            priceYearly: 9999,
            trialDays: 14,
            features: [
                'Up to 10 employees',
                'Attendance tracking',
                'Leave management',
                'Basic reports',
                'Email support',
            ],
            isActive: true,
        },
    });

    // Create Pro Plan
    const proPlan = await prisma.plan.upsert({
        where: { id: 'pro-plan-id' },
        update: {},
        create: {
            id: 'pro-plan-id',
            name: 'Professional',
            description: 'For growing businesses',
            maxEmployees: 50,
            priceMonthly: 2999,
            priceYearly: 29999,
            trialDays: 14,
            features: [
                'Up to 50 employees',
                'Advanced attendance tracking',
                'Leave management with approvals',
                'Custom calendars & holidays',
                'Advanced analytics',
                'Priority email support',
                'API access',
            ],
            isActive: true,
        },
    });

    // Create Enterprise Plan
    const enterprisePlan = await prisma.plan.upsert({
        where: { id: 'enterprise-plan-id' },
        update: {},
        create: {
            id: 'enterprise-plan-id',
            name: 'Enterprise',
            description: 'For large organizations',
            maxEmployees: 500,
            priceMonthly: 9999,
            priceYearly: 99999,
            trialDays: 30,
            features: [
                'Up to 500 employees',
                'All Professional features',
                'Biometric integration',
                'Custom workflows',
                'Dedicated account manager',
                '24/7 phone & email support',
                'Custom integrations',
                'SLA guarantee',
                'Advanced security features',
            ],
            isActive: true,
        },
    });

    console.log('✅ Created plans:');
    console.log(`  - ${starterPlan.name}: ₹${starterPlan.priceMonthly}/mo`);
    console.log(`  - ${proPlan.name}: ₹${proPlan.priceMonthly}/mo`);
    console.log(`  - ${enterprisePlan.name}: ₹${enterprisePlan.priceMonthly}/mo`);
}

async function main() {
    try {
        await seedPlans();
        console.log('\n✨ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
