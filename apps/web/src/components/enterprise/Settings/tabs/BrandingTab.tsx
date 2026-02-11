'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, Palette, Type, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRESET_COLORS = [
  '#C41E3A', // Hinomaru Red
  '#C5A572', // Gold
  '#2563EB', // Blue
  '#16A34A', // Green
  '#7C3AED', // Purple
  '#EA580C', // Orange
];

export function BrandingTab() {
  const t = useTranslations('enterprise.settings.branding');

  const [primaryColor, setPrimaryColor] = useState('#C41E3A');
  const [accentColor, setAccentColor] = useState('#C5A572');
  const [darkMode, setDarkMode] = useState<'system' | 'light' | 'dark'>('dark');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Image className="w-5 h-5 text-hinomaru" />
            {t('logo.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('logo.description')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Main Logo */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-3">{t('logo.mainLogo')}</p>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-background-primary border border-dashed border-white/20 rounded-xl flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full" />
                  ) : (
                    <span className="text-3xl font-bold text-text-tertiary">AC</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('logo.upload')}
                  </Button>
                  <p className="text-xs text-text-tertiary">{t('logo.hint')}</p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-3">{t('logo.favicon')}</p>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-background-primary border border-dashed border-white/20 rounded-lg flex items-center justify-center">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="Favicon" className="max-w-full max-h-full" />
                  ) : (
                    <span className="text-lg font-bold text-text-tertiary">A</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('logo.uploadFavicon')}
                  </Button>
                  <p className="text-xs text-text-tertiary">{t('logo.faviconHint')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Color Theme */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Palette className="w-5 h-5 text-hinomaru" />
            {t('colors.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('colors.description')}</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Primary Color */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-3">{t('colors.primary')}</p>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setPrimaryColor(color)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      primaryColor === color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-background-secondary'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-24 px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-3">{t('colors.accent')}</p>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      accentColor === color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-background-secondary'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select accent color ${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-24 px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-3">{t('colors.preview')}</p>
            <div className="p-6 bg-background-primary rounded-xl border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  AC
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Acme Corp</p>
                  <p className="text-sm" style={{ color: accentColor }}>Enterprise Dashboard</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  {t('colors.previewButton')}
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  {t('colors.previewSecondary')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Mode */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary">{t('theme.title')}</h2>
          <p className="text-sm text-text-tertiary mt-1">{t('theme.description')}</p>
        </div>
        <div className="p-6">
          <div className="flex gap-4">
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDarkMode(mode)}
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  darkMode === mode
                    ? 'border-hinomaru bg-hinomaru/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-full aspect-[3/2] rounded-lg mb-2 ${
                  mode === 'dark' ? 'bg-gray-900' : mode === 'light' ? 'bg-gray-100' : 'bg-gradient-to-r from-gray-900 to-gray-100'
                }`} />
                <p className={`text-sm font-medium ${darkMode === mode ? 'text-hinomaru' : 'text-text-primary'}`}>
                  {t(`theme.modes.${mode}`)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
