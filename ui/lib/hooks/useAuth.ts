import { useMutation, useQuery } from '@tanstack/react-query'
import { authService } from '../services/auth'
import { toast } from 'sonner'
import { ApiError } from '@/types/api'

export function useCurrentUser(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: () => authService.getCurrentUser(),
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: options?.enabled,
    })
}

export const useAuthQuery = () => {
    const { data: user, ...rest } = useCurrentUser();
    return { user, ...rest };
};

export function useLogin() {
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authService.login(email, password),
        onSuccess: () => {
            toast.success('Logged in successfully');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Invalid email or password';
            toast.error(msg);
        },
    })
}

export function useRegister() {
    return useMutation({
        mutationFn: (data: {
            firstName: string
            lastName: string
            email: string
            password: string
            confirmPassword: string
            organizationName: string
        }) => authService.register(data),
        onSuccess: () => {
            toast.success('Registration successful');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Registration failed';
            toast.error(msg);
        },
    })
}

export function useValidateInvite() {
    return useMutation({
        mutationFn: (token: string) => authService.validateInvite(token),
        onError: (error: ApiError | Error) => {
            // Toast removed to avoid double error showing (handled in UI) or keep if desired
            // const msg = error.message || 'Invalid or expired invite token';
            // toast.error(msg);
        },
    })
}

export function useAcceptInvite() {
    return useMutation({
        mutationFn: (data: { token: string; name: string; password: string }) =>
            authService.acceptInvite(data),
        onSuccess: () => {
            toast.success('Account created and joined successfully');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to join organization';
            toast.error(msg);
        },
    })
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (email: string) => authService.forgotPassword(email),
        onSuccess: () => {
            toast.success('Password reset link sent to your email');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to send reset link';
            toast.error(msg);
        },
    })
}

export function useResetPassword() {
    return useMutation({
        mutationFn: ({ token, password, confirmPassword }: { token: string; password: string; confirmPassword: string }) =>
            authService.resetPassword(token, password, confirmPassword),
        onSuccess: () => {
            toast.success('Password reset successfully');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to reset password';
            toast.error(msg);
        },
    })
}

export function useVerifyEmail() {
    return useMutation({
        mutationFn: async (token: string) => {
            console.log('useVerifyEmail: Starting API call for token:', token)
            try {
                const result = await authService.verifyEmail(token)
                console.log('useVerifyEmail: API call succeeded:', result)
                return result
            } catch (error) {
                console.error('useVerifyEmail: API call failed:', error)
                throw error
            }
        },
        onSuccess: (data) => {
            console.log('useVerifyEmail: onSuccess called with data:', data)
            toast.success(typeof data === 'string' ? data : (data as any).message || 'Email verified successfully');
        },
        onError: (error: ApiError | Error) => {
            console.error('useVerifyEmail: onError called with error:', error)
            const msg = error.message || 'Email verification failed';
            toast.error(msg);
        },
    })
}
