import type { Meta, StoryObj } from '@storybook/react';
import { MyActivity } from './MyActivity';
import { NextIntlClientProvider } from 'next-intl';

const jaMessages = {
  governance: {
    myActivity: {
      ariaLabel: 'マイアクティビティページ',
      pageTitle: 'マイアクティビティ',
      stats: {
        totalVotes: '投票総数',
        participationRate: '参加率',
        proposalsCreated: '作成した提案',
        delegationsReceived: '委任受領数',
      },
      tabs: {
        votes: '投票履歴',
        proposals: '作成した提案',
        delegations: '委任',
      },
      votesTab: {
        title: '投票履歴',
        voteBadge: {
          for: '賛成',
          against: '反対',
          abstain: '棄権',
        },
        emptyState: {
          title: '投票履歴がありません',
          description: 'まだ投票していません。提案一覧から投票に参加してみましょう。',
        },
      },
      proposalsTab: {
        title: '作成した提案',
        status: {
          passed: '可決',
          defeated: '否決',
          active: '投票中',
          pending: '実行待ち',
        },
        emptyState: {
          title: '作成した提案がありません',
          description: 'まだ提案を作成していません。新しい提案を作成してみましょう。',
        },
      },
      delegationsTab: {
        title: '委任受領',
        delegatedSince: '委任開始',
        delegatedPower: '委任された投票力',
        emptyState: {
          title: '委任がありません',
          description: 'まだ誰からも委任を受けていません。',
        },
      },
      footer: {
        disclaimer:
          'あなたのガバナンスアクティビティはオンチェーンで記録され、公開検証可能です。',
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

const meta: Meta<typeof MyActivity> = {
  title: 'Governance/MyActivity',
  component: MyActivity,
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
type Story = StoryObj<typeof MyActivity>;

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
