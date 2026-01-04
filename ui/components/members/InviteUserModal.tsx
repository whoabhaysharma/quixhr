import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Role } from '@/lib/constants/roles';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invitationService } from '@/lib/services/invitation';
import { useSendInvite } from '@/lib/hooks/useMembers';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.nativeEnum(Role).refine(val => [Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE].includes(val), {
        message: "Invalid role selected"
    }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
    // const [isLoading, setIsLoading] = useState(false); // Managed by mutation
    const { mutateAsync: sendInvite, isPending: isLoading } = useSendInvite();

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            role: Role.EMPLOYEE,
        },
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: InviteFormData) => {
        try {
            await sendInvite(data);
            // Toast handled by hook
            reset();
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            // Error toast handled by hook
            console.error("Failed to send invite", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite New Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation email to a new user. They will receive a link to set up their account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            placeholder="colleague@company.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between font-normal">
                                    {selectedRole === Role.EMPLOYEE ? 'Employee' : selectedRole === Role.MANAGER ? 'Manager' : 'HR Admin'}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                                <DropdownMenuItem onClick={() => setValue('role', Role.EMPLOYEE)}>
                                    Employee
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setValue('role', Role.MANAGER)}>
                                    Manager
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setValue('role', Role.HR_ADMIN)}>
                                    HR Admin
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {errors.role && (
                            <p className="text-xs text-red-500">{errors.role.message}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
