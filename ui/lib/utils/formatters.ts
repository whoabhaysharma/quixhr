// Role formatting utility
export const formatRole = (role: string): string => {
    const roleMap: Record<string, string> = {
        'SUPER_ADMIN': 'Super Admin',
        'HR_ADMIN': 'HR Admin',
        'MANAGER': 'Manager',
        'EMPLOYEE': 'Employee',
    }

    return roleMap[role] || role
}

// Status formatting utility
export const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
