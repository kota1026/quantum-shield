import type { Meta, StoryObj } from '@storybook/react';
import { ExplorerAbout } from './About';
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
    about: {
      pageTitle: 'Quantum Shield Explorerについて',
      hero: {
        title: 'プロトコルの透明性を実現',
        subtitle: 'Quantum Shield Explorerは、すべてのLock、Unlock、Challengeをリアルタイムで追跡できる透明性の高いダッシュボードです。',
      },
      sections: {
        whatIs: {
          title: 'Quantum Shield Explorerとは',
          description: 'Quantum Shield Explorerは、Quantum Shieldプロトコルのすべての活動を可視化するツールです。',
        },
        features: {
          title: '主な機能',
          items: {
            realtime: { title: 'リアルタイム追跡', description: 'Lock/Unlockトランザクションをリアルタイムで監視' },
            search: { title: '高度な検索', description: 'アドレス、TX Hash、Lock IDで素早く検索' },
            analytics: { title: '分析ダッシュボード', description: 'TVL推移、取引量、Prover稼働状況を可視化' },
            transparency: { title: '完全な透明性', description: 'すべてのトランザクションとChallengeを公開' },
          },
        },
        howItWorks: {
          title: '仕組み',
          steps: {
            lock: { title: '1. Lock', description: 'ユーザーがETHをQuantum Shieldにロック' },
            unlock: { title: '2. Unlock要求', description: 'Dilithium署名でアンロックを要求' },
            prover: { title: '3. Prover検証', description: '5社のProverのうち2社がランダムに選出され署名' },
            timelock: { title: '4. Time Lock', description: '24時間（通常）または7日間（緊急）の待機期間' },
            complete: { title: '5. 完了', description: '待機期間終了後、資産が引き出し可能に' },
          },
        },
        resources: {
          title: 'リソース',
          docs: { title: 'ドキュメント', description: '技術仕様と詳細なガイド' },
          github: { title: 'GitHub', description: 'オープンソースコード' },
          discord: { title: 'Discord', description: 'コミュニティに参加' },
        },
      },
      cta: {
        explore: 'Explorerを開始',
        learnMore: '詳細を見る',
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
    about: {
      pageTitle: 'About Quantum Shield Explorer',
      hero: {
        title: 'Enabling Protocol Transparency',
        subtitle: 'Quantum Shield Explorer is a transparent dashboard that tracks all Locks, Unlocks, and Challenges in real-time.',
      },
      sections: {
        whatIs: {
          title: 'What is Quantum Shield Explorer',
          description: 'Quantum Shield Explorer is a tool that visualizes all activity on the Quantum Shield protocol.',
        },
        features: {
          title: 'Key Features',
          items: {
            realtime: { title: 'Real-time Tracking', description: 'Monitor Lock/Unlock transactions in real-time' },
            search: { title: 'Advanced Search', description: 'Quickly search by Address, TX Hash, or Lock ID' },
            analytics: { title: 'Analytics Dashboard', description: 'Visualize TVL trends, volume, and Prover performance' },
            transparency: { title: 'Full Transparency', description: 'All transactions and challenges are public' },
          },
        },
        howItWorks: {
          title: 'How It Works',
          steps: {
            lock: { title: '1. Lock', description: 'User locks ETH in Quantum Shield' },
            unlock: { title: '2. Unlock Request', description: 'Request unlock with Dilithium signature' },
            prover: { title: '3. Prover Verification', description: '2 of 5 Provers randomly selected to sign' },
            timelock: { title: '4. Time Lock', description: '24 hours (normal) or 7 days (emergency) wait period' },
            complete: { title: '5. Complete', description: 'Assets become withdrawable after wait period' },
          },
        },
        resources: {
          title: 'Resources',
          docs: { title: 'Documentation', description: 'Technical specs and detailed guides' },
          github: { title: 'GitHub', description: 'Open source code' },
          discord: { title: 'Discord', description: 'Join the community' },
        },
      },
      cta: {
        explore: 'Start Exploring',
        learnMore: 'Learn More',
      },
    },
  },
};

const meta: Meta<typeof ExplorerAbout> = {
  title: 'Explorer/About',
  component: ExplorerAbout,
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
type Story = StoryObj<typeof ExplorerAbout>;

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
