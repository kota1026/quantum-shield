'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Server,
  Eye,
  Activity,
  Users,
  Settings,
  HelpCircle,
  History,
  AlertTriangle,
  Sliders,
  LifeBuoy,
  Calendar,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: 'overview',
    items: [
      { key: 'dashboard', href: '/enterprise/dashboard', icon: LayoutDashboard },
      { key: 'monitoring', href: '/enterprise/monitoring', icon: Activity },
    ],
  },
  {
    labelKey: 'infrastructure',
    items: [
      { key: 'provers', href: '/enterprise/provers', icon: Server },
      { key: 'proverCalendar', href: '/enterprise/provers/calendar', icon: Calendar },
      { key: 'observers', href: '/enterprise/observers', icon: Eye },
    ],
  },
  {
    labelKey: 'management',
    items: [
      { key: 'users', href: '/enterprise/users', icon: Users },
      { key: 'parameters', href: '/enterprise/parameters', icon: Sliders },
      { key: 'emergency', href: '/enterprise/emergency', icon: AlertTriangle },
    ],
  },
  {
    labelKey: 'reports',
    items: [
      { key: 'auditLog', href: '/enterprise/audit-log', icon: History },
    ],
  },
  {
    labelKey: 'system',
    items: [
      { key: 'settings', href: '/enterprise/settings', icon: Settings },
      { key: 'support', href: '/enterprise/support', icon: LifeBuoy },
      { key: 'help', href: '/enterprise/help', icon: HelpCircle },
    ],
  },
];

interface EnterpriseSidebarProps {
  orgName?: string;
  orgPlan?: string;
  className?: string;
}

export function EnterpriseSidebar({
  orgName = 'Acme Corp',
  orgPlan = 'Enterprise Plan',
  className,
}: EnterpriseSidebarProps) {
  const t = useTranslations('enterprise.sidebar');
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Remove locale prefix for comparison
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(href + '/');
  };

  return (
    <aside
      className={cn(
        'w-[260px] bg-[#0c0c0f] border-r border-white/5',
        'flex flex-col fixed top-0 left-0 bottom-0 z-50',
        className
      )}
      role="navigation"
      aria-label={t('ariaLabel')}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          {/* Logo with Hinomaru */}
          <div className="w-10 h-10 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border border-gold rounded-full animate-spin"
              style={{ animationDuration: '20s' }}
              aria-hidden="true"
            />
            <div
              className="w-5 h-5 bg-hinomaru rounded-full shadow-[0_0_15px_rgba(188,0,45,0.4)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-wider">ENTERPRISE</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-gold/10 border border-gold rounded text-[10px] text-gold font-semibold tracking-wide">
          ENTERPRISE EDITION
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey} className="mb-6">
            <div className="px-4 py-2 text-[10px] font-semibold text-foreground-tertiary uppercase tracking-wider">
              {t(`sections.${section.labelKey}`)}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 px-4 py-2 min-h-[44px] rounded-lg text-sm mb-0.5',
                    'transition-all duration-200',
                    active
                      ? 'bg-hinomaru/10 text-hinomaru-400'
                      : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{t(`nav.${item.key}`)}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 bg-hinomaru rounded text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer - Organization Info */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-4 p-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #bc002d, #c9a962)',
            }}
            aria-hidden="true"
          >
            {orgName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{orgName}</div>
            <div className="text-xs text-gold">{orgPlan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
