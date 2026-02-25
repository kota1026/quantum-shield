'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type AnnouncementType = 'important' | 'update' | 'event';
type TabType = 'announcements' | 'faq' | 'supportTickets' | 'analytics';

interface Announcement {
  id: string;
  title: string;
  type: AnnouncementType;
  excerpt: string;
  date: string;
  views: number;
  comments: number;
}

interface FaqItem {
  id: string;
  question: string;
  views: number;
}

interface QuickLink {
  id: string;
  labelKey: string;
  href: string;
}

// Stat mini card component
interface StatMiniProps {
  label: string;
  value: string;
  isSuccess?: boolean;
}

function StatMini({ label, value, isSuccess }: StatMiniProps) {
  return (
    <div className="rounded-xl border border-surface-tertiary bg-background-secondary p-4">
      <div className="mb-1 text-xs text-foreground-tertiary">{label}</div>
      <div className={cn('font-mono text-2xl font-bold', isSuccess && 'text-success')}>{value}</div>
    </div>
  );
}

// Tab component
interface TabItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabItem({ label, isActive, onClick }: TabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'rounded-lg px-5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive
          ? 'bg-background-tertiary text-foreground'
          : 'text-foreground-secondary hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

// Announcement type badge component
interface AnnouncementTypeBadgeProps {
  type: AnnouncementType;
}

function AnnouncementTypeBadge({ type }: AnnouncementTypeBadgeProps) {
  const t = useTranslations('admin.community.announcements.type');

  const typeConfig = {
    important: {
      label: t('important'),
      className: 'bg-hinomaru/10 text-hinomaru',
    },
    update: {
      label: t('update'),
      className: 'bg-[#4a90d9]/10 text-[#4a90d9]',
    },
    event: {
      label: t('event'),
      className: 'bg-gold/10 text-gold',
    },
  };

  const config = typeConfig[type];

  return (
    <span className={cn('rounded px-2 py-0.5 text-[10px] font-medium', config.className)}>
      {config.label}
    </span>
  );
}

// Announcement card component
interface AnnouncementCardProps {
  announcement: Announcement;
  onClick: () => void;
}

function AnnouncementCard({ announcement, onClick }: AnnouncementCardProps) {
  const t = useTranslations('admin.community.announcements.meta');

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="mb-4 cursor-pointer rounded-lg bg-background-secondary p-5 transition-colors last:mb-0 hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      tabIndex={0}
      role="button"
      aria-label={announcement.title}
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-base font-semibold">{announcement.title}</h3>
        <AnnouncementTypeBadge type={announcement.type} />
      </div>
      <p className="mb-3 text-[13px] leading-relaxed text-foreground-secondary">
        {announcement.excerpt}
      </p>
      <div className="flex gap-4 text-xs text-foreground-tertiary">
        <span>📅 {announcement.date}</span>
        <span>👁️ {announcement.views.toLocaleString()} {t('views')}</span>
        <span>💬 {announcement.comments} {t('comments')}</span>
      </div>
    </div>
  );
}

// FAQ item component
interface FaqItemComponentProps {
  faq: FaqItem;
  onClick: () => void;
}

function FaqItemComponent({ faq, onClick }: FaqItemComponentProps) {
  const t = useTranslations('admin.community.faq');

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer border-b border-surface-tertiary px-5 py-4 transition-colors last:border-b-0 hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      tabIndex={0}
      role="button"
      aria-label={faq.question}
    >
      <div className="mb-1 text-sm font-medium">{faq.question}</div>
      <div className="text-xs text-foreground-tertiary">
        {faq.views.toLocaleString()} {t('views')}
      </div>
    </div>
  );
}

// Quick link item component
interface QuickLinkItemProps {
  link: QuickLink;
}

function QuickLinkItem({ link }: QuickLinkItemProps) {
  const t = useTranslations('admin.community.quickLinks');

  return (
    <li className="border-b border-surface-tertiary last:border-b-0">
      <a
        href={link.href}
        className="flex items-center justify-between py-3 text-sm text-foreground-secondary transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <span>{t(link.labelKey)}</span>
        <span aria-hidden="true">→</span>
      </a>
    </li>
  );
}

