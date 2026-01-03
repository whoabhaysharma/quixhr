import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Employees Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/v1/employees', () => {
        it('should list employees for Org Admin', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
            // Create some employees
            await createTestEmployee(organizationId);
            await createTestEmployee(organizationId);

            const res = await request(app)
                .get('/api/v1/employees')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.employees.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('POST /api/v1/employees', () => {
        it('should create a new employee', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .post('/api/v1/employees')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane.doe@example.com',
                    joiningDate: new Date().toISOString(),
                    role: Role.EMPLOYEE,
                    status: 'ACTIVE',
                    designation: 'Developer', // Assuming these fields exist in schema
                    department: 'Engineering'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.firstName).toBe('Jane');
        });
    });

    describe('GET /api/v1/employees/:id', () => {
        it('should get employee details', async () => {
            const { token, employee } = await createTestEmployee(undefined, Role.EMPLOYEE);
            // Self access
            const res = await request(app)
                .get(`/api/v1/employees/${employee.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(employee.id);
        });
    });

    describe('PATCH /api/v1/employees/:id', () => {
        it('should update employee', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
            const { employee } = await createTestEmployee(organizationId);

            const res = await request(app)
                .patch(`/api/v1/employees/${employee.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    firstName: 'Updated Name'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.firstName).toBe('Updated Name');
        });
    });

    describe('DELETE /api/v1/employees/:id', () => {
        it('should delete employee (Super Admin only)', async () => {
             const { token } = await createTestUser(Role.SUPER_ADMIN);
             const { employee } = await createTestEmployee();

             const res = await request(app)
                .delete(`/api/v1/employees/${employee.id}`)
                .set('Authorization', `Bearer ${token}`);

             expect(res.status).toBe(204);
        });
    });
});
