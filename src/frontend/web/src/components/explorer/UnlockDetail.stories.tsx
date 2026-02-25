import type { Meta, StoryObj } from '@storybook/react';
import { UnlockDetail } from './UnlockDetail';
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
      status: {
        pending: '保留中',
        complete: '完了',
        challenged: 'Challenge中',
      },
      unlockType: {
        normal: '通常',
        emergency: '緊急',
      },
    },
    unlockDetail: {
      breadcrumb: {
        unlocks: 'Unlock一覧',
        detail: '詳細',
      },
      notFound: {
        title: 'Unlockが見つかりません',
        description: '指定されたUnlock IDは存在しないか、削除された可能性があります。',
        backToUnlocks: 'Unlock一覧に戻る',
      },
      sections: {
        overview: '概要',
        unlockInfo: 'Unlock情報',
        dilithiumSig: 'Dilithium署名',
        proverSigs: 'Prover署名',
        timeline: 'タイムライン',
        challenge: 'Challenge情報',
      },
      fields: {
        unlockId: 'Unlock ID',
        lockId: 'Lock ID',
        type: 'タイプ',
        typeTooltip: 'タイプ = 通常のアンロック（24時間待機）か緊急アンロック（7日間待機・全Prover承認必要）かを示します',
        status: 'ステータス',
        amount: '金額',
        requestTime: '要求日時',
        timeLockEnd: 'Time Lock終了',
        timeLockEndTooltip: 'Time Lock終了 = この時刻を過ぎると資産の引き出しが可能になります',
        signatureHash: '署名ハッシュ',
        signatureHashTooltip: '署名ハッシュ = Dilithium鍵で生成された量子耐性署名のハッシュ値です',
        verified: '検証済み',
        l2TxHash: 'L2 TX Hash',
        l2TxHashTooltip: 'L2 TX = Layer2で記録されたトランザクションです',
        challengeId: 'Challenge ID',
        challenger: 'Challenger',
        bond: 'Bond',
        defenseDeadline: '防御期限',
      },
      timeline: {
        requested: 'Unlock要求',
        timeLockStart: 'Time Lock開始',
        proverApproval: 'Prover承認',
        timeLockEnd: 'Time Lock終了',
        executed: 'Unlock実行',
        challenged: 'Challenge発生',
      },
      proverStatus: {
        signed: '署名済み',
        pending: '保留中',
      },
      timeLockProgress: 'Time Lock進捗',
      actions: {
        copyUnlockId: 'Unlock IDをコピー',
        viewLock: '関連Lockを見る',
        viewOnL2: 'L2で確認',
        viewChallenge: 'Challengeを見る',
      },
      copied: 'コピーしました',
    },
    unlocks: {
      timeLock: {
        remaining: '残り',
        defense: '防御期限',
      },
      table: {
        proverSigsTooltip: 'Prover署名 = 5人の独立した承認者のうち、何人がこのUnlockを承認済みか',
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
      status: {
        pending: 'Pending',
        complete: 'Complete',
        challenged: 'Challenged',
      },
      unlockType: {
        normal: 'Normal',
        emergency: 'Emergency',
      },
    },
    unlockDetail: {
      breadcrumb: {
        unlocks: 'All Unlocks',
        detail: 'Details',
      },
      notFound: {
        title: 'Unlock Not Found',
        description: 'The specified Unlock ID does not exist or has been removed.',
        backToUnlocks: 'Back to Unlocks',
      },
      sections: {
        overview: 'Overview',
        unlockInfo: 'Unlock Information',
        dilithiumSig: 'Dilithium Signature',
        proverSigs: 'Prover Signatures',
        timeline: 'Timeline',
        challenge: 'Challenge Information',
      },
      fields: {
        unlockId: 'Unlock ID',
        lockId: 'Lock ID',
        type: 'Type',
        typeTooltip: 'Type = Indicates whether this is a normal unlock (24h wait) or emergency unlock (7 days wait)',
        status: 'Status',
        amount: 'Amount',
        requestTime: 'Request Time',
        timeLockEnd: 'Time Lock End',
        timeLockEndTooltip: 'Time Lock End = After this time, the assets can be withdrawn',
        signatureHash: 'Signature Hash',
        signatureHashTooltip: 'Signature Hash = Hash of the quantum-resistant signature',
        verified: 'Verified',
        l2TxHash: 'L2 TX Hash',
        l2TxHashTooltip: 'L2 TX = Transaction recorded on Layer 2',
        challengeId: 'Challenge ID',
        challenger: 'Challenger',
        bond: 'Bond',
        defenseDeadline: 'Defense Deadline',
      },
      timeline: {
        requested: 'Unlock Requested',
        timeLockStart: 'Time Lock Started',
        proverApproval: 'Prover Approval',
        timeLockEnd: 'Time Lock Ends',
        executed: 'Unlock Executed',
        challenged: 'Challenge Filed',
      },
      proverStatus: {
        signed: 'Signed',
        pending: 'Pending',
      },
      timeLockProgress: 'Time Lock Progress',
      actions: {
        copyUnlockId: 'Copy Unlock ID',
        viewLock: 'View Related Lock',
        viewOnL2: 'View on L2',
        viewChallenge: 'View Challenge',
      },
      copied: 'Copied',
    },
    unlocks: {
      timeLock: {
        remaining: 'left',
        defense: 'Defense',
      },
      table: {
        proverSigsTooltip: 'Prover Sigs = How many of 5 independent verifiers have approved this unlock',
      },
    },
  },
};

const meta: Meta<typeof UnlockDetail> = {
  title: 'Explorer/UnlockDetail',
  component: UnlockDetail,
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
type Story = StoryObj<typeof UnlockDetail>;

// Pending normal unlock
export const PendingNormal: Story = {
  args: {
    locale: 'ja',
    unlockId: '0x2e7f...d934',
  },
};

// Pending emergency unlock
export const PendingEmergency: Story = {
  args: {
    locale: 'ja',
    unlockId: '0x5c9a...e127',
  },
};

// Completed unlock
export const Completed: Story = {
  args: {
    locale: 'ja',
    unlockId: '0x3b1d...f842',
  },
};

// Challenged unlock
export const Challenged: Story = {
  args: {
    locale: 'ja',
    unlockId: '0x7d4e...a563',
  },
};

// Not found
export const NotFound: Story = {
  args: {
    locale: 'ja',
    unlockId: 'invalid-id',
  },
};

// English version
export const English: Story = {
  args: {
    locale: 'en',
    unlockId: '0x2e7f...d934',
  },
};

// Mobile view
export const Mobile: Story = {
  args: {
    locale: 'ja',
    unlockId: '0x2e7f...d934',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
