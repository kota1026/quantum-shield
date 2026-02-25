'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Check, Server, TestTube2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Environment = 'production' | 'staging' | 'test';

interface EnvironmentConfig {
  id: Environment;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ENVIRONMENTS: EnvironmentConfig[] = [
  {
    id: 'production',
    icon: Server,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  {
    id: 'staging',
    icon: Layers,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  {
    id: 'test',
    icon: TestTube2,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
  },
];

interface EnvironmentContextType {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  environments: EnvironmentConfig[];
  currentConfig: EnvironmentConfig;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within EnvironmentProvider');
  }
  return context;
}

interface EnvironmentProviderProps {
  children: React.ReactNode;
  defaultEnvironment?: Environment;
}

export function EnvironmentProvider({
  children,
  defaultEnvironment = 'production',
}: EnvironmentProviderProps) {
  const [environment, setEnvironmentState] = useState<Environment>(defaultEnvironment);

  const setEnvironment = useCallback((env: Environment) => {
    setEnvironmentState(env);
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('enterprise-environment', env);
    }
  }, []);

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('enterprise-environment') as Environment | null;
      if (stored && ENVIRONMENTS.find((e) => e.id === stored)) {
        setEnvironmentState(stored);
      }
    }
  }, []);

  const currentConfig = ENVIRONMENTS.find((e) => e.id === environment) || ENVIRONMENTS[0];

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        environments: ENVIRONMENTS,
        currentConfig,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

interface EnvironmentSelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function EnvironmentSelector({
  className,
  variant = 'default',
}: EnvironmentSelectorProps) {
  const t = useTranslations('enterprise.environment');
  const { environment, setEnvironment, environments, currentConfig } = useEnvironment();
  const [isOpen, setIsOpen] = useState(false);

  const Icon = currentConfig.icon;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          'hover:bg-white/5',
          currentConfig.borderColor,
          currentConfig.bgColor,
          variant === 'compact' && 'px-2 py-1.5'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('ariaLabel')}
      >
        <Icon className={cn('h-4 w-4', currentConfig.color)} aria-hidden="true" />
        {variant === 'default' && (
          <span className={cn('text-sm font-medium', currentConfig.color)}>
            {t(`environments.${environment}`)}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            currentConfig.color,
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className="absolute top-full right-0 mt-2 w-56 bg-background-secondary border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
            role="listbox"
            aria-label={t('ariaLabel')}
          >
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-foreground-tertiary uppercase tracking-wider">
                {t('selectEnvironment')}
              </div>
              {environments.map((env) => {
                const EnvIcon = env.icon;
                const isSelected = environment === env.id;

                return (
                  <button
                    key={env.id}
                    onClick={() => {
                      setEnvironment(env.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      'hover:bg-white/5',
                      isSelected && env.bgColor
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <EnvIcon className={cn('h-4 w-4', env.color)} aria-hidden="true" />
                    <div className="flex-1 text-left">
                      <div className={cn('text-sm font-medium', isSelected && env.color)}>
                        {t(`environments.${env.id}`)}
                      </div>
                      <div className="text-xs text-foreground-tertiary">
                        {t(`descriptions.${env.id}`)}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className={cn('h-4 w-4', env.color)} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Warning for non-production */}
            {environment !== 'production' && (
              <div className="px-4 py-3 bg-warning/10 border-t border-warning/20">
                <p className="text-xs text-warning">
                  {t('nonProductionWarning')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Environment badge for display in headers/status bars
interface EnvironmentBadgeProps {
  className?: string;
}

export function EnvironmentBadge({ className }: EnvironmentBadgeProps) {
  const t = useTranslations('enterprise.environment');
  const { environment, currentConfig } = useEnvironment();

  // Don't show badge for production
  if (environment === 'production') {
    return null;
  }

  const Icon = currentConfig.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        currentConfig.bgColor,
        currentConfig.borderColor,
        currentConfig.color,
        'border',
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t(`environments.${environment}`)}
    </div>
  );
}

export default EnvironmentSelector;
