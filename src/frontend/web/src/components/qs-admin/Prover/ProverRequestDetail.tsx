'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Coins,
  Server,
  Copy,
  AlertTriangle,
  PlayCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { useProverRequestDetail, useUpdateProverStatus } from '@/hooks/admin/useProvers';
import { Download, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin/client';

type ReviewStep = 'idle' | 'start_review' | 'confirm_approve' | 'confirm_reject';

interface ProverRequestDetailProps {
  id: string;
}

// API response type - matches what the backend actually returns
interface ProverRequestApiData {
  id: string;
  organizationName?: string;
  applicantAddress?: string;
  applicant?: string;
  wallet?: string;
  tier: string;
  stakeAmount: string;
  infrastructure: string;
  documents?: number;
  submittedAt: number; // Unix timestamp in seconds
  status: string;
  // Extended fields from application form
  country?: string;
  website?: string;
  contactEmail?: string;
  validatorExperience?: string;
  hsmProvider?: string;
  infrastructureLocation?: string;
  businessRegistrationNumber?: string;
}

// Loading skeleton component
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-muted rounded-full w-24 animate-pulse" />
          <div className="h-8 bg-muted rounded-full w-24 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-muted rounded animate-pulse" />
                <div className="h-20 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-40 animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              <div className="h-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-danger/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <span className="text-danger">{message}</span>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  under_review: { icon: Eye, color: 'text-info', bg: 'bg-info/10' },
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
};

const TIER_CONFIG = {
  standard: { color: 'text-foreground-tertiary', bg: 'bg-foreground-tertiary/10' },
  professional: { color: 'text-info', bg: 'bg-info/10' },
  enterprise: { color: 'text-gold', bg: 'bg-gold/10' },
};

