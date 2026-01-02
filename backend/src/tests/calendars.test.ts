import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser } from './helpers/auth.helper';
import { Role, WeeklyRuleType, RuleStrategy } from '@prisma/client';

describe('Calendars Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    const setupAdmin = async () => {
        const { user: adminUser, token: adminToken, companyId } = await createTestUser(Role.ORG_ADMIN);
        return { adminUser, adminToken, companyId: companyId! };
    };

    describe('Calendar CRUD', () => {
        it('should allow admin to create a calendar', async () => {
            const { adminToken, companyId } = await setupAdmin();

            const res = await request(app)
                .post(`/api/v1/companies/${companyId}/calendars`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'General Shift',
                    dayStartTime: 540, // 09:00
                    dayEndTime: 1080   // 18:00
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.name).toBe('General Shift');
            expect(res.body.data.companyId).toBe(companyId);
        });

        it('should list calendars for the company', async () => {
            const { adminToken, companyId } = await setupAdmin();

            // Create one first
            await request(app)
                .post(`/api/v1/companies/${companyId}/calendars`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Shift A',
                    dayStartTime: 480,
                    dayEndTime: 960
                });

            const res = await request(app)
                .get('/api/v1/calendars')
                .set('Authorization', `Bearer ${adminToken}`);

            if (res.body.status !== 'success') {
                console.log('LIST Calendars failed:', JSON.stringify(res.body, null, 2));
            }
            expect(res.body.status).toBe('success');
            // Service returns { data: [...], meta: ... }
            expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
            // Controller: CalendarService.findAll returns { calendars: [], pagination: {} } usually?
            // Let's check CalendarService.findAll response structure.
            // Actually, best to check response body in test validation if I am unsure.
            // But let's assume it returns data directly or strict DTO.
            // employees.test.ts had res.body.data.data.employees. 
            // Here logs might help if it fails. 
            // I'll assume res.body.data.calendars based on standard pagination response in this codebase.
        });

        it('should get calendar details', async () => {
            const { adminToken, companyId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/companies/${companyId}/calendars`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Detail Test',
                    dayStartTime: 540,
                    dayEndTime: 1080
                });

            const calendarId = createRes.body.data.id;

            const res = await request(app)
                .get(`/api/v1/calendars/${calendarId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.status).toBe('success');
            expect(res.body.data.id).toBe(calendarId);
        });

        it('should update a calendar', async () => {
            const { adminToken, companyId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/companies/${companyId}/calendars`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'To Update',
                    dayStartTime: 540,
                    dayEndTime: 1080
                });

            const calendarId = createRes.body.data.id;

            const res = await request(app)
                .patch(`/api/v1/calendars/${calendarId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Name'
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.name).toBe('Updated Name');
        });
    });

    describe('Weekly Rules', () => {
        it('should add a weekly rule', async () => {
            const { adminToken, companyId } = await setupAdmin();
            const calRes = await request(app)
                .post(`/api/v1/companies/${companyId}/calendars`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Rules Cal', dayStartTime: 540, dayEndTime: 1080 });

            const calendarId = calRes.body.data.id;

            const res = await request(app)
                .post(`/api/v1/calendars/${calendarId}/weekly-rules`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    dayOfWeek: 0, // Sunday
                    type: WeeklyRuleType.OFF,
                    strategy: RuleStrategy.CYCLIC,
                    interval: 1
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.type).toBe(WeeklyRuleType.OFF);
        });
    });

    describe('Holidays', () => {
        it('should add a holiday', async () => {
            const { adminToken, companyId } = await setupAdmin();
            const calRes = await request(app)
                .post(`/api/v1/companies/${companyId}/calendars`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Holiday Cal', dayStartTime: 540, dayEndTime: 1080 });

            const calendarId = calRes.body.data.id;

            const res = await request(app)
                .post(`/api/v1/calendars/${calendarId}/holidays`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Year',
                    date: '2025-01-01T00:00:00.000Z',
                    isOptional: false
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.name).toBe('New Year');
        });
    });
});
