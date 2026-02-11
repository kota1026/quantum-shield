'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ObserverList } from '@/components/qs-admin/Observer/ObserverList';

export default function QSAdminObserverListPage() {
  return (
    <QSAdminLayout>
      <ObserverList />
    </QSAdminLayout>
  );
}