export function AdminCommunity() {
  const t = useTranslations('admin.community');
  const [activeTab, setActiveTab] = useState<TabType>('announcements');

  // Mock data - in production would come from API
  const announcements: Announcement[] = [
    {
      id: '1',
      title: 'Quantum Shield v2.0 リリースのお知らせ',
      type: 'important',
      excerpt:
        'NIST認定Dilithiumアルゴリズム対応の新バージョンをリリースしました。既存ユーザーは自動的にアップグレードされます...',
      date: '2026-01-10',
      views: 8234,
      comments: 156,
    },
    {
      id: '2',
      title: 'メンテナンス完了のお知らせ',
      type: 'update',
      excerpt:
        '1月8日のメンテナンスは予定通り完了しました。L3ノードのパフォーマンスが20%向上しています...',
      date: '2026-01-08',
      views: 4521,
      comments: 42,
    },
    {
      id: '3',
      title: 'Community AMA - Q1 2026',
      type: 'event',
      excerpt:
        '1月15日 19:00 JSTよりコミュニティAMAを開催します。CEOとCTOが直接質問にお答えします...',
      date: '2026-01-05',
      views: 2156,
      comments: 89,
    },
  ];

  const faqs: FaqItem[] = [
    { id: '1', question: '早期解除ペナルティとは？', views: 12450 },
    { id: '2', question: '量子耐性とは何ですか？', views: 9823 },
    { id: '3', question: 'ロック期間の変更は可能？', views: 7234 },
    { id: '4', question: 'Proverの役割について', views: 5678 },
  ];

  const quickLinks: QuickLink[] = [
    { id: '1', labelKey: 'discord', href: '#' },
    { id: '2', labelKey: 'twitter', href: '#' },
    { id: '3', labelKey: 'documentation', href: '#' },
    { id: '4', labelKey: 'statusPage', href: '#' },
  ];

  const handleAnnouncementClick = (announcementId: string) => {
    // In production, would open announcement editor
    console.log('Announcement clicked:', announcementId);
  };

  const handleFaqClick = (faqId: string) => {
    // In production, would open FAQ editor
    console.log('FAQ clicked:', faqId);
  };

  const handleNewAnnouncement = () => {
    // In production, would open new announcement modal
    console.log('New announcement clicked');
  };

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleNewAnnouncement}
            className="rounded-lg bg-hinomaru px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-hinomaru/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            + {t('newAnnouncementButton')}
          </button>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatMini label={t('stats.totalUsers.label')} value="12,847" />
          <StatMini label={t('stats.activeThisWeek.label')} value="3,421" isSuccess />
          <StatMini label={t('stats.supportTickets.label')} value="23" />
          <StatMini label={t('stats.avgResponseTime.label')} value="2.4h" isSuccess />
        </div>

        {/* Tabs */}
        <div
          className="mb-6 flex gap-1 rounded-lg bg-background-secondary p-1"
          role="tablist"
          aria-label={t('title')}
          style={{ width: 'fit-content' }}
        >
          <TabItem
            label={t('tabs.announcements')}
            isActive={activeTab === 'announcements'}
            onClick={() => setActiveTab('announcements')}
          />
          <TabItem
            label={t('tabs.faq')}
            isActive={activeTab === 'faq'}
            onClick={() => setActiveTab('faq')}
          />
          <TabItem
            label={t('tabs.supportTickets')}
            isActive={activeTab === 'supportTickets'}
            onClick={() => setActiveTab('supportTickets')}
          />
          <TabItem
            label={t('tabs.analytics')}
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Announcements (2/3 width) */}
          <div className="col-span-2">
            <Card padding="none">
              <CardHeader className="border-b border-surface-tertiary px-5 py-4">
                <CardTitle className="text-base">{t('announcements.title')}</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onClick={() => handleAnnouncementClick(announcement.id)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Top FAQs */}
            <Card padding="none">
              <CardHeader className="border-b border-surface-tertiary px-5 py-4">
                <CardTitle className="text-base">{t('faq.title')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {faqs.map((faq) => (
                  <FaqItemComponent
                    key={faq.id}
                    faq={faq}
                    onClick={() => handleFaqClick(faq.id)}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card padding="none">
              <CardHeader className="border-b border-surface-tertiary px-5 py-4">
                <CardTitle className="text-base">{t('quickLinks.title')}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-0">
                <ul className="list-none">
                  {quickLinks.map((link) => (
                    <QuickLinkItem key={link.id} link={link} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
