'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Server,
  Eye,
  Scale,
  Wallet,
  UserCog,
  HelpCircle,
  Megaphone,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { HinomaryLogo } from '@/components/shared/HinomaryLogo';
import { useState } from 'react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
  children?: { key: string; href: string }[];
}

interface NavSection {
  sectionKey: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    sectionKey: 'main',
    items: [
      { key: 'dashboard', href: '/qs-admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    sectionKey: 'operations',
    items: [
      {
        key: 'transactions',
        href: '/qs-admin/transactions',
        icon: ArrowLeftRight,
        children: [
          { key: 'transactionsLock', href: '/qs-admin/transactions/lock' },
          { key: 'transactionsUnlock', href: '/qs-admin/transactions/unlock' },
          { key: 'transactionsEmergency', href: '/qs-admin/transactions/emergency' },
          { key: 'transactionsChallenge', href: '/qs-admin/transactions/challenge' },
        ],
      },
      {
        key: 'users',
        href: '/qs-admin/users/list',
        icon: Users,
      },
    ],
  },
  {
    sectionKey: 'network',
    items: [
      {
        key: 'prover',
        href: '/qs-admin/prover',
        icon: Server,
        children: [
          { key: 'proverRequests', href: '/qs-admin/prover/requests' },
          { key: 'proverList', href: '/qs-admin/prover/list' },
        ],
      },
      {
        key: 'observer',
        href: '/qs-admin/observer',
        icon: Eye,
        children: [
          { key: 'observerList', href: '/qs-admin/observer/list' },
        ],
      },
    ],
  },
  {
    sectionKey: 'finance',
    items: [
      {
        key: 'governance',
        href: '/qs-admin/governance',
        icon: Scale,
        children: [
          { key: 'governanceProposals', href: '/qs-admin/governance/proposals' },
        ],
      },
      {
        key: 'treasury',
        href: '/qs-admin/treasury',
        icon: Wallet,
        children: [
          { key: 'treasuryTransfers', href: '/qs-admin/treasury/transfers' },
          { key: 'treasuryBudget', href: '/qs-admin/treasury/budget' },
          { key: 'treasuryAudit', href: '/qs-admin/treasury/audit' },
        ],
      },
    ],
  },
  {
    sectionKey: 'organization',
    items: [
      {
        key: 'members',
        href: '/qs-admin/members',
        icon: UserCog,
        children: [
          { key: 'membersRoles', href: '/qs-admin/members/roles' },
        ],
      },
      {
        key: 'support',
        href: '/qs-admin/support',
        icon: HelpCircle,
        children: [
          { key: 'supportTickets', href: '/qs-admin/support/tickets' },
          { key: 'supportFaq', href: '/qs-admin/support/faq' },
        ],
      },
      {
        key: 'announcements',
        href: '/qs-admin/announcements',
        icon: Megaphone,
      },
    ],
  },
  {
    sectionKey: 'settings',
    items: [
      {
        key: 'analytics',
        href: '/qs-admin/analytics',
        icon: BarChart3,
        children: [
          { key: 'analyticsUsers', href: '/qs-admin/analytics/users' },
          { key: 'analyticsRevenue', href: '/qs-admin/analytics/revenue' },
          { key: 'analyticsReports', href: '/qs-admin/analytics/reports' },
        ],
      },
      {
        key: 'system',
        href: '/qs-admin/system',
        icon: Settings,
        children: [
          { key: 'systemAlerts', href: '/qs-admin/system/alerts' },
          { key: 'systemLogs', href: '/qs-admin/system/logs' },
          { key: 'systemMaintenance', href: '/qs-admin/system/maintenance' },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const t = useTranslations('qsAdmin');
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['transactions', 'treasury']);

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isActive = (href: string) => {
    const normalizedPathname = pathname.replace(/^\/(ja|en)/, '');
    return normalizedPathname === href || normalizedPathname.startsWith(href + '/');
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <HinomaryLogo size="sm" animate={false} className="mr-3" />
        <div>
          <h1 className="font-bold text-foreground">{t('sidebar.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('sidebar.subtitle')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navigation.map((section) => (
          <div key={section.sectionKey} className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t(`sidebar.sections.${section.sectionKey}`)}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.key);
                const isItemActive = isActive(item.href);

                return (
                  <li key={item.key}>
                    {hasChildren ? (
                      <>
                        <button
                          onClick={() => toggleExpand(item.key)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 min-h-11 rounded-lg text-sm transition-colors',
                            isItemActive
                              ? 'bg-hinomaru/10 text-hinomaru'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <span className="flex items-center">
                            <Icon className="h-5 w-5 mr-3" />
                            {t(`sidebar.nav.${item.key}`)}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <ul className="mt-1 ml-8 space-y-1">
                            {item.children?.map((child) => (
                              <li key={child.key}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    'block px-3 py-2 min-h-11 rounded-lg text-sm transition-colors',
                                    isActive(child.href)
                                      ? 'bg-hinomaru/10 text-hinomaru font-medium'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                  )}
                                >
                                  {t(`sidebar.nav.${child.key}`)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 min-h-11 rounded-lg text-sm transition-colors',
                          isItemActive
                            ? 'bg-hinomaru/10 text-hinomaru font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {t(`sidebar.nav.${item.key}`)}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-hinomaru to-gold flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-foreground">{t('sidebar.user.name')}</p>
            <p className="text-xs text-muted-foreground">{t('sidebar.user.role')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
