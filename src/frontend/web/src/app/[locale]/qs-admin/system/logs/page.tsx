'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { LogsViewer } from '@/components/qs-admin/System/LogsViewer';

export default function QSAdminSystemLogsPage() {
  return (
    <QSAdminLayout>
      <LogsViewer />
    </QSAdminLayout>
  );
}
