'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  Shield,
  Radio,
  Server,
  Settings,
  Building2,
  Users,
  User,
  BarChart3,
  ClipboardList,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  badge?: number;
  isEmergency?: boolean;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

export function AdminSidebar() {
  const t = useTranslations('admin.common.sidebar');
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      labelKey: 'sections.overview',
      items: [
        {
          href: '/admin/dashboard',
          labelKey: 'nav.dashboard',
          icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />,
        },
        {
          href: '/admin/emergency',
          labelKey: 'nav.emergencyPause',
          icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
          isEmergency: true,
        },
      ],
    },
    {
      labelKey: 'sections.operations',
      items: [
        {
          href: '/admin/provers',
          labelKey: 'nav.proverManagement',
          icon: <Shield className="h-5 w-5" aria-hidden="true" />,
          badge: 3,
        },
        {
          href: '/admin/tx-monitor',
          labelKey: 'nav.txMonitor',
          icon: <Radio className="h-5 w-5" aria-hidden="true" />,
        },
        {
          href: '/admin/nodes',
          labelKey: 'nav.l3Nodes',
          icon: <Server className="h-5 w-5" aria-hidden="true" />,
        },
      ],
    },
    {
      labelKey: 'sections.management',
      items: [
        {
          href: '/admin/parameters',
          labelKey: 'nav.parameters',
          icon: <Settings className="h-5 w-5" aria-hidden="true" />,
        },
        {
          href: '/admin/enterprise',
          labelKey: 'nav.enterprise',
          icon: <Building2 className="h-5 w-5" aria-hidden="true" />,
        },
        {
          href: '/admin/community',
          labelKey: 'nav.community',
          icon: <Users className="h-5 w-5" aria-hidden="true" />,
        },
      ],
    },
    {
      labelKey: 'sections.system',
      items: [
        {
          href: '/admin/staff',
          labelKey: 'nav.staff',
          icon: <User className="h-5 w-5" aria-hidden="true" />,
        },
        {
          href: '/admin/reports',
          labelKey: 'nav.reports',
          icon: <BarChart3 className="h-5 w-5" aria-hidden="true" />,
        },
        {
          href: '/admin/audit',
          labelKey: 'nav.auditLog',
          icon: <ClipboardList className="h-5 w-5" aria-hidden="true" />,
        },
        {
          href: '/admin/onboarding',
          labelKey: 'nav.onboarding',
          icon: <GraduationCap className="h-5 w-5" aria-hidden="true" />,
        },
      ],
    },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-surface-tertiary bg-background-secondary"
      role="navigation"
      aria-label={t('logo')}
    >
      {/* Header / Logo */}
      <div className="border-b border-surface-tertiary p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hinomaru text-lg font-bold text-white">
            QS
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">
              {t('logo')}
            </div>
            <div className="text-[10px] tracking-wider text-gold">
              {t('tagline')}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <div className="mb-2 px-3 text-[10px] uppercase tracking-widest text-foreground-tertiary">
              {t(section.labelKey)}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                  item.isEmergency
                    ? 'mt-2 bg-hinomaru text-white hover:bg-hinomaru-400'
                    : isActive(item.href)
                      ? 'bg-hinomaru/10 text-hinomaru-400'
                      : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground'
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{t(item.labelKey)}</span>
                {item.badge && (
                  <Badge variant="danger" size="sm" aria-label={`${item.badge} items requiring attention`}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / User Info */}
      <div className="border-t border-surface-tertiary p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-sm text-gold">
            松
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              松本さん
            </div>
            <div className="text-[11px] text-foreground-tertiary">
              {t('user.role')}
            </div>
            <Badge variant="success" size="sm" className="mt-1">
              {t('user.permissionBadge')}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
