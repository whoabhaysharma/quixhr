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
            verificationCode: string
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
            toast.error(error.response?.data?.message || 'Invalid or expired invite token');
        },
    })
}

export function useAcceptInvite() {
    return useMutation({
        mutationFn: (data: { token: string; name: string; password: string }) =>
            authService.acceptInvite(data),
        onSuccess: () => {
            toast.success('Invite accepted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to accept invite');
        },
    })
}
