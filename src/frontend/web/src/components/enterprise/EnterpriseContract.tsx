'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  FileText,
  Check,
  Download,
  Shield,
  Clock,
  AlertTriangle,
  Pen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContractDocument {
  id: string;
  name: string;
  description: string;
  version: string;
  lastUpdated: string;
  required: boolean;
  accepted: boolean;
}

export function EnterpriseContract() {
  const t = useTranslations('enterprise.contract');
  const router = useRouter();

  const [documents, setDocuments] = useState<ContractDocument[]>([
    {
      id: 'msa',
      name: t('documents.msa.name'),
      description: t('documents.msa.description'),
      version: 'v2.1',
      lastUpdated: '2025-12-01',
      required: true,
      accepted: false,
    },
    {
      id: 'sla',
      name: t('documents.sla.name'),
      description: t('documents.sla.description'),
      version: 'v1.5',
      lastUpdated: '2025-11-15',
      required: true,
      accepted: false,
    },
    {
      id: 'dpa',
      name: t('documents.dpa.name'),
      description: t('documents.dpa.description'),
      version: 'v1.3',
      lastUpdated: '2025-10-01',
      required: true,
      accepted: false,
    },
    {
      id: 'nda',
      name: t('documents.nda.name'),
      description: t('documents.nda.description'),
      version: 'v1.0',
      lastUpdated: '2025-09-01',
      required: false,
      accepted: false,
    },
  ]);

  const [allAccepted, setAllAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureTitle, setSignatureTitle] = useState('');

  const handleAcceptDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, accepted: !doc.accepted } : doc
      )
    );
  };

  const handleAcceptAll = () => {
    const newState = !allAccepted;
    setAllAccepted(newState);
    setDocuments((prev) =>
      prev.map((doc) => ({ ...doc, accepted: newState }))
    );
  };

  const requiredDocuments = documents.filter((d) => d.required);
  const allRequiredAccepted = requiredDocuments.every((d) => d.accepted);
  const canSign = allRequiredAccepted && signatureName.trim() && signatureTitle.trim();

  const contractInfo = {
    plan: t('info.plan'),
    planValue: 'Business',
    term: t('info.term'),
    termValue: t('info.termValue'),
    startDate: t('info.startDate'),
    startDateValue: '2026-02-01',
    fee: t('info.fee'),
    feeValue: '$8,000/月',
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8" role="main" aria-label={t('ariaLabel')}>
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-foreground-tertiary" aria-label="Breadcrumb">
          <Link href="/enterprise/landing" className="hover:text-foreground">
            Enterprise
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <Link href="/enterprise/apply" className="hover:text-foreground">
            {t('breadcrumb.apply')}
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="text-foreground">{t('breadcrumb.contract')}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Contract Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-gold" aria-hidden="true" />
              {t('summary.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <div className="text-xs text-foreground-tertiary">{contractInfo.plan}</div>
                <div className="font-medium text-foreground">{contractInfo.planValue}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-tertiary">{contractInfo.term}</div>
                <div className="font-medium text-foreground">{contractInfo.termValue}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-tertiary">{contractInfo.startDate}</div>
                <div className="font-medium text-foreground">{contractInfo.startDateValue}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-tertiary">{contractInfo.fee}</div>
                <div className="font-medium text-gold">{contractInfo.feeValue}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('documentsTitle')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAcceptAll}
              className="text-sm"
            >
              {allAccepted ? t('unselectAll') : t('selectAll')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4 transition-all',
                    doc.accepted
                      ? 'border-success/30 bg-success/5'
                      : 'border-surface-tertiary bg-background-secondary'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleAcceptDocument(doc.id)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded border transition-all',
                        doc.accepted
                          ? 'border-success bg-success text-white'
                          : 'border-surface-tertiary bg-background hover:border-foreground-tertiary'
                      )}
                      aria-label={doc.accepted ? t('unaccept') : t('accept')}
                    >
                      {doc.accepted && <Check className="h-4 w-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{doc.name}</span>
                        {doc.required && (
                          <Badge variant="warning" size="sm">{t('required')}</Badge>
                        )}
                        <Badge variant="default" size="sm">{doc.version}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-foreground-secondary">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" leftIcon={<FileText className="h-4 w-4" />}>
                      {t('view')}
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                      {t('download')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="flex gap-4 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <h4 className="font-medium text-foreground">{t('notes.title')}</h4>
              <ul className="mt-2 space-y-1 text-sm text-foreground-secondary">
                <li>• {t('notes.item1')}</li>
                <li>• {t('notes.item2')}</li>
                <li>• {t('notes.item3')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Electronic Signature */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pen className="h-5 w-5 text-gold" aria-hidden="true" />
              {t('signature.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('signature.name')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                  placeholder={t('signature.namePlaceholder')}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('signature.title')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={signatureTitle}
                  onChange={(e) => setSignatureTitle(e.target.value)}
                  className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                  placeholder={t('signature.titlePlaceholder')}
                />
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-surface-tertiary p-6 text-center">
              <div className="text-foreground-tertiary">
                {signatureName ? (
                  <div className="font-signature text-2xl text-foreground">{signatureName}</div>
                ) : (
                  t('signature.preview')
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/enterprise/apply/kyb">{t('navigation.back')}</Link>
          </Button>
          <Button
            disabled={!canSign}
            leftIcon={<Check className="h-4 w-4" />}
            onClick={() => router.push('/enterprise/onboarding')}
          >
            {t('navigation.sign')}
          </Button>
        </div>
      </main>
    </div>
  );
}
