'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface QSAdminLayoutProps {
  children: React.ReactNode;
}

export function QSAdminLayout({ children }: QSAdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
