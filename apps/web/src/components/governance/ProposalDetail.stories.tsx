import type { Meta, StoryObj } from '@storybook/react';
import { ProposalDetail } from './ProposalDetail';
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
    proposalDetail: {
      ariaLabel: '提案詳細ページ',
      breadcrumb: {
        proposals: '提案一覧',
      },
      header: {
        proposer: '提案者',
        created: '作成日',
        comments: 'コメント',
      },
      countdown: {
        label: '投票終了まで',
        days: '日',
        hours: '時間',
        minutes: '分',
        seconds: '秒',
      },
      content: {
        title: '提案詳細',
        summary: '概要',
        motivation: '動機',
        specification: '仕様',
        securityConsiderations: 'セキュリティ考慮事項',
      },
      timeline: {
        title: 'タイムライン',
        proposalCreated: '提案作成',
        votingPeriod: '投票期間',
        votingEnds: '終了予定',
        timeLock: 'タイムロック（7日間）',
        timeLockNote: '可決時に適用',
        execution: '実行',
        executionNote: 'タイムロック終了後',
      },
      vote: {
        title: '投票する',
        for: '賛成',
        against: '反対',
        abstain: '棄権',
        yourPower: 'あなたの投票力',
        quorum: '定足数',
        quorumRequired: '必要',
        quorumReached: '達成',
        quorumTooltip: '定足数とは、提案が有効となるために必要な最低投票参加率です。',
      },
      voteModal: {
        title: '投票を確認',
        confirmText: '{id}に{vote}票を投じます',
        votingPower: '投票力',
        submit: '署名して投票',
        cancel: 'キャンセル',
      },
      voteSuccess: {
        title: '投票完了！',
        subtitle: 'あなたの投票がオンチェーンに記録されました',
        proposal: '提案',
        yourVote: 'あなたの投票',
        votingPower: '投票力',
        txHash: 'トランザクションハッシュ',
        backToProposals: '提案一覧に戻る',
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
        parameter: 'パラメータ変更',
        upgrade: 'アップグレード',
        signal: 'シグナル提案',
        treasury: 'トレジャリー',
        emergency: '緊急提案',
      },
    },
  },
};

const meta: Meta<typeof ProposalDetail> = {
  title: 'Governance/ProposalDetail',
  component: ProposalDetail,
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
type Story = StoryObj<typeof ProposalDetail>;

export const Default: Story = {
  args: {
    proposalId: 'QIP-047',
  },
};

export const Mobile: Story = {
  args: {
    proposalId: 'QIP-047',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  args: {
    proposalId: 'QIP-047',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
