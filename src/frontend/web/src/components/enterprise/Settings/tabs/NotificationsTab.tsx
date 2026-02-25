'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Mail, MessageSquare, Smartphone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationSetting {
  id: string;
  enabled: boolean;
  channels: {
    email: boolean;
    slack: boolean;
    push: boolean;
  };
}

export function NotificationsTab() {
  const t = useTranslations('enterprise.settings.notifications');

  const [settings, setSettings] = useState<Record<string, NotificationSetting>>({
    securityAlerts: { id: 'securityAlerts', enabled: true, channels: { email: true, slack: true, push: true } },
    systemStatus: { id: 'systemStatus', enabled: true, channels: { email: true, slack: true, push: false } },
    proverAlerts: { id: 'proverAlerts', enabled: true, channels: { email: true, slack: true, push: true } },
    maintenanceWindows: { id: 'maintenanceWindows', enabled: true, channels: { email: true, slack: false, push: false } },
    usageReports: { id: 'usageReports', enabled: true, channels: { email: true, slack: false, push: false } },
    billingAlerts: { id: 'billingAlerts', enabled: false, channels: { email: true, slack: false, push: false } },
  });

  const [slackWebhook, setSlackWebhook] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('admin@acme.co.jp, ops@acme.co.jp');

  const toggleSetting = (id: string, field: 'enabled' | keyof NotificationSetting['channels']) => {
    setSettings((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...(field === 'enabled'
          ? { enabled: !prev[id].enabled }
          : { channels: { ...prev[id].channels, [field]: !prev[id].channels[field as keyof NotificationSetting['channels']] } }),
      },
    }));
  };

  const notificationTypes = [
    { id: 'securityAlerts', icon: AlertTriangle, severity: 'critical' },
    { id: 'systemStatus', icon: Bell, severity: 'warning' },
    { id: 'proverAlerts', icon: Bell, severity: 'warning' },
    { id: 'maintenanceWindows', icon: Bell, severity: 'info' },
    { id: 'usageReports', icon: Bell, severity: 'info' },
    { id: 'billingAlerts', icon: Bell, severity: 'info' },
  ];

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Bell className="w-5 h-5 text-hinomaru" />
            {t('channels.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('channels.description')}</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Email Configuration */}
          <div className="flex items-start gap-4 p-4 bg-background-primary rounded-xl border border-white/5">
            <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-info" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary">{t('channels.email.title')}</p>
              <p className="text-sm text-text-tertiary mb-3">{t('channels.email.description')}</p>
              <div>
                <label htmlFor="emailRecipients" className="block text-xs text-text-tertiary mb-1">
                  {t('channels.email.recipients')}
                </label>
                <input
                  type="text"
                  id="emailRecipients"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm"
                />
              </div>
            </div>
            <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full">{t('channels.connected')}</span>
          </div>

          {/* Slack Configuration */}
          <div className="flex items-start gap-4 p-4 bg-background-primary rounded-xl border border-white/5">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary">{t('channels.slack.title')}</p>
              <p className="text-sm text-text-tertiary mb-3">{t('channels.slack.description')}</p>
              <div>
                <label htmlFor="slackWebhook" className="block text-xs text-text-tertiary mb-1">
                  {t('channels.slack.webhook')}
                </label>
                <input
                  type="url"
                  id="slackWebhook"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm font-mono"
                />
              </div>
            </div>
            {slackWebhook ? (
              <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full">{t('channels.connected')}</span>
            ) : (
              <Button variant="secondary" size="sm">{t('channels.connect')}</Button>
            )}
          </div>

          {/* Push Notifications */}
          <div className="flex items-start gap-4 p-4 bg-background-primary rounded-xl border border-white/5">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary">{t('channels.push.title')}</p>
              <p className="text-sm text-text-tertiary">{t('channels.push.description')}</p>
            </div>
            <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full">{t('channels.connected')}</span>
          </div>
        </div>
      </section>

      {/* Notification Types */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary">{t('types.title')}</h2>
          <p className="text-sm text-text-tertiary mt-1">{t('types.description')}</p>
        </div>
        <div className="divide-y divide-white/5">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-6 py-3 bg-background-elevated text-xs text-text-tertiary">
            <span>{t('types.notification')}</span>
            <span className="text-center">{t('types.email')}</span>
            <span className="text-center">{t('types.slack')}</span>
            <span className="text-center">{t('types.push')}</span>
          </div>

          {/* Rows */}
          {notificationTypes.map(({ id, icon: Icon, severity }) => (
            <div key={id} className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-6 py-4 items-center">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  severity === 'critical' ? 'bg-red-500/10' :
                  severity === 'warning' ? 'bg-warning/10' : 'bg-info/10'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    severity === 'critical' ? 'text-red-400' :
                    severity === 'warning' ? 'text-warning' : 'text-info'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{t(`types.items.${id}.title`)}</p>
                  <p className="text-xs text-text-tertiary">{t(`types.items.${id}.description`)}</p>
                </div>
              </div>
              {(['email', 'slack', 'push'] as const).map((channel) => (
                <div key={channel} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => toggleSetting(id, channel)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      settings[id].channels[channel] ? 'bg-hinomaru' : 'bg-white/10'
                    }`}
                    aria-label={`Toggle ${channel} for ${id}`}
                    role="switch"
                    aria-checked={settings[id].channels[channel]}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings[id].channels[channel] ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Alert Thresholds */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary">{t('thresholds.title')}</h2>
          <p className="text-sm text-text-tertiary mt-1">{t('thresholds.description')}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="uptimeThreshold" className="block text-sm font-medium text-text-primary mb-2">
                {t('thresholds.uptime.label')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="uptimeThreshold"
                  defaultValue={99.5}
                  step={0.1}
                  min={0}
                  max={100}
                  className="w-24 px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                />
                <span className="text-text-tertiary">%</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">{t('thresholds.uptime.hint')}</p>
            </div>
            <div>
              <label htmlFor="latencyThreshold" className="block text-sm font-medium text-text-primary mb-2">
                {t('thresholds.latency.label')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="latencyThreshold"
                  defaultValue={500}
                  step={50}
                  min={0}
                  className="w-24 px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                />
                <span className="text-text-tertiary">ms</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">{t('thresholds.latency.hint')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
