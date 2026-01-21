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
  Globe,
  Briefcase,
  FileText,
  Eye,
  Vote,
  Wallet,
  Activity,
  CreditCard,
  Headphones,
  Database,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  badge?: number;
  isEmergency?: boolean;
}

interface NavSection {
  labelKey: string;
  icon?: React.ReactNode;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface NavGroup {
  labelKey: string;
  colorClass: string;
  sections: NavSection[];
}

export function AdminSidebarV2() {
  const t = useTranslations('admin.sidebar');
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    public: true,
    saas: false,
    license: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navGroups: NavGroup[] = [
    {
      labelKey: 'groups.overview',
      colorClass: 'text-gold',
      sections: [
        {
          labelKey: 'sections.main',
          items: [
            {
              href: '/admin/dashboard',
              labelKey: 'nav.dashboard',
              icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/emergency',
              labelKey: 'nav.emergencyPause',
              icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
              isEmergency: true,
            },
          ],
        },
      ],
    },
    {
      labelKey: 'groups.public',
      colorClass: 'text-success',
      sections: [
        {
          labelKey: 'sections.publicUsers',
          collapsible: true,
          defaultOpen: true,
          items: [
            {
              href: '/admin/public/users',
              labelKey: 'nav.publicUsers',
              icon: <Users className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/public/provers',
              labelKey: 'nav.publicProvers',
              icon: <Shield className="h-4 w-4" aria-hidden="true" />,
              badge: 3,
            },
            {
              href: '/admin/public/observers',
              labelKey: 'nav.publicObservers',
              icon: <Eye className="h-4 w-4" aria-hidden="true" />,
            },
          ],
        },
        {
          labelKey: 'sections.publicGovernance',
          collapsible: true,
          items: [
            {
              href: '/admin/public/holders',
              labelKey: 'nav.tokenHolders',
              icon: <Wallet className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/public/governance',
              labelKey: 'nav.proposals',
              icon: <Vote className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/public/treasury',
              labelKey: 'nav.treasury',
              icon: <Briefcase className="h-4 w-4" aria-hidden="true" />,
            },
          ],
        },
        {
          labelKey: 'sections.publicProtocol',
          collapsible: true,
          items: [
            {
              href: '/admin/public/protocol',
              labelKey: 'nav.protocolMonitor',
              icon: <Activity className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/public/protocol/alerts',
              labelKey: 'nav.protocolAlerts',
              icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
              badge: 2,
            },
          ],
        },
      ],
    },
    {
      labelKey: 'groups.saas',
      colorClass: 'text-info',
      sections: [
        {
          labelKey: 'sections.saasOperators',
          collapsible: true,
          items: [
            {
              href: '/admin/saas/operators',
              labelKey: 'nav.saasOperators',
              icon: <Building2 className="h-4 w-4" aria-hidden="true" />,
              badge: 1,
            },
            {
              href: '/admin/saas/users',
              labelKey: 'nav.saasUsers',
              icon: <Users className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/saas/provers/qs',
              labelKey: 'nav.saasProvers',
              icon: <Shield className="h-4 w-4" aria-hidden="true" />,
            },
          ],
        },
        {
          labelKey: 'sections.saasBilling',
          collapsible: true,
          items: [
            {
              href: '/admin/saas/billing',
              labelKey: 'nav.billing',
              icon: <CreditCard className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/saas/support',
              labelKey: 'nav.support',
              icon: <Headphones className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/saas/infrastructure',
              labelKey: 'nav.infrastructure',
              icon: <Database className="h-4 w-4" aria-hidden="true" />,
            },
          ],
        },
      ],
    },
    {
      labelKey: 'groups.license',
      colorClass: 'text-warning',
      sections: [
        {
          labelKey: 'sections.licenseManagement',
          collapsible: true,
          items: [
            {
              href: '/admin/license/companies',
              labelKey: 'nav.licenseCompanies',
              icon: <Building2 className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/license/projects',
              labelKey: 'nav.licenseProjects',
              icon: <FileText className="h-4 w-4" aria-hidden="true" />,
            },
          ],
        },
      ],
    },
    {
      labelKey: 'groups.foundation',
      colorClass: 'text-foreground-secondary',
      sections: [
        {
          labelKey: 'sections.foundationSettings',
          items: [
            {
              href: '/admin/settings/members',
              labelKey: 'nav.members',
              icon: <User className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/settings/audit-log',
              labelKey: 'nav.auditLog',
              icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
            },
            {
              href: '/admin/settings/security',
              labelKey: 'nav.security',
              icon: <Settings className="h-4 w-4" aria-hidden="true" />,
            },
          ],
        },
      ],
    },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-surface-tertiary bg-background-secondary"
      role="navigation"
      aria-label="QS Admin Navigation"
    >
      {/* Header / Logo */}
      <div className="border-b border-surface-tertiary p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hinomaru text-lg font-bold text-white">
            QS
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">
              QS Admin
            </div>
            <div className="text-[10px] tracking-wider text-gold">
              Foundation Dashboard
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {/* Group Header */}
            <div className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest', group.colorClass)}>
              {t(group.labelKey)}
            </div>

            {group.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-2">
                {section.collapsible ? (
                  <button
                    onClick={() => toggleSection(`${groupIndex}-${sectionIndex}`)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] text-foreground-tertiary hover:text-foreground-secondary"
                  >
                    <span>{t(section.labelKey)}</span>
                    {openSections[`${groupIndex}-${sectionIndex}`] ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                ) : (
                  <div className="px-3 py-1 text-[11px] text-foreground-tertiary">
                    {t(section.labelKey)}
                  </div>
                )}

                {(!section.collapsible || openSections[`${groupIndex}-${sectionIndex}`]) && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
                          item.isEmergency
                            ? 'mt-1 bg-hinomaru text-white hover:bg-hinomaru-400'
                            : isActive(item.href)
                              ? 'bg-gold/10 text-gold'
                              : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground'
                        )}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {item.badge && (
                          <Badge variant="danger" size="sm" aria-label={`${item.badge} items`}>
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / User Info */}
      <div className="border-t border-surface-tertiary p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-sm text-gold">
            松
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              松本さん
            </div>
            <div className="text-[11px] text-foreground-tertiary">
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
