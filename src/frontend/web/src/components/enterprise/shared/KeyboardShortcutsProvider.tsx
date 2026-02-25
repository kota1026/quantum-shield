'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'action' | 'modal';
}

interface KeyboardShortcutsContextType {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (key: string) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  locale?: string;
}

export function KeyboardShortcutsProvider({ children, locale = 'ja' }: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('enterprise.keyboard');
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Default navigation shortcuts
  const defaultShortcuts: Shortcut[] = [
    {
      key: 'g',
      description: t('shortcuts.dashboard'),
      action: () => router.push(`/${locale}/enterprise/dashboard`),
      category: 'navigation',
    },
    {
      key: 'p',
      description: t('shortcuts.provers'),
      action: () => router.push(`/${locale}/enterprise/provers`),
      category: 'navigation',
    },
    {
      key: 'o',
      description: t('shortcuts.observers'),
      action: () => router.push(`/${locale}/enterprise/observers`),
      category: 'navigation',
    },
    {
      key: 'm',
      description: t('shortcuts.monitoring'),
      action: () => router.push(`/${locale}/enterprise/monitoring`),
      category: 'navigation',
    },
    {
      key: 's',
      description: t('shortcuts.settings'),
      action: () => router.push(`/${locale}/enterprise/settings`),
      category: 'navigation',
    },
    {
      key: 'a',
      description: t('shortcuts.auditLog'),
      action: () => router.push(`/${locale}/enterprise/audit-log`),
      category: 'navigation',
    },
    {
      key: 't',
      description: t('shortcuts.support'),
      action: () => router.push(`/${locale}/enterprise/support`),
      category: 'navigation',
    },
    {
      key: '?',
      description: t('shortcuts.help'),
      action: () => setIsHelpOpen(true),
      category: 'modal',
    },
    {
      key: 'Escape',
      description: t('shortcuts.closeModal'),
      action: () => setIsHelpOpen(false),
      category: 'modal',
    },
  ];

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => {
      const filtered = prev.filter((s) => s.key !== shortcut.key);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to still work in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Handle ? key (requires shift)
      const key = event.key === '?' ? '?' : event.key;

      // Find matching shortcut
      const allShortcuts = [...defaultShortcuts, ...shortcuts];
      const shortcut = allShortcuts.find((s) => s.key === key);

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, defaultShortcuts]);

  const allShortcuts = [...defaultShortcuts, ...shortcuts];

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts: allShortcuts,
        registerShortcut,
        unregisterShortcut,
        isHelpOpen,
        setIsHelpOpen,
      }}
    >
      {children}

      {/* Help Modal */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsHelpOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-shortcuts-title"
        >
          <div
            className="bg-background-secondary border border-white/10 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 id="keyboard-shortcuts-title" className="text-xl font-semibold">
                {t('helpTitle')}
              </h2>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label={t('close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Navigation shortcuts */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground-secondary mb-3">
                  {t('categories.navigation')}
                </h3>
                <div className="space-y-2">
                  {allShortcuts
                    .filter((s) => s.category === 'navigation')
                    .map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-foreground-secondary">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2.5 py-1 bg-background-tertiary border border-white/10 rounded text-xs font-mono text-foreground">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action shortcuts */}
              {allShortcuts.filter((s) => s.category === 'action').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground-secondary mb-3">
                    {t('categories.actions')}
                  </h3>
                  <div className="space-y-2">
                    {allShortcuts
                      .filter((s) => s.category === 'action')
                      .map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm text-foreground-secondary">
                            {shortcut.description}
                          </span>
                          <kbd className="px-2.5 py-1 bg-background-tertiary border border-white/10 rounded text-xs font-mono text-foreground">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Modal shortcuts */}
              <div>
                <h3 className="text-sm font-semibold text-foreground-secondary mb-3">
                  {t('categories.modal')}
                </h3>
                <div className="space-y-2">
                  {allShortcuts
                    .filter((s) => s.category === 'modal')
                    .map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-foreground-secondary">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2.5 py-1 bg-background-tertiary border border-white/10 rounded text-xs font-mono text-foreground">
                          {shortcut.key === 'Escape' ? 'Esc' : shortcut.key}
                        </kbd>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-background-tertiary/50 border-t border-white/10">
              <p className="text-xs text-foreground-tertiary text-center">
                {t('footer')}
              </p>
            </div>
          </div>
        </div>
      )}
    </KeyboardShortcutsContext.Provider>
  );
}

export default KeyboardShortcutsProvider;
