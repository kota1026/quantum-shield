'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  FileText,
  FileDown,
  Upload,
  X,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Swords,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { ProverSidebar } from './ProverSidebar';
import { cn } from '@/lib/utils';

// Mock data
const mockActiveChallenge = {
  id: 'CHG-2026-000123',
  applicant: 'Watcher #W-0042',
  date: '2026/01/17 10:15',
  violationType: 'invalidSignature',
  potentialSlashing: 40000,
  slashingRate: 10,
  timeRemaining: 23 * 3600 + 45 * 60 + 30,
  accusation: {
    requestId: 'REQ-789012',
    expectedLength: 7856,
    actualLength: 7854,
    errorCode: 'INVALID_SIGNATURE_LENGTH',
    verificationNodes: 3,
  },
  evidence: [
    { name: 'signature_log_REQ-789012.json', type: 'json' },
    { name: 'watcher_verification_report.pdf', type: 'pdf' },
  ],
};

const mockChallengeHistory = [
  { id: 'CHG-2026-000123', date: '2026/01/17', type: 'invalidSignature', status: 'pending', slashing: null },
  { id: 'CHG-2026-000122', date: '2026/02/15', type: 'timeout', status: 'won', slashing: 0 },
  { id: 'CHG-2026-000098', date: '2026/01/08', type: 'doubleSigning', status: 'won', slashing: 0 },
];

const mockUploadedFiles = [
  { name: 'server_logs_20260117.json' },
  { name: 'signature_generation_trace.txt' },
];

type TabType = 'notification' | 'defense' | 'result';

