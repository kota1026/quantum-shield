'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { BudgetManagement } from '@/components/qs-admin/Treasury/BudgetManagement';

export default function QSAdminTreasuryBudgetPage() {
  return (
    <QSAdminLayout>
      <BudgetManagement />
    </QSAdminLayout>
  );
}
