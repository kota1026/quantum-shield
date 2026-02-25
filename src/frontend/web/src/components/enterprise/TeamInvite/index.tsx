'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

interface PendingInvite {
  email: string;
  sentAgo: string;
}

export function TeamInvite() {
  const t = useTranslations('enterprise.teamInvite');
  const [emails, setEmails] = useState<string[]>(['', '']);
  const [selectedRole, setSelectedRole] = useState('member');

  const pendingInvites: PendingInvite[] = [
    { email: 'alice@company.com', sentAgo: '2時間' },
    { email: 'bob@company.com', sentAgo: '1日' },
  ];

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  return (
    <div className="flex min-h-screen bg-background-primary">
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px]"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-8 py-4 bg-background-secondary border-b border-white/5">
          <Link
            href="/enterprise/users"
            className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            aria-label={t('backToUsers')}
          >
            ←
          </Link>
          <h1 className="text-xl font-semibold">{t('pageTitle')}</h1>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-xl">
          {/* Invite Form Card */}
          <div className="bg-background-secondary border border-white/5 rounded-2xl mb-8">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold">{t('form.title')}</h2>
            </div>
            <div className="p-6">
              {/* Email Addresses */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('form.emailLabel')}
                </label>
                <div className="space-y-2">
                  {emails.map((email, index) => (
                    <input
                      key={index}
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder={t('form.emailPlaceholder')}
                      className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:border-hinomaru/50"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEmailField}
                  className="w-full mt-2 py-3 border border-dashed border-white/10 rounded-lg text-sm text-text-secondary hover:border-text-secondary transition-colors"
                >
                  {t('form.addEmail')}
                </button>
              </div>

              {/* Role Select */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('form.roleLabel')}
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-sm focus:outline-none focus:border-hinomaru/50"
                >
                  <option value="member">{t('form.roleOptions.member')}</option>
                  <option value="admin">{t('form.roleOptions.admin')}</option>
                  <option value="viewer">{t('form.roleOptions.viewer')}</option>
                </select>
              </div>

              {/* Submit Button */}
              <Button variant="primary" className="w-full">
                {t('form.submit')}
              </Button>
            </div>
          </div>

          {/* Pending Invitations */}
          <section>
            <h3 className="text-base font-semibold mb-4">
              {t('pending.title')}
            </h3>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.email}
                  className="flex justify-between items-center p-4 bg-background-secondary border border-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-gold">
                      {t('pending.sentAgo', { time: invite.sentAgo })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {t('pending.resend')}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {t('pending.cancel')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
