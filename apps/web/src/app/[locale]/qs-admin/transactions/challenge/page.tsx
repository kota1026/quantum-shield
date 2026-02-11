'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ChallengeTransactions } from '@/components/qs-admin/Transactions/ChallengeTransactions';

export default function QSAdminTransactionsChallengePage() {
  return (
    <QSAdminLayout>
      <ChallengeTransactions />
    </QSAdminLayout>
  );
}
