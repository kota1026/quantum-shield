import type { Meta, StoryObj } from '@storybook/react';
import { CreateProposal } from './CreateProposal';
import { NextIntlClientProvider } from 'next-intl';

const jaMessages = {
  governance: {
    landing: {
      footer: {
        disclaimer: 'ガバナンスへの参加は任意です。投票は財務アドバイスを構成するものではありません。すべての提案にはタイムロック（7日間）と評議会拒否権が適用されます。',
      },
    },
    createProposal: {
      ariaLabel: '提案作成ページ',
      pageTitle: '提案作成',
      pageSubtitle: '新しいガバナンス提案をコミュニティ投票に提出',
      stepper: {
        type: 'タイプ',
        details: '詳細',
        preview: 'プレビュー',
      },
      step1: {
        title: '提案タイプを選択',
        types: {
          parameter: {
            name: 'パラメータ変更',
            description: 'ボンド額、手数料、期間などのプロトコルパラメータを変更',
            quorum: '定足数: 4%',
          },
          upgrade: {
            name: 'コントラクトアップグレード',
            description: 'スマートコントラクトのアップグレードや新機能の追加',
            quorum: '定足数: 8%',
          },
          signal: {
            name: 'シグナル提案',
            description: 'コミュニティの意思表示のための拘束力のない投票提案',
            quorum: '定足数: 3%',
          },
        },
        requirement: {
          title: '提案要件',
          description: '提案を作成するには最低 {minVeqs} veQS が必要です。',
          yourBalance: 'あなたの残高',
          sufficient: '条件を満たしています',
          insufficient: 'veQSが不足しています',
        },
        cancel: 'キャンセル',
        next: '次へ: 詳細入力',
      },
      step2: {
        title: '提案の詳細',
        titleLabel: 'タイトル',
        titlePlaceholder: '分かりやすいタイトルを入力してください',
        summaryLabel: '説明',
        summaryPlaceholder: '提案の詳細を記述してください。\n- 動機\n- 仕様\n- セキュリティ考慮事項',
        summaryHint: 'Markdown形式に対応しています',
        forumLinkLabel: 'フォーラムリンク（任意）',
        forumLinkPlaceholder: 'https://forum.quantumshield.io/t/...',
        forumLinkHint: 'ガバナンスフォーラムでの事前議論へのリンク',
        back: '戻る',
        next: '次へ: プレビュー',
      },
      step3: {
        title: '確認して提出',
        summary: {
          proposalType: '提案タイプ',
          requiredQuorum: '必要定足数',
          votingPeriod: '投票期間',
          votingPeriodValue: '7日間',
          timeLock: 'タイムロック',
          timeLockValue: '可決後7日間',
        },
        previewTitle: 'タイトル',
        previewDescription: '説明',
        warning: {
          title: '重要なお知らせ',
          text: '提出後、この提案は編集またはキャンセルできません。',
        },
        back: '戻る',
        submit: '署名して提案を提出',
      },
      success: {
        title: '提案が作成されました！',
        subtitle: 'あなたの提案は投票に公開されました',
        proposalId: '提案ID',
        viewProposal: '提案を見る',
        backToProposals: '提案一覧に戻る',
      },
    },
  },
};

const meta: Meta<typeof CreateProposal> = {
  title: 'Governance/CreateProposal',
  component: CreateProposal,
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
type Story = StoryObj<typeof CreateProposal>;

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
