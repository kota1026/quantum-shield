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
  Mail,
  Globe,
  Cpu,
  Wifi,
  Timer,
  Download,
  Copy,
  AlertTriangle,
  PlayCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useProverRequestDetail } from '@/hooks/admin/useProvers';
import type { ProverRequestDetailData } from '@/lib/api/admin/mock';

type ReviewStep = 'idle' | 'start_review' | 'confirm_approve' | 'confirm_reject';

interface ProverRequestDetailProps {
  id: string;
}

// Fallback data - Used when API is unavailable
const FALLBACK_REQUEST: ProverRequestDetailData = {
  id: 'PR-001',
  applicant: 'Prover Alpha Corp',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  stakeAmount: '10,000 QS',
  tier: 'enterprise',
  submittedAt: '2024-01-27 10:00',
  status: 'pending',
  infrastructure: 'AWS Tokyo',
  contactEmail: 'admin@proveralpha.com',
  website: 'https://proveralpha.com',
  hardwareSpecs: '64 vCPU, 256GB RAM, 4TB NVMe SSD',
  networkBandwidth: '10 Gbps dedicated',
  expectedUptime: '99.99%',
  documents: [
    { name: 'Company Registration', type: 'pdf', size: '1.2 MB' },
    { name: 'Technical Whitepaper', type: 'pdf', size: '3.5 MB' },
    { name: 'Infrastructure Audit Report', type: 'pdf', size: '2.1 MB' },
    { name: 'Security Certification', type: 'pdf', size: '850 KB' },
    { name: 'Team Credentials', type: 'pdf', size: '1.8 MB' },
  ],
  reviewHistory: [
    { action: 'Application submitted', timestamp: '2024-01-27 10:00', user: 'Applicant' },
  ],
};

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

  // React Query hook
  const requestQuery = useProverRequestDetail(id);

  // Map API data to component format
  const mapApiData = (data: unknown): ProverRequestDetailData => {
    if (!data || typeof data !== 'object') return { ...FALLBACK_REQUEST, id };
    const d = data as Record<string, unknown>;
    return {
      id: (d.id as string) || id,
      applicant: (d.applicant as string) || (d.organizationName as string) || FALLBACK_REQUEST.applicant,
      wallet: (d.wallet as string) || (d.applicantAddress as string) || FALLBACK_REQUEST.wallet,
      stakeAmount: (d.stakeAmount as string) || FALLBACK_REQUEST.stakeAmount,
      tier: (d.tier as string) || FALLBACK_REQUEST.tier,
      submittedAt: (d.submittedAt as string) || (typeof d.submittedAt === 'number' ? new Date(d.submittedAt).toLocaleString('ja-JP') : FALLBACK_REQUEST.submittedAt),
      status: (d.status as string) || FALLBACK_REQUEST.status,
      infrastructure: (d.infrastructure as string) || FALLBACK_REQUEST.infrastructure,
      contactEmail: (d.contactEmail as string) || FALLBACK_REQUEST.contactEmail,
      website: (d.website as string) || FALLBACK_REQUEST.website,
      hardwareSpecs: (d.hardwareSpecs as string) || FALLBACK_REQUEST.hardwareSpecs,
      networkBandwidth: (d.networkBandwidth as string) || FALLBACK_REQUEST.networkBandwidth,
      expectedUptime: (d.expectedUptime as string) || FALLBACK_REQUEST.expectedUptime,
      documents: (d.documents as ProverRequestDetailData['documents']) || FALLBACK_REQUEST.documents,
      reviewHistory: (d.reviewHistory as ProverRequestDetailData['reviewHistory']) || FALLBACK_REQUEST.reviewHistory,
    };
  };

  // Use API data or fallback
  const apiRequest = requestQuery.data ? mapApiData(requestQuery.data) : { ...FALLBACK_REQUEST, id };
  const request = { ...apiRequest, status: currentStatus ?? apiRequest.status };

  // Initialize currentStatus from API data when it loads
  if (currentStatus === null && requestQuery.data) {
    setCurrentStatus(apiRequest.status);
  }

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

  const handleStartReview = () => {
    setCurrentStatus('under_review');
    setReviewStep('idle');
  };

  const handleApprove = () => {
    setCurrentStatus('approved');
    setReviewStep('idle');
  };

  const handleReject = () => {
    if (!comment.trim()) {
      return; // Prevent rejection without reason
    }
    setCurrentStatus('rejected');
    setReviewStep('idle');
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

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.contactEmail')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-foreground-tertiary" />
                    <span>{request.contactEmail}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.website')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Globe className="h-4 w-4 text-foreground-tertiary" />
                    <a href={request.website} target="_blank" rel="noopener noreferrer" className="text-hinomaru hover:underline">
                      {request.website}
                    </a>
                  </div>
                </div>
              </div>

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
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.expectedUptime')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Timer className="h-4 w-4 text-success" />
                    <span className="font-medium text-success">{request.expectedUptime}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary">{t('detail.hardwareSpecs')}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Cpu className="h-4 w-4 text-foreground-tertiary" />
                  <span>{request.hardwareSpecs}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary">{t('detail.networkBandwidth')}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Wifi className="h-4 w-4 text-foreground-tertiary" />
                  <span>{request.networkBandwidth}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.documents')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-hinomaru" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-foreground-secondary">{doc.type.toUpperCase()} • {doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
          {/* Review History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.reviewHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.reviewHistory.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="h-2 w-2 rounded-full bg-hinomaru mt-2" />
                    <div>
                      <p className="font-medium text-sm">{event.action}</p>
                      <p className="text-xs text-foreground-secondary">{event.timestamp}</p>
                      <p className="text-xs text-foreground-tertiary">{event.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submission Info */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.submittedAt')}</p>
                  <p className="font-medium">{request.submittedAt}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.documents')}</p>
                  <p className="font-medium">{request.documents.length} {t('table.documents')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