export function ProverChallenge() {
  const t = useTranslations('prover');
  const [activeTab, setActiveTab] = useState<TabType>('notification');
  const [timeRemaining, setTimeRemaining] = useState(mockActiveChallenge.timeRemaining);
  const [defenseText, setDefenseText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState(mockUploadedFiles);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles((files) => files.filter((_, i) => i !== index));
  };

  // Check if there's an active challenge
  const hasActiveChallenge = mockActiveChallenge !== null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <ProverSidebar activePage="challenges" />

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Premium Background Effect */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute -top-24 left-1/2 -translate-x-1/2',
              'w-[800px] h-[500px]',
              'bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)]',
              'opacity-50'
            )}
          />
        </div>

        <div className="relative z-10">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('challenge.title')}</h1>
              <p className="text-foreground-secondary mt-1">{t('challenge.description')}</p>
            </div>
          </div>

          {/* What is Challenge Explanation */}
          <Card className="p-5 mb-6 bg-gradient-to-r from-warning/5 to-transparent border-warning/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-warning" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('challenge.whatIsChallenge.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('challenge.whatIsChallenge.description')}</p>
              </div>
            </div>
          </Card>

          {/* Tab Navigation */}
          <div
            className="flex gap-1 mb-6 bg-background-secondary p-1 rounded-xl w-fit"
            role="tablist"
            aria-label={t('challenge.tabs')}
          >
            <button
              id="notification-tab"
              role="tab"
              aria-selected={activeTab === 'notification'}
              aria-controls="notification-panel"
              tabIndex={activeTab === 'notification' ? 0 : -1}
              onClick={() => setActiveTab('notification')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'notification' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t('challenge.tab.notification')}
              {hasActiveChallenge && (
                <Badge variant="danger" className="text-[11px] px-2 py-0.5">1</Badge>
              )}
            </button>
            <button
              id="defense-tab"
              role="tab"
              aria-selected={activeTab === 'defense'}
              aria-controls="defense-panel"
              tabIndex={activeTab === 'defense' ? 0 : -1}
              onClick={() => setActiveTab('defense')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'defense' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t('challenge.tab.defense')}
            </button>
            <button
              id="result-tab"
              role="tab"
              aria-selected={activeTab === 'result'}
              aria-controls="result-panel"
              tabIndex={activeTab === 'result' ? 0 : -1}
              onClick={() => setActiveTab('result')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'result' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              {t('challenge.tab.result')}
            </button>
          </div>

          {/* Notification Tab */}
          <div
            id="notification-panel"
            role="tabpanel"
            aria-labelledby="notification-tab"
            className={activeTab === 'notification' ? '' : 'hidden'}
          >
            {hasActiveChallenge ? (
              <>
                {/* Active Challenge Alert */}
                <Card className="p-6 mb-6 border-2 border-danger bg-gradient-to-br from-danger/10 to-transparent">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center">
                        <Swords className="h-8 w-8 text-danger" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{t('challenge.notification.title')}</h2>
                        <div className="text-sm font-mono text-foreground-tertiary">{mockActiveChallenge.id}</div>
                      </div>
                    </div>
                    <div className="p-4 bg-background rounded-xl text-center border border-danger/30">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.notification.deadline')}</div>
                      <div className="text-2xl font-bold font-mono text-danger" aria-live="polite">
                        {formatTime(timeRemaining)}
                      </div>
                      <p className="text-xs text-danger mt-1">{t('challenge.notification.deadlineHint')}</p>
                    </div>
                  </div>

                  {/* User-friendly explanation */}
                  <Card className="p-4 mb-6 bg-warning/10 border-warning/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-warning mb-1">{t('challenge.notification.whatThisMeans')}</p>
                        <p className="text-sm text-foreground-secondary">{t('challenge.notification.whatThisMeansDesc')}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Challenge Details */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card variant="hoverGradient" padding="sm">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.notification.applicant')}</div>
                      <div className="font-semibold">{mockActiveChallenge.applicant}</div>
                      <p className="text-xs text-foreground-tertiary mt-1">{t('challenge.notification.applicantHint')}</p>
                    </Card>
                    <Card variant="hoverGradient" padding="sm">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.notification.date')}</div>
                      <div className="font-semibold">{mockActiveChallenge.date}</div>
                    </Card>
                    <Card variant="hoverGradient" padding="sm">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.notification.violationType')}</div>
                      <div className="font-semibold text-danger">{t(`challenge.violation.${mockActiveChallenge.violationType}`)}</div>
                      <p className="text-xs text-foreground-tertiary mt-1">{t(`challenge.violation.${mockActiveChallenge.violationType}Hint`)}</p>
                    </Card>
                    <Card variant="hoverGradient" padding="sm" className="border-danger/50">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.notification.potentialSlashing')}</div>
                      <div className="font-semibold text-danger">
                        {mockActiveChallenge.potentialSlashing.toLocaleString()} QS ({mockActiveChallenge.slashingRate}%)
                      </div>
                      <p className="text-xs text-danger mt-1">{t('challenge.notification.slashingHint')}</p>
                    </Card>
                  </div>

                  {/* Accusation Content */}
                  <div className="p-5 bg-background rounded-xl">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                      {t('challenge.notification.accusationContent')}
                    </h4>
                    <p className="text-xs text-foreground-tertiary mb-4">{t('challenge.notification.accusationContentHint')}</p>

                    <div className="p-4 bg-background-secondary rounded-lg text-sm text-foreground-secondary mb-4">
                      <p className="mb-3">{t('challenge.notification.accusationText', { requestId: mockActiveChallenge.accusation.requestId })}</p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>{t('challenge.notification.signatureLength', { expected: mockActiveChallenge.accusation.expectedLength, actual: mockActiveChallenge.accusation.actualLength })}</li>
                        <li>{t('challenge.notification.errorCode')}: <code className="bg-background px-1 rounded">{mockActiveChallenge.accusation.errorCode}</code></li>
                      </ul>
                      <p>{t('challenge.notification.verificationNodes', { count: mockActiveChallenge.accusation.verificationNodes })}</p>
                    </div>

                    <h5 className="text-sm font-semibold text-foreground-tertiary mb-3">{t('challenge.notification.attachedEvidence')}</h5>
                    <div className="space-y-2">
                      {mockActiveChallenge.evidence.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg">
                          <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-info" aria-hidden="true" />
                          </div>
                          <span className="flex-1 text-sm">{file.name}</span>
                          <button
                            className="text-info text-sm hover:underline flex items-center gap-1"
                            aria-label={`${t('challenge.notification.download')} ${file.name}`}
                          >
                            <FileDown className="h-4 w-4" aria-hidden="true" />
                            {t('challenge.notification.download')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Next Steps */}
                <Card className="p-5 mb-6 bg-gradient-to-r from-gold/5 to-transparent border-gold/30">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-gold" aria-hidden="true" />
                    {t('challenge.notification.nextSteps')}
                  </h4>
                  <ol className="space-y-2 text-sm text-foreground-secondary list-decimal list-inside">
                    <li>{t('challenge.notification.step1')}</li>
                    <li>{t('challenge.notification.step2')}</li>
                    <li>{t('challenge.notification.step3')}</li>
                  </ol>
                </Card>

                <div className="flex gap-3 justify-center">
                  <Button variant="primary" onClick={() => setActiveTab('defense')}>
                    {t('challenge.notification.submitDefense')}
                  </Button>
                  <Button variant="outline">{t('challenge.notification.viewGuidelines')}</Button>
                </div>
              </>
            ) : (
              /* No Active Challenge */
              <Card className="p-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">{t('challenge.empty.title')}</h3>
                <p className="text-foreground-secondary mb-6">{t('challenge.empty.description')}</p>
                <Link href="/prover/dashboard">
                  <Button variant="outline">{t('challenge.result.backToDashboard')}</Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Defense Tab */}
          <div
            id="defense-panel"
            role="tabpanel"
            aria-labelledby="defense-tab"
            className={activeTab === 'defense' ? '' : 'hidden'}
          >
            {/* Defense Guidance */}
            <Card className="p-5 mb-6 bg-gradient-to-r from-info/5 to-transparent border-info/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-info" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('challenge.defense.guidance.title')}</h3>
                  <p className="text-sm text-foreground-secondary">{t('challenge.defense.guidance.description')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5" aria-hidden="true" />
                {t('challenge.defense.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-6">{t('challenge.defense.titleHint')}</p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="defense-content" className="block font-semibold mb-2">
                    {t('challenge.defense.contentLabel')}
                  </label>
                  <p className="text-xs text-foreground-tertiary mb-2">{t('challenge.defense.contentHint')}</p>
                  <textarea
                    id="defense-content"
                    value={defenseText}
                    onChange={(e) => setDefenseText(e.target.value)}
                    placeholder={t('challenge.defense.placeholder')}
                    className="w-full p-4 bg-background border border-surface-tertiary rounded-lg text-sm resize-y min-h-[150px] focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">{t('challenge.defense.evidenceLabel')}</label>
                  <p className="text-xs text-foreground-tertiary mb-2">{t('challenge.defense.evidenceHint')}</p>
                  <div className="border-2 border-dashed border-surface-tertiary rounded-xl p-8 text-center hover:border-gold transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-foreground-tertiary" aria-hidden="true" />
                    <p className="text-foreground-secondary">{t('challenge.defense.uploadInstruction')}</p>
                    <p className="text-xs text-foreground-tertiary mt-1">{t('challenge.defense.fileFormats')}</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                          <FileText className="h-4 w-4 text-foreground-tertiary" aria-hidden="true" />
                          <span className="flex-1 text-sm">{file.name}</span>
                          <button
                            onClick={() => removeFile(i)}
                            className="text-danger hover:text-danger/80"
                            aria-label={t('challenge.defense.removeFile', { name: file.name })}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-warning">{t('challenge.defense.warning')}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="primary">{t('challenge.defense.submit')}</Button>
                  <Button variant="outline">{t('challenge.defense.saveDraft')}</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Result Tab */}
          <div
            id="result-panel"
            role="tabpanel"
            aria-labelledby="result-tab"
            className={activeTab === 'result' ? '' : 'hidden'}
          >
            {/* Result Card - Won */}
            <Card className="p-8 mb-6 text-center border-success bg-gradient-to-br from-success/10 to-transparent">
              <div className="w-24 h-24 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-success" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-success">{t('challenge.result.dismissed')}</h2>
              <p className="text-foreground-secondary mb-6">{t('challenge.result.dismissedDescription')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
                <Card variant="hoverGradient" padding="sm" className="text-left">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.result.challengeId')}</div>
                  <div className="font-mono font-semibold">CHG-2026-000122</div>
                </Card>
                <Card variant="hoverGradient" padding="sm" className="text-left">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.result.verdict')}</div>
                  <div className="font-semibold text-success">{t('challenge.result.verdictWon')}</div>
                </Card>
                <Card variant="hoverGradient" padding="sm" className="text-left">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('challenge.result.slashing')}</div>
                  <div className="font-semibold text-success">0 QS</div>
                </Card>
              </div>

              <Link href="/prover/dashboard">
                <Button variant="primary">{t('challenge.result.backToDashboard')}</Button>
              </Link>
            </Card>

            {/* Challenge History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">{t('challenge.history.title')}</h3>
              <p className="text-sm text-foreground-secondary mb-4">{t('challenge.history.description')}</p>
              <table className="w-full" role="grid" aria-label={t('challenge.history.title')}>
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('challenge.history.challengeId')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('challenge.history.date')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('challenge.history.violationType')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('challenge.history.result')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('challenge.history.slashing')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockChallengeHistory.map((challenge) => (
                    <tr key={challenge.id} className="border-b border-surface-tertiary hover:bg-surface/50">
                      <td className="py-3 text-sm font-mono">{challenge.id}</td>
                      <td className="py-3 text-sm">{challenge.date}</td>
                      <td className="py-3 text-sm">{t(`challenge.violation.${challenge.type}`)}</td>
                      <td className="py-3">
                        <Badge
                          variant={challenge.status === 'won' ? 'success' : challenge.status === 'pending' ? 'warning' : 'danger'}
                          className="text-[11px]"
                        >
                          {challenge.status === 'won' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {challenge.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {challenge.status === 'lost' && <XCircle className="h-3 w-3 mr-1" />}
                          {t(`challenge.status.${challenge.status}`)}
                        </Badge>
                      </td>
                      <td className={`py-3 text-sm ${challenge.slashing === 0 ? 'text-success' : challenge.slashing ? 'text-danger' : ''}`}>
                        {challenge.slashing !== null ? `${challenge.slashing.toLocaleString()} QS` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
