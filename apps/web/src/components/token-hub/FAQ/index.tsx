'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  HelpCircle,
  ChevronDown,
  Lock,
  Coins,
  Clock,
  Vote,
  Gift,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { Link } from '@/i18n/navigation';

// FAQ categories
const FAQ_CATEGORIES = [
  { id: 'general', icon: HelpCircle },
  { id: 'locking', icon: Lock },
  { id: 'veqs', icon: Coins },
  { id: 'governance', icon: Vote },
  { id: 'rewards', icon: Gift },
] as const;

type CategoryId = typeof FAQ_CATEGORIES[number]['id'];

// FAQ items per category
const FAQ_ITEMS: Record<CategoryId, string[]> = {
  general: ['what_is_token_hub', 'who_can_participate', 'is_it_safe'],
  locking: ['how_to_lock', 'minimum_amount', 'can_unlock_early', 'extend_lock'],
  veqs: ['what_is_veqs', 'how_calculated', 'why_decay', 'non_transferable'],
  governance: ['what_is_governance', 'how_to_vote', 'proposal_types', 'voting_power'],
  rewards: ['how_rewards_work', 'when_distributed', 'claim_process', 'reward_boost'],
};

interface FAQItemProps {
  id: string;
  category: CategoryId;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ id, category, isOpen, onToggle }: FAQItemProps) {
  const t = useTranslations('token-hub.faq');

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between py-4 px-4 text-left',
          'hover:bg-background-secondary transition-colors',
          'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset'
        )}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${category}-${id}`}
      >
        <span className="font-medium pr-4">{t(`items.${category}.${id}.question`)}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-foreground-tertiary flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={`faq-answer-${category}-${id}`}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
        role="region"
        aria-hidden={!isOpen}
      >
        <p className="px-4 text-foreground-secondary text-sm leading-relaxed">
          {t(`items.${category}.${id}.answer`)}
        </p>
      </div>
    </div>
  );
}

export function TokenHubFAQ() {
  const t = useTranslations('token-hub.faq');
  const tCommon = useTranslations('token-hub.common');

  const [activeCategory, setActiveCategory] = useState<CategoryId>('general');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const handleCategoryChange = useCallback((category: CategoryId) => {
    setActiveCategory(category);
    setOpenItems(new Set());
  }, []);

  const handleToggleItem = useCallback((itemId: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect - Gold Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <TokenHubHeader />

        {/* Breadcrumb */}
        <nav className="mb-6" aria-label={t('breadcrumb.ariaLabel')}>
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/token-hub/dashboard"
                className="text-foreground-tertiary hover:text-gold transition-colors"
              >
                {t('breadcrumb.dashboard')}
              </Link>
            </li>
            <li className="text-foreground-tertiary" aria-hidden="true">/</li>
            <li className="text-foreground" aria-current="page">
              {t('breadcrumb.current')}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-4">
            <HelpCircle className="w-4 h-4 text-gold" aria-hidden="true" />
            <span className="text-sm font-medium text-gold">{t('badge')}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('description')}</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div
            className="flex flex-wrap justify-center gap-2"
            role="tablist"
            aria-label={t('categories.ariaLabel')}
          >
            {FAQ_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                    'transition-all duration-200',
                    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    activeCategory === category.id
                      ? 'bg-gold text-background'
                      : 'bg-background-secondary text-foreground-secondary hover:text-foreground hover:bg-background-secondary/80'
                  )}
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  aria-controls={`faq-panel-${category.id}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {t(`categories.${category.id}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Content */}
        <Card padding="none" className="overflow-hidden mb-8">
          <div
            id={`faq-panel-${activeCategory}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeCategory}`}
          >
            {FAQ_ITEMS[activeCategory].map((itemId) => (
              <FAQItem
                key={itemId}
                id={itemId}
                category={activeCategory}
                isOpen={openItems.has(itemId)}
                onToggle={() => handleToggleItem(itemId)}
              />
            ))}
          </div>
        </Card>

        {/* Important Notice */}
        <div
          className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl mb-8"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">{t('notice.title')}</p>
            <p className="text-sm text-foreground-secondary">{t('notice.description')}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Link
            href="/token-hub/onboarding"
            className={cn(
              'flex items-center gap-3 p-4 bg-background-secondary border border-border rounded-xl',
              'hover:border-gold transition-all duration-200',
              'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
          >
            <TrendingUp className="w-5 h-5 text-gold" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-medium">{t('quickLinks.onboarding')}</div>
              <div className="text-xs text-foreground-tertiary">{t('quickLinks.onboardingDesc')}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
          </Link>

          <Link
            href="/token-hub/lock"
            className={cn(
              'flex items-center gap-3 p-4 bg-background-secondary border border-border rounded-xl',
              'hover:border-gold transition-all duration-200',
              'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
          >
            <Lock className="w-5 h-5 text-gold" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-medium">{t('quickLinks.lock')}</div>
              <div className="text-xs text-foreground-tertiary">{t('quickLinks.lockDesc')}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
          </Link>

          <Link
            href="/token-hub/get-qs"
            className={cn(
              'flex items-center gap-3 p-4 bg-background-secondary border border-border rounded-xl',
              'hover:border-gold transition-all duration-200',
              'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
          >
            <Coins className="w-5 h-5 text-gold" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-medium">{t('quickLinks.getQS')}</div>
              <div className="text-xs text-foreground-tertiary">{t('quickLinks.getQSDesc')}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
          </Link>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-border">
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4" aria-label={tCommon('footer.navLabel')}>
            <Link
              href="/consumer/terms"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.terms')}
            </Link>
            <Link
              href="/consumer/privacy"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.privacy')}
            </Link>
            <Link
              href="/consumer/help"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.security')}
            </Link>
          </nav>
          <p className="text-xs text-foreground-tertiary text-center max-w-lg mx-auto leading-relaxed">
            {tCommon('footer.disclaimer')}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default TokenHubFAQ;
