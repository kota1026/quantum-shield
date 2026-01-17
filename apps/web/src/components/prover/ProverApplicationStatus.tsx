'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Clock,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  Building,
  Calendar,
  User,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimelineStep {
  id: string;
  title: string;
  date: string;
  description?: string;
  status: 'completed' | 'current' | 'pending';
}

interface Question {
  id: string;
  title: string;
  content: string;
  date: string;
  status: 'pending' | 'answered';
  answer?: string;
}

// Mock data - in production this would come from API
const mockTimelineSteps: TimelineStep[] = [
  {
    id: '1',
    title: 'applicationReceived',
    date: '2026/01/15 14:32',
    status: 'completed',
  },
  {
    id: '2',
    title: 'documentReview',
    date: '2026/01/15 15:45',
    description: 'documentsConfirmed',
    status: 'completed',
  },
  {
    id: '3',
    title: 'technicalReview',
    date: '2026/01/16 ~',
    description: 'reviewingInfrastructure',
    status: 'current',
  },
  {
    id: '4',
    title: 'finalApproval',
    date: '2026/01/20',
    status: 'pending',
  },
];

const mockQuestions: Question[] = [
  {
    id: '1',
    title: 'infrastructureRedundancy',
    content: 'infrastructureRedundancyContent',
    date: '2026/01/17 10:15',
    status: 'pending',
  },
  {
    id: '2',
    title: 'securityAudit',
    content: 'securityAuditContent',
    date: '2026/01/16 15:30',
    status: 'answered',
    answer: 'securityAuditAnswer',
  },
];

