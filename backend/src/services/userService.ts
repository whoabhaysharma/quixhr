import prisma from './prisma';
import { User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const userService = {
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    },

    async getAllUsers(organizationId?: number): Promise<User[]> {
        if (organizationId) {
            return prisma.user.findMany({
                where: { organizationId },
            });
        }
        return prisma.user.findMany();
    },

    async getUserById(id: number): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
            include: {
                organization: true,
                leaves: true,
            },
        });
    },

    async createUser(data: {
        email: string;
        name?: string;
        password?: string;
        organizationId: number;
        role?: Role;
        googleLoginId?: string;
        avatar?: string;
    }): Promise<User> {
        const { password, ...rest } = data;
        let hashedPassword = undefined;

        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        return prisma.user.create({
            data: {
                ...rest,
                password: hashedPassword,
            },
        });
    },

    async updateUser(id: number, data: Partial<User> & { password?: string }): Promise<User> {
        const { password, ...rest } = data;
        let updateData: any = { ...rest };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        return prisma.user.update({
            where: { id },
            data: updateData,
        });
    },

    async deleteUser(id: number): Promise<void> {
        await prisma.user.delete({
            where: { id },
        });
    },
};
