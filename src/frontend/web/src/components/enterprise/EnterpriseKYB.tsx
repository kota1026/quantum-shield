'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Building2,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocumentUpload {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  fileName?: string;
}

export function EnterpriseKYB() {
  const t = useTranslations('enterprise.kyb');
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      id: 'registration',
      name: t('documents.registration.name'),
      description: t('documents.registration.description'),
      required: true,
      status: 'pending',
    },
    {
      id: 'incorporation',
      name: t('documents.incorporation.name'),
      description: t('documents.incorporation.description'),
      required: true,
      status: 'pending',
    },
    {
      id: 'financials',
      name: t('documents.financials.name'),
      description: t('documents.financials.description'),
      required: true,
      status: 'pending',
    },
    {
      id: 'compliance',
      name: t('documents.compliance.name'),
      description: t('documents.compliance.description'),
      required: false,
      status: 'pending',
    },
    {
      id: 'representative',
      name: t('documents.representative.name'),
      description: t('documents.representative.description'),
      required: true,
      status: 'pending',
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">{t('status.pending')}</Badge>;
      case 'uploaded':
        return <Badge variant="warning">{t('status.uploaded')}</Badge>;
      case 'verified':
        return <Badge variant="success">{t('status.verified')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('status.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const handleUpload = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? { ...doc, status: 'uploaded', fileName: 'document.pdf' }
          : doc
      )
    );
  };

  const uploadedCount = documents.filter((d) => d.status !== 'pending').length;
  const requiredCount = documents.filter((d) => d.required).length;
  const uploadedRequiredCount = documents.filter(
    (d) => d.required && d.status !== 'pending'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <Link href="/enterprise/landing" className="hover:text-foreground">
              Enterprise
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/enterprise/apply" className="hover:text-foreground">
              {t('breadcrumb.apply')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{t('breadcrumb.kyb')}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                  <FileText className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {uploadedCount} / {documents.length} {t('progress.uploaded')}
                  </div>
                  <div className="text-sm text-foreground-secondary">
                    {uploadedRequiredCount} / {requiredCount} {t('progress.required')}
                  </div>
                </div>
              </div>
              <div className="w-48">
                <div className="h-2 overflow-hidden rounded-full bg-background-tertiary">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${(uploadedCount / documents.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('documentsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    'rounded-lg border p-4',
                    doc.status === 'rejected'
                      ? 'border-danger/50 bg-danger/5'
                      : doc.status === 'verified'
                        ? 'border-success/50 bg-success/5'
                        : 'border-surface-tertiary bg-background-secondary'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{doc.name}</span>
                        {doc.required && (
                          <Badge variant="danger" size="sm">
                            {t('required')}
                          </Badge>
                        )}
                        {getStatusBadge(doc.status)}
                      </div>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        {doc.description}
                      </p>
                      {doc.fileName && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-foreground-tertiary">
                          <FileText className="h-4 w-4" />
                          <span>{doc.fileName}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {doc.status === 'pending' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Upload className="h-4 w-4" />}
                          onClick={() => handleUpload(doc.id)}
                        >
                          {t('uploadButton')}
                        </Button>
                      ) : doc.status === 'uploaded' ? (
                        <div className="flex items-center gap-2 text-sm text-warning">
                          <AlertCircle className="h-4 w-4" />
                          {t('reviewPending')}
                        </div>
                      ) : doc.status === 'verified' ? (
                        <div className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle className="h-4 w-4" />
                          {t('verified')}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Upload className="h-4 w-4" />}
                          onClick={() => handleUpload(doc.id)}
                        >
                          {t('reuploadButton')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-8">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Shield className="h-5 w-5 text-info" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{t('securityNote.title')}</h3>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {t('securityNote.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/enterprise/apply/plan">{t('navigation.back')}</Link>
          </Button>
          <Button
            disabled={uploadedRequiredCount < requiredCount}
            onClick={() => router.push('/enterprise/contract')}
          >
            {t('navigation.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
