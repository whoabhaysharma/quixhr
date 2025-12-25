import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/auth'
import { toast } from 'sonner'

export function useLogin() {
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authService.login(email, password),
        onSuccess: () => {
            toast.success('Logged in successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Invalid email or password');
        },
    })
}

export function useSendVerificationCode() {
    return useMutation({
        mutationFn: (email: string) => authService.sendVerificationCode(email),
        onSuccess: () => {
            toast.success('Verification code sent to your email');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send verification code');
        },
    })
}

export function useRegister() {
    return useMutation({
        mutationFn: (data: {
            name: string
            email: string
            password: string
            otp: string
            organizationName: string
        }) => authService.register(data),
        onSuccess: () => {
            toast.success('Registration successful');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Registration failed');
        },
    })
}

export function useValidateInvite() {
    return useMutation({
        mutationFn: (token: string) => authService.validateInvite(token),
        onError: (error: any) => {
            // Toast removed to avoid double error showing (handled in UI) or keep if desired
            // toast.error(error.response?.data?.message || 'Invalid or expired invite token');
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
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to join organization');
        },
    })
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (email: string) => authService.forgotPassword(email),
        onSuccess: () => {
            toast.success('Password reset link sent to your email');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send reset link');
        },
    })
}

export function useResetPassword() {
    return useMutation({
        mutationFn: ({ token, password }: { token: string; password: string }) =>
            authService.resetPassword(token, password),
        onSuccess: () => {
            toast.success('Password reset successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        },
    })
}
