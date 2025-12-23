import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/auth'

export function useLogin() {
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authService.login(email, password),
    })
}

export function useSendVerificationCode() {
    return useMutation({
        mutationFn: (email: string) => authService.sendVerificationCode(email),
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
    })
}

export function useValidateInvite() {
    return useMutation({
        mutationFn: (token: string) => authService.validateInvite(token),
    })
}

export function useAcceptInvite() {
    return useMutation({
        mutationFn: (data: { token: string; name: string; password: string }) =>
            authService.acceptInvite(data),
    })
}
