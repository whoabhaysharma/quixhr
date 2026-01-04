export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ORG_ADMIN = 'ORG_ADMIN',
    HR_ADMIN = 'HR_ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
}

export const ROLE_LABELS: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'Super Admin',
    [Role.ORG_ADMIN]: 'Organization Admin',
    [Role.HR_ADMIN]: 'HR Admin',
    [Role.MANAGER]: 'Manager',
    [Role.EMPLOYEE]: 'Employee'
};

export const ROLE_BADGE_STYLES: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-none px-2.5 py-0.5 text-[10px] uppercase tracking-wide shadow-none',
    [Role.ORG_ADMIN]: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-2.5 py-0.5 text-[10px] uppercase tracking-wide shadow-none',
    [Role.HR_ADMIN]: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-2.5 py-0.5 text-[10px] uppercase tracking-wide shadow-none',
    [Role.MANAGER]: 'bg-teal-100 text-teal-700 hover:bg-teal-200 border-none px-2.5 py-0.5 text-[10px] uppercase tracking-wide shadow-none',
    [Role.EMPLOYEE]: 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-2.5 py-0.5 text-[10px] uppercase tracking-wide shadow-none'
};
