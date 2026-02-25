'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { AnnouncementsDashboard } from '@/components/qs-admin/Announcements';

export default function QSAdminAnnouncementsPage() {
  return (
    <QSAdminLayout>
      <AnnouncementsDashboard />
    </QSAdminLayout>
  );
}
