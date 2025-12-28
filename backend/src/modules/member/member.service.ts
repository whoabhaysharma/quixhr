import { PrismaClient, Role } from '@prisma/client';
import { CreateMemberDto, UpdateMemberDto, MemberResponseDto } from './member.types';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createMember(dto: CreateMemberDto): Promise<MemberResponseDto> {
    // Check if user exists, if not create one
    let user = await prisma.user.findUnique({
        where: { email: dto.email }
    });

    if (!user) {
        // Create default user with random password
        // In a real app, we'd send an invite email
        const generatedPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        user = await prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: (dto.role as Role) || Role.EMPLOYEE,
                emailVerified: false,
            }
        });
    }

    const member = await prisma.employee.create({
        data: {
            userId: user.id,
            companyId: dto.companyId,
            name: dto.name,
            status: dto.status || 'ACTIVE',
        },
        include: {
            user: true,
            company: {
                select: {
                    name: true,
                },
            },
        }
    });

    // Create notification for new member
    const { notifyEmployee } = await import('../notification/notification.helper');
    await notifyEmployee.added(user.id, dto.name, member.company.name);

    return {
        id: member.id,
        userId: member.userId,
        companyId: member.companyId,
        name: member.name,
        status: member.status,
        email: member.user.email,
        role: member.user.role,
        createdAt: member.createdAt
    };
}

export async function getAllMembers(companyId: string, page = 1, limit = 10, search?: string): Promise<{ data: MemberResponseDto[], total: number }> {
    const skip = (page - 1) * limit;

    const where: any = {
        companyId,
    };

    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    const [members, total] = await Promise.all([
        prisma.employee.findMany({
            where,
            include: { user: true },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.employee.count({ where })
    ]);

    const data = members.map(mem => ({
        id: mem.id,
        userId: mem.userId,
        companyId: mem.companyId,
        name: mem.name,
        status: mem.status,
        email: mem.user.email,
        role: mem.user.role,
        createdAt: mem.createdAt
    }));

    return { data, total };
}

export async function getMemberById(id: string): Promise<MemberResponseDto | null> {
    const member = await prisma.employee.findUnique({
        where: { id },
        include: { user: true }
    });

    if (!member) return null;

    return {
        id: member.id,
        userId: member.userId,
        companyId: member.companyId,
        name: member.name,
        status: member.status,
        email: member.user.email,
        role: member.user.role,
        createdAt: member.createdAt
    };
}

export async function updateMember(id: string, dto: UpdateMemberDto): Promise<MemberResponseDto> {
    // Get current member data to compare changes
    const currentMember = await prisma.employee.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!currentMember) {
        throw new Error('Member not found');
    }

    const member = await prisma.employee.update({
        where: { id },
        data: {
            name: dto.name,
            status: dto.status,
        },
        include: { user: true }
    });

    const { notifyEmployee } = await import('../notification/notification.helper');

    // Notify if status changed
    if (dto.status && dto.status !== currentMember.status) {
        await notifyEmployee.statusChanged(member.userId, dto.status);
    }

    // Update role if provided
    if (dto.role) {
        // If demoting an HR Admin, ensure they are not the last one
        if (currentMember.user.role === Role.HR_ADMIN && dto.role !== Role.HR_ADMIN) {
            const adminCount = await prisma.user.count({
                where: {
                    role: Role.HR_ADMIN,
                    employee: {
                        companyId: currentMember.companyId
                    }
                }
            });

            if (adminCount <= 1) {
                throw new Error('Cannot demote the last HR Admin');
            }
        }

        await prisma.user.update({
            where: { id: member.userId },
            data: { role: dto.role as Role }
        });
        member.user.role = dto.role as Role;

        // Notify if role changed
        if (dto.role !== currentMember.user.role) {
            await notifyEmployee.roleChanged(member.userId, dto.role);
        }
    }

    // Notify profile update if name changed
    if (dto.name && dto.name !== currentMember.name) {
        await notifyEmployee.profileUpdated(member.userId);
    }

    return {
        id: member.id,
        userId: member.userId,
        companyId: member.companyId,
        name: member.name,
        status: member.status,
        email: member.user.email,
        role: member.user.role,
        createdAt: member.createdAt
    };
}

export async function deleteMember(id: string): Promise<void> {
    // Check if this is the last HR ADMIN before deleting/demoting
    const member = await prisma.employee.findUnique({
        where: { id },
        include: { user: true }
    });

    if (!member) throw new Error('Member not found');

    if (member.user.role === Role.HR_ADMIN) {
        const adminCount = await prisma.user.count({
            where: {
                role: Role.HR_ADMIN,
                employee: {
                    companyId: member.companyId
                }
            }
        });

        if (adminCount <= 1) {
            throw new Error('Cannot remove the last HR Admin from the company');
        }
    }

    // Delete member record
    await prisma.employee.delete({
        where: { id }
    });
}

export async function assignCalendarToMember(memberId: string, calendarId: string): Promise<void> {
    const member = await prisma.employee.findUnique({ where: { id: memberId } });
    if (!member) throw new Error('Member not found');

    const calendar = await prisma.calendar.findUnique({ where: { id: calendarId } });
    if (!calendar) throw new Error('Calendar not found');

    if (member.companyId !== calendar.companyId) {
        throw new Error('Member and Calendar must belong to the same company');
    }

    await prisma.employeeCalendar.upsert({
        where: { employeeId: memberId },
        update: { calendarId },
        create: {
            employeeId: memberId,
            calendarId
        }
    });
}
export async function getMemberByUserId(userId: string): Promise<MemberResponseDto | null> {
    const member = await prisma.employee.findFirst({
        where: { userId },
        include: { user: true }
    });

    if (!member) return null;

    return {
        id: member.id,
        userId: member.userId,
        companyId: member.companyId,
        name: member.name,
        status: member.status,
        email: member.user.email,
        role: member.user.role,
        createdAt: member.createdAt
    };
}
