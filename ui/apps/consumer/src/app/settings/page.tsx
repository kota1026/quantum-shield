'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Wallet,
  Save,
  ArrowLeft,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Label,
} from '@quantum-shield/ui';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      unlockReady: true,
      securityAlerts: true,
    },
    display: {
      darkMode: false,
      compactView: false,
    },
    privacy: {
      hideBalances: false,
      anonymousAnalytics: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save settings to backend/localStorage
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const updateSetting = (
    category: keyof typeof settings,
    key: string,
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-qs-primary-500" />
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif">Email Notifications</Label>
              <Switch
                id="email-notif"
                checked={settings.notifications.email}
                onCheckedChange={(v) => updateSetting('notifications', 'email', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notif">Push Notifications</Label>
              <Switch
                id="push-notif"
                checked={settings.notifications.push}
                onCheckedChange={(v) => updateSetting('notifications', 'push', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="unlock-notif">Unlock Ready Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when time lock completes
                </p>
              </div>
              <Switch
                id="unlock-notif"
                checked={settings.notifications.unlockReady}
                onCheckedChange={(v) =>
                  updateSetting('notifications', 'unlockReady', v)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="security-notif">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications
                </p>
              </div>
              <Switch
                id="security-notif"
                checked={settings.notifications.securityAlerts}
                onCheckedChange={(v) =>
                  updateSetting('notifications', 'securityAlerts', v)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-qs-secondary-500" />
              <div>
                <CardTitle className="text-lg">Display</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.display.darkMode}
                onCheckedChange={(v) => updateSetting('display', 'darkMode', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-view">Compact View</Label>
              <Switch
                id="compact-view"
                checked={settings.display.compactView}
                onCheckedChange={(v) => updateSetting('display', 'compactView', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-qs-success-500" />
              <div>
                <CardTitle className="text-lg">Privacy</CardTitle>
                <CardDescription>Control your data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hide-balances">Hide Balances</Label>
                <p className="text-sm text-muted-foreground">
                  Show *** instead of actual amounts
                </p>
              </div>
              <Switch
                id="hide-balances"
                checked={settings.privacy.hideBalances}
                onCheckedChange={(v) =>
                  updateSetting('privacy', 'hideBalances', v)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics">Anonymous Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve Quantum Shield
                </p>
              </div>
              <Switch
                id="analytics"
                checked={settings.privacy.anonymousAnalytics}
                onCheckedChange={(v) =>
                  updateSetting('privacy', 'anonymousAnalytics', v)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Connected Wallet */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-qs-warning-500" />
              <div>
                <CardTitle className="text-lg">Connected Wallet</CardTitle>
                <CardDescription>Manage your wallet connection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">0x1234...5678</p>
                <p className="text-sm text-muted-foreground">
                  Connected via MetaMask
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/disconnect">Disconnect</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
