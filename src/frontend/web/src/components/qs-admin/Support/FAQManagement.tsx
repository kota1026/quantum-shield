'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HelpCircle,
  Search,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useFAQCategories } from '@/hooks/admin/useSupport';
import { MOCK_FAQ_CATEGORIES, type FAQCategory } from '@/lib/api/admin/mock';

// Fallback data
const FALLBACK_FAQ_CATEGORIES = MOCK_FAQ_CATEGORIES;

// Loading Skeleton
function FAQManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div>
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <div className="h-10 bg-surface rounded animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-12 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Error State
function FAQManagementError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FAQManagement() {
  const t = useTranslations('qsAdmin.support');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['getting-started']);

  // Fetch data using hooks
  const { data: categoriesData, isLoading, error, refetch } = useFAQCategories();

  // Use API data with fallback
  const faqCategories = categoriesData?.categories ?? FALLBACK_FAQ_CATEGORIES;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0);

  if (isLoading) {
    return <FAQManagementSkeleton />;
  }

  if (error && !categoriesData) {
    return <FAQManagementError onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/support">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('faqTitle')}</h1>
            <p className="text-foreground-secondary">{t('faqSubtitle')}</p>
          </div>
        </div>
        <Button className="bg-gradient-hinomaru">
          <Plus className="h-4 w-4 mr-2" />
          {tCommon('create')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
        <Input
          type="text"
          placeholder={tCommon('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-hinomaru" />
                  {category.name}
                  <span className="ml-2 text-sm font-normal text-foreground-tertiary">
                    ({category.faqs.length})
                  </span>
                </CardTitle>
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="h-5 w-5 text-foreground-tertiary" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-foreground-tertiary" />
                )}
              </div>
            </CardHeader>
            {expandedCategories.includes(category.id) && (
              <CardContent>
                <div className="space-y-4">
                  {category.faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-4 rounded-lg border border-border hover:border-hinomaru/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{faq.question}</h4>
                          <p className="text-sm text-foreground-secondary mt-2 line-clamp-2">
                            {faq.answer}
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-xs text-foreground-tertiary">
                            <span>{faq.views.toLocaleString()} views</span>
                            <span>Updated: {faq.updated}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
