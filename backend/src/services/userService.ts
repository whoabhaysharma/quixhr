import { prisma } from '../config/database';
import { Role } from '@prisma/client';

export class UserService {
  async createUser(email: string, name: string, organizationId: number, role: Role = Role.EMPLOYEE) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        organizationId,
        googleLoginId: `${email}-${Date.now()}`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getAllUsers(organizationId: number) {
    return prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUsersByRole(role: Role, organizationId: number) {
    return prisma.user.findMany({
      where: { role, organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateUser(id: number, data: Partial<{ name: string; avatar: string; role: Role }>) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
