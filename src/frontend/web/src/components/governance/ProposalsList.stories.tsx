import type { Meta, StoryObj } from '@storybook/react';
import { ProposalsList } from './ProposalsList';
import { NextIntlClientProvider } from 'next-intl';

// Load Japanese translations for stories
const jaMessages = {
  governance: {
    landing: {
      footer: {
        governanceForum: 'ガバナンスフォーラム',
        documentation: 'ドキュメント',
        terms: '利用規約',
        disclaimer: 'ガバナンスへの参加は任意です。投票は財務アドバイスを構成するものではありません。すべての提案にはタイムロック（7日間）と評議会拒否権が適用されます。',
      },
    },
    proposals: {
      pageTitle: 'Proposals',
      ariaLabel: '提案一覧ページ',
      createProposal: '提案を作成',
      filters: {
        all: 'すべて',
        active: '投票中',
        passed: '可決',
        defeated: '否決',
        vetoed: '拒否',
      },
      search: {
        placeholder: '提案を検索...',
        ariaLabel: '提案を検索',
      },
      proposalCard: {
        ariaLabel: '提案 {id}: {title}',
        proposer: '提案者',
        created: '作成日',
        executed: '実行日',
        ended: '終了日',
        comments: 'コメント',
        timeLeft: '残り',
        timeLock: 'タイムロック残り',
      },
      status: {
        active: '投票中',
        pending: '実行待ち',
        passed: '可決',
        executed: '実行済み',
        defeated: '否決',
        vetoed: '拒否',
      },
      types: {
        parameter: 'パラメータ',
        upgrade: 'アップグレード',
        signal: 'シグナル',
        treasury: 'トレジャリー',
        emergency: '緊急',
      },
      vote: {
        for: '賛成',
        against: '反対',
        quorum: '定足数',
        quorumReached: '達成',
        quorumTooltip: '定足数とは、提案が有効となるために必要な最低投票参加率です。定足数に達しないと、投票結果に関わらず提案は成立しません。',
      },
      yourVote: {
        votedFor: '賛成票を投じました',
        votedAgainst: '反対票を投じました',
        notVoted: 'まだ投票していません',
      },
      pagination: {
        previous: '前へ',
        next: '次へ',
        page: 'ページ {number}',
      },
      emptyState: {
        title: '提案がありません',
        description: '現在このカテゴリには提案がありません',
      },
    },
  },
};

const meta: Meta<typeof ProposalsList> = {
  title: 'Governance/ProposalsList',
  component: ProposalsList,
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
      values: [
        { name: 'dark', value: '#0A0A0F' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProposalsList>;

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