export function ProverApplicationStatus() {
  const t = useTranslations('prover');
  const [applicationId, setApplicationId] = useState('');
  const [email, setEmail] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSearch = () => {
    if (applicationId.trim() !== '' && email.trim() !== '') {
      setIsSearched(true);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitAnswer = (questionId: string) => {
    // In production, this would submit to API
    console.log('Submitting answer for question:', questionId, answers[questionId]);
  };

  const isFormValid = applicationId.trim() !== '' && email.trim() !== '';

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#status-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to status content
      </a>

      {/* Header */}
      <header className="flex justify-between items-center py-5 px-8" role="banner">
        <Link href="/prover/landing" className="flex items-center gap-3">
          <div className="w-11 h-11 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            />
            <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-lg font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-[1.5px]">
              Prover Portal
            </div>
          </div>
        </Link>
        <Link
          href="/prover/landing"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('application.backToOverview')}
        </Link>
      </header>

      <main id="status-content" className="max-w-3xl mx-auto px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            {t('status.title')}
          </h1>
          <p className="text-foreground-secondary">
            {t('status.subtitle')}
          </p>
        </div>

        {/* Search Form */}
        {!isSearched && (
          <Card className="p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Search className="h-5 w-5" aria-hidden="true" />
              {t('status.searchTitle')}
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="application-id" className="text-sm text-foreground-secondary">
                  {t('status.form.applicationId')}
                </label>
                <input
                  id="application-id"
                  type="text"
                  className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                  placeholder={t('status.form.applicationIdPlaceholder')}
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email-check" className="text-sm text-foreground-secondary">
                  {t('status.form.email')}
                </label>
                <input
                  id="email-check"
                  type="email"
                  className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                  placeholder={t('status.form.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleSearch}
                disabled={!isFormValid}
                aria-disabled={!isFormValid}
              >
                {t('status.form.checkButton')}
              </Button>
            </div>
          </Card>
        )}

        {/* Status Result */}
        {isSearched && (
          <div className="space-y-8">
            {/* Status Header */}
            <Card className="p-8">
              <div className="flex items-center gap-4 p-4 bg-info/10 border border-info/30 rounded-xl mb-8">
                <div className="w-12 h-12 bg-info rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{t('status.result.underReview')}</h3>
                  <p className="text-foreground-secondary text-sm">
                    {t('status.result.reviewingDocuments')}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5" aria-hidden="true" />
                {t('status.timeline.title')}
              </h3>

              <div className="relative pl-8" role="list" aria-label={t('status.timeline.title')}>
                <div
                  className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-surface-tertiary"
                  aria-hidden="true"
                />

                {mockTimelineSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`relative pb-6 ${index === mockTimelineSteps.length - 1 ? 'pb-0' : ''}`}
                    role="listitem"
                  >
                    <div
                      className={`absolute -left-8 top-0 w-4 h-4 rounded-full border-2 border-background ${
                        step.status === 'completed'
                          ? 'bg-success'
                          : step.status === 'current'
                            ? 'bg-info ring-4 ring-info/30'
                            : 'bg-surface-tertiary'
                      }`}
                      aria-hidden="true"
                    />
                    <div
                      className={`p-4 bg-background-secondary border rounded-lg ${
                        step.status === 'completed'
                          ? 'border-success/30'
                          : step.status === 'current'
                            ? 'border-info/30'
                            : 'border-surface-tertiary'
                      }`}
                    >
                      <div className="font-semibold">
                        {t(`status.timeline.steps.${step.title}`)}
                      </div>
                      <div className="text-xs text-foreground-tertiary">
                        {step.date}
                      </div>
                      {step.description && (
                        <div className="text-sm text-foreground-secondary mt-2">
                          {t(`status.timeline.descriptions.${step.description}`)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { label: 'applicationId', value: 'PRV-2026-0001', icon: FileText },
                  { label: 'applicationDate', value: '2026/01/15 14:32', icon: Calendar },
                  { label: 'organization', value: 'Example Infrastructure Co.', icon: Building },
                  { label: 'reviewer', value: 'Technical Review Team', icon: User },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="h-4 w-4 text-foreground-tertiary" aria-hidden="true" />
                      <span className="text-xs text-foreground-tertiary">
                        {t(`status.details.${item.label}`)}
                      </span>
                    </div>
                    <div className="font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Questions from Reviewers */}
            <Card className="p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Mail className="h-5 w-5" aria-hidden="true" />
                {t('status.questions.title')}
              </h2>

              <div className="space-y-4">
                {mockQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={`p-6 rounded-xl border ${
                      question.status === 'pending'
                        ? 'bg-warning/10 border-warning/30'
                        : 'bg-success/10 border-success/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant={question.status === 'pending' ? 'warning' : 'success'}>
                        {question.status === 'pending'
                          ? t('status.questions.needsAnswer')
                          : t('status.questions.answered')}
                      </Badge>
                      <span className="text-xs text-foreground-tertiary">{question.date}</span>
                    </div>

                    <h4 className="font-semibold mb-2">
                      {t(`status.questions.items.${question.title}.title`)}
                    </h4>
                    <p className="text-sm text-foreground-secondary mb-4">
                      {t(`status.questions.items.${question.title}.content`)}
                    </p>

                    {question.status === 'pending' ? (
                      <div className="space-y-4">
                        <textarea
                          className="w-full px-4 py-3 bg-background border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 resize-y min-h-[100px]"
                          placeholder={t('status.questions.answerPlaceholder')}
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          aria-label={t('status.questions.answerLabel')}
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleSubmitAnswer(question.id)}
                          disabled={!answers[question.id]?.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                          {t('status.questions.submitAnswer')}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 bg-background rounded-lg">
                        <span className="font-semibold text-sm">
                          {t('status.questions.yourAnswer')}:
                        </span>
                        <p className="text-sm text-foreground-secondary mt-1">
                          {t(`status.questions.items.${question.title}.answer`)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Back to search */}
            <div className="text-center">
              <Button variant="ghost" onClick={() => setIsSearched(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('status.backToSearch')}
              </Button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <Card className="p-8 text-center mt-8">
          <h3 className="text-lg font-semibold mb-2">{t('status.help.title')}</h3>
          <p className="text-foreground-secondary mb-6">
            {t('status.help.description')}
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:prover-support@quantum-shield.io"
              className="flex items-center gap-2 px-6 py-3 bg-background-secondary border border-surface-tertiary rounded-lg hover:border-gold transition-colors"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>{t('status.help.email')}</span>
            </a>
            <a
              href="tel:+81-3-1234-5678"
              className="flex items-center gap-2 px-6 py-3 bg-background-secondary border border-surface-tertiary rounded-lg hover:border-gold transition-colors"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>{t('status.help.phone')}</span>
            </a>
          </div>
        </Card>
      </main>
    </div>
  );
}
