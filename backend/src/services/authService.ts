import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import admin from '../config/firebase';
import { config } from '../config';
import prisma from './prisma';
import { userService } from './userService';
import { Role } from '@prisma/client';

export const authService = {
    async login(email: string, password: string) {
        const user = await userService.findByEmail(email);

        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                organizationId: user.organizationId,
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        return {
            token,
            user: userWithoutPassword,
        };
    },

    async loginWithFirebase(idToken: string) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const { email } = decodedToken;

            if (!email) {
                throw new Error('Firebase token does not contain an email address');
            }

            const user = await userService.findByEmail(email);

            if (!user) {
                throw new Error('User not found. Please register first.');
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    organizationId: user.organizationId,
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1d' }
            );

            const { password: _, ...userWithoutPassword } = user;

            return {
                token,
                user: userWithoutPassword,
            };

        } catch (error) {
            console.error('Firebase Auth Error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Invalid Firebase Token');
        }
    },

    async registerWithFirebase(idToken: string, name?: string) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const { email, uid, picture } = decodedToken;

            if (!email) {
                throw new Error('Firebase token does not contain an email address');
            }

            const existingUser = await userService.findByEmail(email);
            if (existingUser) {
                throw new Error('User already exists. Please login.');
            }

            const isSuperAdmin = email === config.superAdminEmail;
            const role = isSuperAdmin ? Role.SUPER_ADMIN : Role.ADMIN;

            // Proceed to create user WITHOUT organization
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name: name || decodedToken.name || email.split('@')[0],
                    avatar: picture,
                    role: role,
                    googleLoginId: uid,
                    // organizationId is now optional, so we don't set it
                }
            });

            const token = jwt.sign(
                {
                    id: newUser.id,
                    role: newUser.role,
                    organizationId: newUser.organizationId,
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1d' }
            );

            return {
                token,
                user: newUser
            };

        } catch (error) {
            console.error('Firebase Register Error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Registration failed');
        }
    },

    async registerWithEmail(email: string, password: string, name: string) {
        try {
            const existingUser = await userService.findByEmail(email);
            if (existingUser) {
                throw new Error('User already exists. Please login.');
            }

            // 1. Create User in Firebase (Admin SDK)
            try {
                await admin.auth().createUser({
                    email,
                    password,
                    displayName: name,
                    emailVerified: false,
                    disabled: false
                });
            } catch (firebaseError: any) {
                if (firebaseError.code === 'auth/email-already-exists') {
                    // Start: Edge case handling
                    // If user exists in Firebase but NOT in Postgres (checked above), we might need to sync or error.
                    // For now, let's treat it as user exists.
                    throw new Error('User already exists. Please login.');
                }
                throw firebaseError;
            }

            // 2. Hash Password for Postgres
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Create User in Postgres
            const isSuperAdmin = email === config.superAdminEmail;
            const role = isSuperAdmin ? Role.SUPER_ADMIN : Role.ADMIN;

            const newUser = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    role: role,
                    // organizationId: null
                }
            });

            // 4. Generate JWT
            const token = jwt.sign(
                {
                    id: newUser.id,
                    role: newUser.role,
                    organizationId: newUser.organizationId,
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1d' }
            );

            const { password: _, ...userWithoutPassword } = newUser;

            return {
                token,
                user: userWithoutPassword
            };

        } catch (error) {
            console.error('Register With Email Error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Registration failed');
        }
    },

    async forgotPassword(email: string) {
        try {
            const user = await userService.findByEmail(email);
            if (!user) {
                throw new Error('User not found');
            }

            const link = await admin.auth().generatePasswordResetLink(email);
            return { link };
        } catch (error) {
            console.error('Forgot Password Error:', error);
            throw new Error('Could not generate reset link');
        }
    }
};
