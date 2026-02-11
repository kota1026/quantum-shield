'use client';

import { useTranslations } from 'next-intl';
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STATS = {
  totalUsers: 1234,
  activeUsers: 856,
  newUsersMonth: 47,
  avgTransactions: 12.4,
};

const TOP_USERS = [
  { name: 'Tanaka Corp', transactions: 2847, volume: '$2.4M' },
  { name: 'Yamamoto Inc', transactions: 1923, volume: '$1.8M' },
  { name: 'Suzuki Holdings', transactions: 1456, volume: '$1.2M' },
  { name: 'Watanabe Ltd', transactions: 1102, volume: '$980K' },
  { name: 'Ito Group', transactions: 847, volume: '$720K' },
];

const GROWTH_DATA = [
  { month: 'Aug', users: 980 },
  { month: 'Sep', users: 1050 },
  { month: 'Oct', users: 1120 },
  { month: 'Nov', users: 1180 },
  { month: 'Dec', users: 1234 },
];

export function EnterpriseUsersStats() {
  const t = useTranslations('enterprise.usersStats');
  const tCommon = useTranslations('enterprise');

  const maxUsers = Math.max(...GROWTH_DATA.map((d) => d.users));

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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-background-secondary/50 border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Users className="h-5 w-5 text-foreground-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{STATS.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.totalUsers')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-success/5 border-success/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{STATS.activeUsers}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.activeUsers')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-info/5 border-info/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <UserPlus className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-info">+{STATS.newUsersMonth}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.newUsers')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gold/5 border-gold/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Activity className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold">{STATS.avgTransactions}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.avgTransactions')}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">{t('charts.userGrowth')}</h3>
              <div className="h-48 flex items-end gap-4">
                {GROWTH_DATA.map((item, i) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-hinomaru/60 rounded-t transition-all hover:bg-hinomaru"
                      style={{ height: `${(item.users / maxUsers) * 100}%` }}
                    />
                    <span className="text-xs text-foreground-tertiary">{item.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>+26% growth over 5 months</span>
              </div>
            </Card>

            {/* Top Users */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">{t('charts.topUsers')}</h3>
              <div className="space-y-4">
                {TOP_USERS.map((user, i) => (
                  <div key={user.name} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-hinomaru/10 flex items-center justify-center text-sm font-bold text-hinomaru">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-xs text-foreground-tertiary">
                        {user.transactions.toLocaleString()} transactions
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gold">{user.volume}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default EnterpriseUsersStats;
