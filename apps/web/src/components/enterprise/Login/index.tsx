'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function EnterpriseLogin() {
  const t = useTranslations('enterprise.login');
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate login - in production, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Demo: accept any credentials
      router.push('/enterprise/dashboard');
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = (provider: 'google' | 'microsoft' | 'saml') => {
    // In production, redirect to SSO provider
    console.log(`SSO login with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-background via-background-secondary to-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          {/* Animated grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(188, 0, 45, 0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(188, 0, 45, 0.3) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Hinomaru glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(188, 0, 45, 0.15) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border-2 border-gold/30 rounded-full animate-spin"
                style={{ animationDuration: '20s' }}
              />
              <div
                className="w-12 h-12 bg-hinomaru rounded-full shadow-[0_0_30px_rgba(188,0,45,0.5)]"
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-2">Quantum Shield</h1>
          <span className="text-gold text-sm tracking-[0.3em] font-semibold mb-8">
            ENTERPRISE
          </span>

          <p className="text-foreground-secondary text-center max-w-md text-lg">
            {t('branding.tagline')}<br />
            {t('branding.taglineHighlight')}
          </p>

          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-6 max-w-md">
            {(['quantumResistance', 'uptime', 'nodes', 'tvl'] as const).map((key) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gold mb-1">{t(`branding.features.${key}.value`)}</div>
                <div className="text-xs text-foreground-tertiary">{t(`branding.features.${key}.label`)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto relative flex items-center justify-center mb-4">
              <div
                className="absolute inset-0 border border-gold/30 rounded-full animate-spin"
                style={{ animationDuration: '20s' }}
              />
              <div className="w-8 h-8 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Quantum Shield</h1>
            <span className="text-gold text-xs tracking-widest">ENTERPRISE</span>
          </div>

          {/* Form header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('pageTitle')}</h2>
            <p className="text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t('email.label')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-tertiary" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('email.placeholder')}
                  className="w-full pl-10 pr-4 py-3 bg-background-secondary border border-white/10 rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-hinomaru/50 focus:border-hinomaru/50 transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t('password.label')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-tertiary" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('password.placeholder')}
                  className="w-full pl-10 pr-12 py-3 bg-background-secondary border border-white/10 rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-hinomaru/50 focus:border-hinomaru/50 transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-tertiary hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-background-secondary text-hinomaru focus:ring-hinomaru/50"
                />
                <span className="text-sm text-foreground-secondary">{t('rememberMe')}</span>
              </label>
              <a
                href="#"
                className="text-sm text-hinomaru hover:text-hinomaru-400 transition-colors"
              >
                {t('forgotPassword')}
              </a>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full py-3 bg-hinomaru hover:bg-hinomaru-600 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-foreground-tertiary">{t('divider')}</span>
            </div>
          </div>

          {/* SSO buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSSOLogin('google')}
              className={cn(
                'w-full flex items-center justify-center gap-3 px-4 py-3',
                'bg-background-secondary border border-white/10 rounded-lg',
                'text-foreground hover:bg-background-tertiary transition-colors'
              )}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('sso.google')}
            </button>

            <button
              onClick={() => handleSSOLogin('microsoft')}
              className={cn(
                'w-full flex items-center justify-center gap-3 px-4 py-3',
                'bg-background-secondary border border-white/10 rounded-lg',
                'text-foreground hover:bg-background-tertiary transition-colors'
              )}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF" />
                <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900" />
                <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022" />
                <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00" />
              </svg>
              {t('sso.microsoft')}
            </button>

            <button
              onClick={() => handleSSOLogin('saml')}
              className={cn(
                'w-full flex items-center justify-center gap-3 px-4 py-3',
                'bg-background-secondary border border-white/10 rounded-lg',
                'text-foreground hover:bg-background-tertiary transition-colors'
              )}
            >
              <Lock className="w-5 h-5" aria-hidden="true" />
              {t('sso.saml')}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-foreground-tertiary">
            {t('footer.needHelp')}{' '}
            <a href="#" className="text-hinomaru hover:text-hinomaru-400 transition-colors">
              {t('footer.contactSupport')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnterpriseLogin;
