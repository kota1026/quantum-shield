'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sliders,
  Shield,
  DollarSign,
  Clock,
  Bell,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Parameter {
  id: string;
  key: string;
  value: string | number;
  unit?: string;
  type: 'number' | 'text' | 'toggle';
  category: 'security' | 'limits' | 'notifications';
}

const DEFAULT_PARAMS: Parameter[] = [
  { id: '1', key: 'maxTransactionAmount', value: 100000, unit: 'USD', type: 'number', category: 'limits' },
  { id: '2', key: 'dailyLimit', value: 1000000, unit: 'USD', type: 'number', category: 'limits' },
  { id: '3', key: 'lockPeriod', value: 24, unit: 'hours', type: 'number', category: 'security' },
  { id: '4', key: 'challengeWindow', value: 6, unit: 'hours', type: 'number', category: 'security' },
];

export function EnterpriseParameters() {
  const t = useTranslations('enterprise.parameters');
  const tCommon = useTranslations('enterprise');
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateParam = (id: string, value: string | number) => {
    setParams(params.map((p) => p.id === id ? { ...p, value } : p));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setHasChanges(false);
  };

  const categoryIcons = {
    security: Shield,
    limits: DollarSign,
    notifications: Bell,
  };

  const categories = ['security', 'limits', 'notifications'] as const;

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseSidebar />

      <div className="flex-1 ml-[260px]">
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={tCommon('dashboard.demoUser.name')}
          userInitial={tCommon('dashboard.demoUser.initial')}
        />

        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          <div className="flex items-center justify-between mb-6">
            <p className="text-foreground-secondary">{t('subtitle')}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {t('reset')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
                className="gap-2"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t('saved')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t('save')}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {categories.map((category) => {
              const categoryParams = params.filter((p) => p.category === category);
              if (categoryParams.length === 0) return null;

              const Icon = categoryIcons[category];

              return (
                <Card key={category} className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-background-tertiary rounded-lg">
                      <Icon className="h-5 w-5 text-foreground-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold">{t(`sections.${category}`)}</h3>
                  </div>

                  <div className="space-y-6">
                    {categoryParams.map((param) => (
                      <div key={param.id} className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1">
                          <label className="block font-medium mb-1">
                            {t(`params.${param.key}.label`)}
                          </label>
                          <p className="text-sm text-foreground-secondary">
                            {t(`params.${param.key}.description`)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {param.type === 'number' && (
                            <>
                              <input
                                type="number"
                                value={param.value}
                                onChange={(e) => updateParam(param.id, parseInt(e.target.value) || 0)}
                                className="w-32 px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-right font-mono focus:outline-none focus:ring-2 focus:ring-hinomaru/50"
                              />
                              {param.unit && (
                                <span className="text-sm text-foreground-secondary w-16">
                                  {param.unit}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

export default EnterpriseParameters;
