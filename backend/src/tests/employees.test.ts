import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';
import { prisma } from './setup';

describe('Employees Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    // We need an admin to perform operations
    const setupAdmin = async () => {
        const { user: adminUser, token: adminToken, organizationId } = await createTestUser(Role.ORG_ADMIN);
        return { adminUser, adminToken, organizationId };
    };

    describe('GET /api/v1/employees', () => {
        it('should list employees for the tenant', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            // Create some employees
            await createTestEmployee(organizationId!, Role.EMPLOYEE);
            await createTestEmployee(organizationId!, Role.MANAGER);

            const res = await request(app)
                .get('/api/v1/employees')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.status).toBe('success');
            expect(res.body.data.data.employees.length).toBe(2);
        });
    });

    describe('POST /api/v1/org/:organizationId/employees', () => {
        it('should create a new employee', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const res = await request(app)
                .post(`/api/v1/org/${organizationId}/employees`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'New',
                    lastName: 'Hire',
                    email: 'newhire@test.com',
                    password: 'Password123!',
                    role: Role.EMPLOYEE,
                    joiningDate: new Date().toISOString(),
                    status: 'ACTIVE'
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.data.firstName).toBe('New');

            const dbEmployee = await prisma.employee.findFirst({ where: { firstName: 'New' } });
            expect(dbEmployee).toBeDefined();
            expect(dbEmployee?.organizationId).toBe(organizationId);
        });
    });

    describe('GET /api/v1/employees/:id', () => {
        it('should get employee details', async () => {
            const { adminToken, organizationId } = await setupAdmin();
            const { employee } = await createTestEmployee(organizationId!, Role.EMPLOYEE);

            const res = await request(app)
                .get(`/api/v1/employees/${employee.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.status).toBe('success');
            expect(res.body.data.data.id).toBe(employee.id);
        });
    });
});
