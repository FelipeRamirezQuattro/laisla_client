import { GoogleLogin } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const { error: showError } = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await signIn(data.email, data.password);
      navigate('/admin');
    } catch {
      showError('Credenciales inválidas. Verifica tu email y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-tint flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-body text-3xl font-bold text-espresso">La Isla Café</h1>
          <p className="text-stone font-body mt-1">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border border-rule p-8">
          <h2 className="font-body text-xl font-semibold text-espresso mb-6">Iniciar sesión</h2>

          {googleClientId && (
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  width="288"
                  onSuccess={async (credentialResponse) => {
                    if (!credentialResponse.credential) {
                      showError('Google no devolvió una credencial válida.');
                      return;
                    }
                    try {
                      await signInWithGoogle(credentialResponse.credential);
                      navigate('/admin');
                    } catch {
                      showError('No pudimos iniciar sesión con Google. Verifica que tu Gmail esté registrado en el panel.');
                    }
                  }}
                  onError={() => showError('No pudimos iniciar sesión con Google.')}
                />
              </div>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-rule" />
                <span className="text-xs font-body text-stone">o ingresa con correo</span>
                <span className="h-px flex-1 bg-rule" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="admin@laisla.co"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              loading={isSubmitting}
            >
              Ingresar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-stone font-body mt-6">
          La Isla Café · Ibagué, Colombia
        </p>
      </div>
    </div>
  );
}
