import type { Meta, StoryObj } from '@storybook/react';
import { ExplorerAnalytics } from './Analytics';
import { NextIntlClientProvider } from 'next-intl';

const jaMessages = {
  explorer: {
    common: {
      header: {
        overview: '概要',
        locks: 'Lock',
        unlocks: 'Unlock',
        challenges: 'Challenge',
        provers: 'Prover',
        analytics: '分析',
      },
    },
    analytics: {
      pageTitle: 'プロトコル分析',
      timeRange: {
        label: '期間',
        '7d': '7日',
        '30d': '30日',
        '90d': '90日',
        '1y': '1年',
        all: '全期間',
      },
      sections: {
        tvl: 'TVL推移',
        tvlTooltip: 'TVL = Total Value Locked（総ロック額）の推移グラフです',
        volume: '取引量',
        volumeTooltip: 'Lock/Unlockの1日あたりの取引量です',
        provers: 'Prover稼働状況',
      },
      charts: {
        tvl: {
          title: 'TVL推移',
          yAxis: 'TVL (ETH)',
          current: '現在のTVL',
          change: '変化率',
        },
        volume: {
          title: '日次取引量',
          locks: 'Lock',
          unlocks: 'Unlock',
          yAxis: '件数',
        },
        locksByStatus: {
          title: 'Lockステータス別',
          active: 'アクティブ',
          unlocking: 'Unlock中',
          unlocked: 'Unlock済み',
        },
        unlocksByType: {
          title: 'Unlockタイプ別',
          normal: '通常',
          emergency: '緊急',
        },
        proverUptime: {
          title: 'Prover稼働率',
          uptime: '稼働率',
          avgResponseTime: '平均応答時間',
          avgResponseTimeTooltip: '署名要求に対する平均応答時間です',
        },
        challengeRate: {
          title: 'Challenge発生率',
          rate: '発生率',
          rateTooltip: '全Unlock要求に対するChallengeの割合です',
          resolved: '解決済み',
          pending: '係争中',
        },
      },
      stats: {
        totalLocks: '累計Lock数',
        totalUnlocks: '累計Unlock数',
        avgLockAmount: '平均Lock金額',
        avgLockDuration: '平均Lock期間',
        avgLockDurationTooltip: 'LockからUnlock完了までの平均期間です',
        successRate: '成功率',
        successRateTooltip: 'Challenge無しで完了したUnlockの割合です',
      },
      export: {
        button: 'データをエクスポート',
      },
    },
  },
};

const enMessages = {
  explorer: {
    common: {
      header: {
        overview: 'Overview',
        locks: 'Locks',
        unlocks: 'Unlocks',
        challenges: 'Challenges',
        provers: 'Provers',
        analytics: 'Analytics',
      },
    },
    analytics: {
      pageTitle: 'Protocol Analytics',
      timeRange: {
        label: 'Time Range',
        '7d': '7 Days',
        '30d': '30 Days',
        '90d': '90 Days',
        '1y': '1 Year',
        all: 'All Time',
      },
      sections: {
        tvl: 'TVL Trend',
        tvlTooltip: 'TVL = Total Value Locked trend over time',
        volume: 'Volume',
        volumeTooltip: 'Daily Lock/Unlock transaction volume',
        provers: 'Prover Performance',
      },
      charts: {
        tvl: {
          title: 'TVL Trend',
          yAxis: 'TVL (ETH)',
          current: 'Current TVL',
          change: 'Change',
        },
        volume: {
          title: 'Daily Volume',
          locks: 'Locks',
          unlocks: 'Unlocks',
          yAxis: 'Count',
        },
        locksByStatus: {
          title: 'Locks by Status',
          active: 'Active',
          unlocking: 'Unlocking',
          unlocked: 'Unlocked',
        },
        unlocksByType: {
          title: 'Unlocks by Type',
          normal: 'Normal',
          emergency: 'Emergency',
        },
        proverUptime: {
          title: 'Prover Uptime',
          uptime: 'Uptime',
          avgResponseTime: 'Avg Response Time',
          avgResponseTimeTooltip: 'Average time to respond to signature requests',
        },
        challengeRate: {
          title: 'Challenge Rate',
          rate: 'Rate',
          rateTooltip: 'Percentage of unlocks that received challenges',
          resolved: 'Resolved',
          pending: 'Pending',
        },
      },
      stats: {
        totalLocks: 'Total Locks',
        totalUnlocks: 'Total Unlocks',
        avgLockAmount: 'Avg Lock Amount',
        avgLockDuration: 'Avg Lock Duration',
        avgLockDurationTooltip: 'Average time from lock to unlock completion',
        successRate: 'Success Rate',
        successRateTooltip: 'Percentage of unlocks completed without challenges',
      },
      export: {
        button: 'Export Data',
      },
    },
  },
};

const meta: Meta<typeof ExplorerAnalytics> = {
  title: 'Explorer/Analytics',
  component: ExplorerAnalytics,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story, context) => {
      const locale = context.args.locale || 'ja';
      const messages = locale === 'en' ? enMessages : jaMessages;
      return (
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Story />
        </NextIntlClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ExplorerAnalytics>;

// Default Japanese view
export const Default: Story = {
  args: {
    locale: 'ja',
  },
};

// English version
export const English: Story = {
  args: {
    locale: 'en',
  },
};

// Mobile view
export const Mobile: Story = {
  args: {
    locale: 'ja',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Tablet view
export const Tablet: Story = {
  args: {
    locale: 'ja',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
