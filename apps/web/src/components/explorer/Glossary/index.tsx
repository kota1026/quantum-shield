'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Shield,
  Lock,
  Unlock,
  Users,
  Eye,
  Vote,
  Coins,
  AlertTriangle,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

// Glossary terms organized by category
const GLOSSARY_TERMS = [
  {
    category: 'core',
    terms: [
      { id: 'quantum-shield', icon: Shield },
      { id: 'dilithium', icon: Zap },
      { id: 'stark-proof', icon: Shield },
      { id: 'post-quantum', icon: Lock },
    ],
  },
  {
    category: 'locking',
    terms: [
      { id: 'lock', icon: Lock },
      { id: 'unlock', icon: Unlock },
      { id: 'emergency-unlock', icon: AlertTriangle },
      { id: 'waiting-period', icon: Clock },
      { id: 'veqs', icon: Coins },
    ],
  },
  {
    category: 'roles',
    terms: [
      { id: 'prover', icon: Users },
      { id: 'observer', icon: Eye },
      { id: 'challenger', icon: AlertTriangle },
      { id: 'delegate', icon: Vote },
    ],
  },
  {
    category: 'governance',
    terms: [
      { id: 'proposal', icon: Vote },
      { id: 'quorum', icon: Users },
      { id: 'council', icon: Shield },
      { id: 'epoch', icon: Clock },
    ],
  },
  {
    category: 'security',
    terms: [
      { id: 'challenge', icon: AlertTriangle },
      { id: 'slashing', icon: AlertTriangle },
      { id: 'stake', icon: Lock },
      { id: 'bond', icon: Coins },
    ],
  },
];

export function ExplorerGlossary() {
  const t = useTranslations('explorer.glossary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    return GLOSSARY_TERMS.map((cat) => cat.category);
  }, []);

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.map((category) => ({
      ...category,
      terms: category.terms.filter((term) => {
        const matchesSearch =
          searchQuery === '' ||
          t(`terms.${term.id}.name`).toLowerCase().includes(searchQuery.toLowerCase()) ||
          t(`terms.${term.id}.definition`).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || category.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    })).filter((category) => category.terms.length > 0);
  }, [searchQuery, selectedCategory, t]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      <main className="relative z-10 max-w-[1000px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/explorer/overview"
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToExplorer')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-sm font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-wider">EXPLORER</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={cn(
                'w-full pl-12 pr-4 py-3 rounded-xl',
                'bg-surface border border-border',
                'focus:border-gold focus:ring-1 focus:ring-gold',
                'transition-colors'
              )}
              aria-label={t('searchAriaLabel')}
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label={t('categoriesAriaLabel')}>
            <button
              onClick={() => setSelectedCategory(null)}
              role="tab"
              aria-selected={selectedCategory === null}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedCategory === null
                  ? 'bg-gold text-background'
                  : 'bg-surface text-foreground-secondary hover:text-foreground'
              )}
            >
              {t('categories.all')}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                role="tab"
                aria-selected={selectedCategory === category}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-gold text-background'
                    : 'bg-surface text-foreground-secondary hover:text-foreground'
                )}
              >
                {t(`categories.${category}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Terms List */}
        <div className="space-y-8">
          {filteredTerms.map((category) => (
            <section key={category.category} aria-labelledby={`category-${category.category}`}>
              <h2
                id={`category-${category.category}`}
                className="text-lg font-semibold mb-4 text-gold"
              >
                {t(`categories.${category.category}`)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {category.terms.map((term) => {
                  const Icon = term.icon;
                  return (
                    <Card
                      key={term.id}
                      className="p-5 hover:border-gold/30 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-gold" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{t(`terms.${term.id}.name`)}</h3>
                          <p className="text-sm text-foreground-secondary">
                            {t(`terms.${term.id}.definition`)}
                          </p>
                          {t.raw(`terms.${term.id}.example`) && (
                            <p className="text-xs text-foreground-tertiary mt-2 italic">
                              {t(`terms.${term.id}.example`)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Empty State */}
        {filteredTerms.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-sm text-foreground-secondary">{t('empty.description')}</p>
          </Card>
        )}
      </main>
    </div>
  );
}

export default ExplorerGlossary;
