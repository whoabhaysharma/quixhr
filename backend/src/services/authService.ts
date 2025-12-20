import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendVerificationEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  async register(email: string, name: string, password: string, organizationName: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = uuidv4();

    // Create Organization and User in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
        },
      });

      return tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'HR', // First user is Admin/HR
          organizationId: organization.id,
          googleLoginId: `${email}-${Date.now()}`, // Temporary placeholder if needed
          verificationToken,
          isVerified: false,
        },
      });
    });

    // Send verification email
    // We do NOT await this to avoid blocking the response, but in prod you might want to ensure it sends
    sendVerificationEmail(user.email, verificationToken).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        isVerified: user.isVerified,
      },
      token,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // Clear the token after usage
      },
    });

    return { message: 'Email verified successfully' };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
    };
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }
}
