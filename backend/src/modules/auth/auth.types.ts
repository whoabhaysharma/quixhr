import { Role } from '@prisma/client';

export interface TokenPayload {
    userId: string;
    role: Role;
    companyId?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}