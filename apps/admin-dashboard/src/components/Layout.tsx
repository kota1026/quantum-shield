import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: '📊' },
    { name: t('nav.provers'), href: '/provers', icon: '🔐' },
    { name: t('nav.providers'), href: '/providers', icon: '🏛️' },
    { name: t('nav.analytics'), href: '/analytics', icon: '📈' },
    { name: t('nav.emergency'), href: '/emergency', icon: '🚨' },
    { name: t('nav.edition'), href: '/edition', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between px-4">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>
            🔒 {t('layout.title')}
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-800"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="mt-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center px-4 py-3 ${isActive
                  ? 'bg-qs-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* System Status Indicator */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className={`${sidebarOpen ? 'px-4 py-3' : 'px-2 py-2'} bg-green-900 rounded-lg`}>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              {sidebarOpen && (
                <span className="ml-2 text-sm text-green-200">{t('layout.systemActive')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow h-16 flex items-center px-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              {t('layout.adminDashboard')}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600">{t('layout.networkStatus')}</span>
            <div className="w-8 h-8 bg-qs-primary rounded-full flex items-center justify-center text-white">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
