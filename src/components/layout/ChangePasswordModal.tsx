import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usersApi } from '../../api/users';
import { useToast } from '../../hooks/useToast';

function hasConsecutiveDigits(password: string): boolean {
  const digitRuns = password.match(/\d+/g) ?? [];
  return digitRuns.some((run) => {
    if (run.length < 3) return false;
    let ascendingStreak = 1;
    let descendingStreak = 1;
    for (let i = 1; i < run.length; i += 1) {
      const diff = run.charCodeAt(i) - run.charCodeAt(i - 1);
      ascendingStreak = diff === 1 ? ascendingStreak + 1 : 1;
      descendingStreak = diff === -1 ? descendingStreak + 1 : 1;
      if (ascendingStreak >= 3 || descendingStreak >= 3) return true;
    }
    return false;
  });
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .refine((value) => !hasConsecutiveDigits(value), 'No se permiten 3 o más dígitos consecutivos (ej: 123, 321)'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handleClose = () => {
    reset({ currentPassword: '', password: '', confirmPassword: '' });
    onClose();
  };

  const onSubmit = async (data: PasswordForm) => {
    try {
      await usersApi.updateMyPassword(data.currentPassword, data.password);
      toast.success('Contraseña actualizada');
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar contraseña');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar contraseña">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Contraseña actual"
          type="password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Input
          label="Nueva contraseña"
          type="password"
          hint="Mínimo 8 caracteres, sin 3+ dígitos consecutivos (ej: 123)"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar nueva contraseña"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={handleClose}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>Actualizar</Button>
        </div>
      </form>
    </Modal>
  );
}
