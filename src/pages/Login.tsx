import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Alert } from '../shared/Alert';
import { Logo } from '../shared/Logo';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import loginHero from '../assets/login-hero.png';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email.trim(), data.password.trim());
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side - Image & Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 to-transparent z-10" />
        <img
          src={loginHero}
          alt="Networking Event"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-end h-full p-16 text-white min-h-screen">
          <div className="mb-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 max-w-lg">
            <h2 className="text-4xl font-bold mb-4 leading-tight">Profesyonel Ağınızı<br />Geleceğe Taşıyın</h2>
            <p className="text-lg text-gray-200 opacity-90 leading-relaxed">
              E4N modeli ile işinizi büyütün, referanslarınızı yönetin ve global bir ağın parçası olun. Başarıya giden yolda yanınızdayız.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-300">
            <span>© 2024 Event 4 Network</span>
            <span className="h-1 w-1 rounded-full bg-gray-500"></span>
            <span>Tüm hakları saklıdır.</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <Logo className="h-12 w-auto text-red-600" />
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-gray-900">
              Hoş Geldiniz
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Hesabınıza giriş yaparak devam edin 👋
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-6 animate-pulse" onClose={clearError}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta Adresi
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@sirket.com"
                  className="pl-10 h-12 transition-all group-hover:border-red-300"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 transition-all group-hover:border-red-300"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Beni Hatırla
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/auth/forgot-password"
                  className="font-medium text-red-600 hover:text-red-500 hover:underline"
                >
                  Şifrenizi mi unuttunuz?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300"
              variant="primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Giriş Yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Henüz hesabınız yok mu?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/auth/register"
                className="font-medium text-red-600 hover:text-red-500 hover:underline inline-flex items-center"
              >
                Hemen Kayıt Olun
              </Link>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
