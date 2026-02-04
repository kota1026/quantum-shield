'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { TicketsList } from '@/components/qs-admin/Support/TicketsList';

export default function QSAdminSupportTicketsPage() {
  return (
    <QSAdminLayout>
      <TicketsList />
    </QSAdminLayout>
  );
}
