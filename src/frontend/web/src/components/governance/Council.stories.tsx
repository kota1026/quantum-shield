import type { Meta, StoryObj } from '@storybook/react';
import { Council } from './Council';
import { NextIntlClientProvider } from 'next-intl';

const jaMessages = {
  governance: {
    council: {
      ariaLabel: '評議会ページ',
      pageTitle: '評議会',
      pageSubtitle: 'セキュリティ評議会と目的委員会の監督機能',
      infoBox: {
        title: '評議会拒否権（CP-3）',
        text: 'セキュリティ評議会はセキュリティリスクのある提案を拒否できます。目的委員会はコア原則（CP-1〜CP-5）に違反する提案を拒否できます。すべての拒否権行使は透明性のため（CP-5）理由の公開が必要です。',
      },
      securityCouncil: {
        title: 'セキュリティ評議会',
        status: '{active}/{total} アクティブ',
        description:
          'プロトコルセキュリティを担当。緊急停止の実行とセキュリティ関連提案の拒否が可能。アクションには4/7マルチシグが必要。',
        roles: {
          lead: 'リーダー',
          member: 'メンバー',
          chair: '議長',
        },
      },
      purposeCommittee: {
        title: '目的委員会',
        status: '{active}/{total} アクティブ',
        description:
          'コア原則（CP-1〜CP-5）の守護者。プロトコルの基本的価値観とミッションに違反する提案を拒否できます。',
      },
      memberCard: {
        active: 'アクティブ',
        inactive: '非アクティブ',
      },
      tabs: {
        status: 'システムステータス',
        vetoHistory: '拒否履歴',
      },
      systemStatus: {
        title: '緊急システムステータス',
        allOperational: 'すべてのシステムが正常稼働中',
        lastCheck: '最終チェック: {time}',
        systems: {
          lockContract: 'ロックコントラクト',
          starkVerifier: 'STARK検証器',
          governance: 'ガバナンス',
        },
        statusActive: '稼働中',
        statusPaused: '一時停止中',
      },
      vetoHistory: {
        title: '拒否履歴',
        total: '{count}件',
        noHistory: '拒否履歴はありません',
        columns: {
          proposalId: '提案ID',
          title: 'タイトル',
          vetoedBy: '拒否者',
          reason: '理由',
          date: '日付',
        },
        vetoDetail: {
          title: '拒否詳細: {id}',
          vetoedBy: '拒否者',
          approvalCount: '{count}承認',
          reason: '理由（CP-5による必須公開）',
          onchainRef: 'オンチェーン参照',
        },
        violations: {
          cp1: 'CP-1違反',
          cp2: 'CP-2違反',
          cp3: 'CP-3違反',
          cp4: 'CP-4違反',
          cp5: 'CP-5違反',
        },
      },
      footer: {
        disclaimer:
          '評議会のアクションはCP-5（透明性）に基づきオンチェーンで記録され、公開検証可能です。',
      },
    },
    landing: {
      footer: {
        governanceForum: 'ガバナンスフォーラム',
        documentation: 'ドキュメント',
        terms: '利用規約',
        privacy: 'プライバシーポリシー',
        disclaimer:
          'ガバナンスへの参加は任意です。投票は財務アドバイスを構成するものではありません。すべての提案にはタイムロック（7日間）と評議会拒否権が適用されます。',
        copyright: '© 2026 Quantum Shield. Made in Japan.',
      },
    },
  },
};

const meta: Meta<typeof Council> = {
  title: 'Governance/Council',
  component: Council,
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <div className="bg-background min-h-screen">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0A0A0F' }],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Council>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