export function ProverRequestDetail({ id }: ProverRequestDetailProps) {
  const t = useTranslations('qsAdmin.prover');
  const tCommon = useTranslations('qsAdmin.common');
  const [comment, setComment] = useState('');
  const [reviewStep, setReviewStep] = useState<ReviewStep>('idle');
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  // Document state
  interface DocumentItem {
    docId: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
  }
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // React Query hooks
  const requestQuery = useProverRequestDetail(id);
  const updateStatusMutation = useUpdateProverStatus(id);

  // Map API data to component format - only use real data from API
  const mapApiData = (data: unknown): ProverRequestApiData | null => {
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    return {
      id: (d.id as string) || id,
      organizationName: d.organizationName as string | undefined,
      applicantAddress: d.applicantAddress as string | undefined,
      applicant: d.applicant as string | undefined,
      wallet: d.wallet as string | undefined,
      tier: (d.tier as string) || 'standard',
      stakeAmount: (d.stakeAmount as string) || '0 QS',
      infrastructure: (d.infrastructure as string) || 'Unknown',
      documents: typeof d.documents === 'number' ? d.documents : undefined,
      submittedAt: typeof d.submittedAt === 'number' ? d.submittedAt : 0,
      status: (d.status as string) || 'pending',
      // Extended fields from application form
      country: d.country as string | undefined,
      website: d.website as string | undefined,
      contactEmail: d.contactEmail as string | undefined,
      validatorExperience: d.validatorExperience as string | undefined,
      hsmProvider: d.hsmProvider as string | undefined,
      infrastructureLocation: d.infrastructureLocation as string | undefined,
      businessRegistrationNumber: d.businessRegistrationNumber as string | undefined,
    };
  };

  // Use API data
  const apiData = requestQuery.data ? mapApiData(requestQuery.data) : null;

  // Derive display values from API data
  const request = {
    id: apiData?.id || id,
    applicant: apiData?.applicant || apiData?.organizationName || `Prover ${id.slice(0, 8)}`,
    wallet: apiData?.wallet || apiData?.applicantAddress || '',
    tier: apiData?.tier || 'standard',
    stakeAmount: apiData?.stakeAmount || '0 QS',
    infrastructure: apiData?.infrastructure || apiData?.infrastructureLocation || 'Unknown',
    documentCount: apiData?.documents ?? 0,
    submittedAt: apiData?.submittedAt ? new Date(apiData.submittedAt * 1000).toLocaleString('ja-JP') : '-',
    status: currentStatus ?? apiData?.status ?? 'pending',
    // Extended fields (filter out empty strings)
    country: apiData?.country || undefined,
    website: apiData?.website || undefined,
    contactEmail: apiData?.contactEmail || undefined,
    validatorExperience: apiData?.validatorExperience || undefined,
    hsmProvider: apiData?.hsmProvider || undefined,
    businessRegistrationNumber: apiData?.businessRegistrationNumber || undefined,
  };

  // Initialize currentStatus from API data when it loads
  if (currentStatus === null && apiData) {
    setCurrentStatus(apiData.status);
  }

  // Fetch actual documents from API
  const fetchDocuments = useCallback(async () => {
    if (!id) return;
    setDocsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiBase}/v1/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.warn('Failed to fetch documents:', err);
    } finally {
      setDocsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadingId(doc.docId);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const token = adminApi.getAccessToken();
      if (!token) {
        alert(t('documents.loginRequired') || 'Please log in to download documents');
        return;
      }
      const res = await fetch(`${apiBase}/api/admin/documents/${doc.docId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        alert(t('documents.sessionExpired') || 'Session expired. Please log in again.');
        return;
      }
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Show loading skeleton only for initial load
  if (requestQuery.isLoading && !requestQuery.data) {
    return <DetailSkeleton />;
  }

  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
  const tierConfig = TIER_CONFIG[request.tier as keyof typeof TIER_CONFIG];
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleStartReview = async () => {
    try {
      await updateStatusMutation.mutateAsync({ status: 'under_review', comment });
      setCurrentStatus('under_review');
      setReviewStep('idle');
    } catch (error) {
      console.error('Failed to start review:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await updateStatusMutation.mutateAsync({ status: 'approved', comment });
      setCurrentStatus('approved');
      setReviewStep('idle');
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      return; // Prevent rejection without reason
    }
    try {
      await updateStatusMutation.mutateAsync({ status: 'rejected', comment });
      setCurrentStatus('rejected');
      setReviewStep('idle');
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/prover/requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', statusConfig.bg)}>
              <Server className={cn('h-6 w-6', statusConfig.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('detail.title')}</h1>
              <p className="text-foreground-secondary">{request.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium', statusConfig.bg, statusConfig.color)}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {t(`status.${request.status}`)}
          </span>
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize', tierConfig.bg, tierConfig.color)}>
            {t(`tier.${request.tier}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.applicantInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.companyName')}</p>
                  <p className="font-medium mt-1">{request.applicant}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.tier')}</p>
                  <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize mt-1', tierConfig.bg, tierConfig.color)}>
                    {t(`tier.${request.tier}`)}
                  </span>
                </div>
              </div>

              {/* Country & Contact Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                {request.country && (
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('detail.country')}</p>
                    <p className="font-medium mt-1">{request.country}</p>
                  </div>
                )}
                {request.contactEmail && (
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('detail.contactEmail')}</p>
                    <p className="font-medium mt-1">{request.contactEmail}</p>
                  </div>
                )}
              </div>

              {request.website && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-foreground-secondary">{t('detail.website')}</p>
                  <a href={request.website} target="_blank" rel="noopener noreferrer" className="text-hinomaru hover:underline mt-1 inline-block">
                    {request.website}
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary mb-2">{t('table.wallet')}</p>
                <div className="flex items-center space-x-2">
                  <code className="font-mono text-sm bg-surface px-3 py-2 rounded-lg flex-1">{request.wallet}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(request.wallet)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Business Registration (if available) */}
              {request.businessRegistrationNumber && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-foreground-secondary">{t('detail.businessRegistrationNumber')}</p>
                  <p className="font-medium mt-1">{request.businessRegistrationNumber}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary">{t('detail.stakeAmount')}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Coins className="h-5 w-5 text-gold" />
                  <span className="text-xl font-bold">{request.stakeAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.technicalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.infrastructure')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Server className="h-4 w-4 text-foreground-tertiary" />
                    <span className="font-medium">{request.infrastructure}</span>
                  </div>
                </div>
                {request.hsmProvider && (
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('detail.hsmProvider')}</p>
                    <span className="font-medium mt-1 inline-block">{request.hsmProvider}</span>
                  </div>
                )}
              </div>
              {request.validatorExperience && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-foreground-secondary">{t('detail.validatorExperience')}</p>
                  <p className="mt-1 text-foreground">{request.validatorExperience}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.documents')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {docsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-foreground-tertiary" />
                </div>
              ) : documents.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.docId} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div className="flex items-center space-x-3 min-w-0">
                          <FileText className="h-5 w-5 text-hinomaru flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{doc.fileName}</p>
                            <p className="text-xs text-foreground-secondary">
                              {(doc.fileSize / 1024).toFixed(0)} KB
                              {' · '}
                              {new Date(doc.uploadedAt).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.docId}
                          className="flex-shrink-0"
                        >
                          {downloadingId === doc.docId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-foreground-tertiary">
                    {t('detail.documentsCount', { count: documents.length })}
                  </p>
                </>
              ) : request.documentCount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 bg-surface rounded-lg">
                    <FileText className="h-5 w-5 text-foreground-tertiary" />
                    <p className="text-sm text-foreground-secondary">
                      {t('detail.documentsCount', { count: request.documentCount })}
                      {' '}({t('detail.noDownloadAvailable')})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-surface rounded-lg">
                  <FileText className="h-5 w-5 text-foreground-tertiary" />
                  <p className="text-sm text-foreground-secondary">{t('detail.noDocuments')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Actions */}
          {request.status === 'pending' && reviewStep === 'idle' && (
            <Card className="border-warning">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-warning" />
                    <div>
                      <p className="font-medium">{t('detail.pendingReview')}</p>
                      <p className="text-sm text-foreground-secondary">{t('detail.pendingReviewDesc')}</p>
                    </div>
                  </div>
                  <Button
                    className="bg-gradient-hinomaru"
                    onClick={() => setReviewStep('start_review')}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {t('actions.startReview')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Review Confirmation */}
          {reviewStep === 'start_review' && (
            <Card className="border-info">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-info" />
                  {t('detail.startReviewTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground-secondary">{t('detail.startReviewDesc')}</p>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setReviewStep('idle')}>
                    {tCommon('cancel')}
                  </Button>
                  <Button className="bg-info hover:bg-info/90" onClick={handleStartReview}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('actions.startReview')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Actions - Under Review */}
          {request.status === 'under_review' && reviewStep === 'idle' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('detail.reviewDecision')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('detail.commentPlaceholder')}
                  rows={3}
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    className="text-danger border-danger hover:bg-danger/10"
                    onClick={() => setReviewStep('confirm_reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('actions.reject')}
                  </Button>
                  <Button
                    className="bg-gradient-hinomaru"
                    onClick={() => setReviewStep('confirm_approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('actions.approve')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirm Approve */}
          {reviewStep === 'confirm_approve' && (
            <Card className="border-success">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center text-success">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {t('detail.confirmApproveTitle')}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setReviewStep('idle')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-success/10 p-4 rounded-lg">
                  <p className="text-sm">{t('detail.confirmApproveDesc')}</p>
                  <ul className="mt-2 text-sm text-foreground-secondary list-disc list-inside space-y-1">
                    <li>{t('detail.approveEffect1')}</li>
                    <li>{t('detail.approveEffect2')}</li>
                    <li>{t('detail.approveEffect3')}</li>
                  </ul>
                </div>
                {comment && (
                  <div>
                    <p className="text-sm text-foreground-secondary mb-1">{t('detail.approvalComment')}</p>
                    <p className="text-sm bg-surface p-2 rounded">{comment}</p>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setReviewStep('idle')}>
                    {tCommon('cancel')}
                  </Button>
                  <Button className="bg-success hover:bg-success/90 text-white" onClick={handleApprove}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('actions.confirmApprove')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirm Reject */}
          {reviewStep === 'confirm_reject' && (
            <Card className="border-danger">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center text-danger">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {t('detail.confirmRejectTitle')}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setReviewStep('idle')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-danger/10 p-4 rounded-lg">
                  <p className="text-sm">{t('detail.confirmRejectDesc')}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">
                    {t('detail.rejectReason')} <span className="text-danger">*</span>
                  </p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('detail.rejectReasonPlaceholder')}
                    rows={3}
                    className={cn(!comment.trim() && 'border-danger')}
                  />
                  {!comment.trim() && (
                    <p className="text-xs text-danger mt-1">{t('detail.rejectReasonRequired')}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setReviewStep('idle')}>
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    className="bg-danger hover:bg-danger/90 text-white"
                    onClick={handleReject}
                    disabled={!comment.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('actions.confirmReject')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approved Status */}
          {request.status === 'approved' && (
            <Card className="border-success bg-success/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <div>
                    <p className="font-medium text-success">{t('detail.approvedStatus')}</p>
                    <p className="text-sm text-foreground-secondary">{t('detail.approvedStatusDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejected Status */}
          {request.status === 'rejected' && (
            <Card className="border-danger bg-danger/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-6 w-6 text-danger" />
                  <div>
                    <p className="font-medium text-danger">{t('detail.rejectedStatus')}</p>
                    <p className="text-sm text-foreground-secondary">{comment || t('detail.rejectedStatusDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submission Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.submissionInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.submittedAt')}</p>
                  <p className="font-medium">{request.submittedAt}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.tier')}</p>
                  <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize mt-1', tierConfig.bg, tierConfig.color)}>
                    {t(`tier.${request.tier}`)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.documents')}</p>
                  <p className="font-medium">{request.documentCount} {t('detail.documentsUnit')}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.stakeAmount')}</p>
                  <p className="font-medium">{request.stakeAmount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
