'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  FileText,
  ChevronRight,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  FolderOpen,
  File,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Mock data
const mockDocumentsData = {
  overview: {
    totalDocuments: '156',
    categories: '8',
    recentUpdates: '12',
    pendingReviews: '3',
  },
  categories: [
    { id: 'technical', name: '技術ドキュメント', count: 45 },
    { id: 'api', name: 'API仕様書', count: 28 },
    { id: 'integration', name: '連携ガイド', count: 22 },
    { id: 'security', name: 'セキュリティ', count: 18 },
    { id: 'compliance', name: 'コンプライアンス', count: 15 },
    { id: 'operations', name: '運用マニュアル', count: 12 },
    { id: 'training', name: 'トレーニング教材', count: 10 },
    { id: 'release', name: 'リリースノート', count: 6 },
  ],
  documents: [
    {
      id: 'doc-001',
      title: 'Quantum Shield 技術概要',
      category: 'technical',
      version: 'v2.1.0',
      status: 'published',
      lastUpdated: '2026-01-15',
      downloadCount: 245,
    },
    {
      id: 'doc-002',
      title: 'Prover API リファレンス',
      category: 'api',
      version: 'v3.0.0',
      status: 'published',
      lastUpdated: '2026-01-10',
      downloadCount: 189,
    },
    {
      id: 'doc-003',
      title: 'エンタープライズ連携ガイド',
      category: 'integration',
      version: 'v1.5.0',
      status: 'published',
      lastUpdated: '2026-01-08',
      downloadCount: 156,
    },
    {
      id: 'doc-004',
      title: 'セキュリティ監査レポートテンプレート',
      category: 'security',
      version: 'v1.2.0',
      status: 'draft',
      lastUpdated: '2026-01-17',
      downloadCount: 0,
    },
    {
      id: 'doc-005',
      title: 'コンプライアンス要件チェックリスト',
      category: 'compliance',
      version: 'v2.0.0',
      status: 'published',
      lastUpdated: '2026-01-05',
      downloadCount: 98,
    },
    {
      id: 'doc-006',
      title: '運用手順書 - 障害対応編',
      category: 'operations',
      version: 'v1.8.0',
      status: 'review',
      lastUpdated: '2026-01-16',
      downloadCount: 45,
    },
  ],
  recentActivity: [
    { action: 'ダウンロード', document: 'Prover API リファレンス', company: 'GFC Holdings', time: '10分前' },
    { action: '閲覧', document: '技術概要', company: 'ABG Bank', time: '25分前' },
    { action: 'ダウンロード', document: '連携ガイド', company: 'Crypto Trust', time: '1時間前' },
    { action: '閲覧', document: 'セキュリティ監査レポート', company: 'SecureVault', time: '2時間前' },
  ],
};

export function LicenseDocuments() {
  const t = useTranslations('admin.licenseDocuments');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">{t('status.published')}</Badge>;
      case 'draft':
        return <Badge variant="warning">{t('status.draft')}</Badge>;
      case 'review':
        return <Badge variant="gold">{t('status.review')}</Badge>;
      default:
        return null;
    }
  };

  const filteredDocuments = mockDocumentsData.documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/license/companies" className="hover:text-foreground">
                License
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.totalDocuments')}</div>
                  <div className="text-xl font-bold">{mockDocumentsData.overview.totalDocuments}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.categories')}</div>
                  <div className="text-xl font-bold">{mockDocumentsData.overview.categories}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.recentUpdates')}</div>
                  <div className="text-xl font-bold">{mockDocumentsData.overview.recentUpdates}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10 text-danger">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.pendingReviews')}</div>
                  <div className="text-xl font-bold">{mockDocumentsData.overview.pendingReviews}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Categories Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('categories.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      selectedCategory === 'all'
                        ? 'bg-gold text-background'
                        : 'hover:bg-background-secondary'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t('categories.all')}</span>
                      <Badge size="sm" variant={selectedCategory === 'all' ? 'gold' : 'default'}>
                        {mockDocumentsData.overview.totalDocuments}
                      </Badge>
                    </div>
                  </button>
                  {mockDocumentsData.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        selectedCategory === category.id
                          ? 'bg-gold text-background'
                          : 'hover:bg-background-secondary'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <Badge size="sm" variant={selectedCategory === category.id ? 'gold' : 'default'}>
                          {category.count}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document List */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('documentList.title')}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                      <input
                        type="text"
                        placeholder={t('documentList.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                      {t('documentList.filter')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
                            <File className="h-6 w-6 text-gold" />
                          </div>
                          <div>
                            <div className="font-medium">{doc.title}</div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-foreground-tertiary">
                              <span>{doc.version}</span>
                              <span>•</span>
                              <span>{doc.lastUpdated}</span>
                              <span>•</span>
                              <span>{doc.downloadCount} {t('documentList.downloads')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(doc.status)}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">{t('recentActivity.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockDocumentsData.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full',
                            activity.action === 'ダウンロード' ? 'bg-success/10' : 'bg-gold/10'
                          )}>
                            {activity.action === 'ダウンロード' ? (
                              <Download className="h-4 w-4 text-success" />
                            ) : (
                              <Eye className="h-4 w-4 text-gold" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">{activity.company}</span>
                              <span className="text-foreground-tertiary"> {t(`recentActivity.${activity.action === 'ダウンロード' ? 'downloaded' : 'viewed'}`)} </span>
                              <span className="text-gold">{activity.document}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-foreground-tertiary">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
