'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Status Banner component
function StatusBanner({ isOperational }: { isOperational: boolean }) {
  const t = useTranslations('admin.emergency');

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-5 py-3',
        isOperational
          ? 'border-success bg-success/10'
          : 'animate-pulse border-danger bg-danger/10'
      )}
      role="status"
      aria-live="polite"
    >
      {isOperational ? (
        <>
          <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
          <span className="text-sm font-semibold text-success">
            {t('status.operational')}
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
          <span className="text-sm font-semibold text-danger">
            {t('status.paused')}
          </span>
        </>
      )}
    </div>
  );
}

// Checklist Item component
interface ChecklistItemProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
}

function ChecklistItem({ id, label, checked, onToggle }: ChecklistItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-background-secondary p-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onToggle(id)}
        className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          checked
            ? 'border-success bg-success text-white'
            : 'border-foreground-tertiary bg-transparent'
        )}
      >
        {checked && (
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>
      <span className="text-[13px] text-foreground">{label}</span>
    </div>
  );
}

// Recovery Step component
interface RecoveryStepProps {
  number: number;
  title: string;
  description: string;
}

function RecoveryStep({ number, title, description }: RecoveryStepProps) {
  return (
    <article
      className="flex gap-3 rounded-lg bg-background-secondary p-4"
      aria-label={`Step ${number}: ${title}`}
    >
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-gold/10 text-xs font-semibold text-gold"
        aria-hidden="true"
      >
        {number}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-foreground-secondary">{description}</div>
      </div>
    </article>
  );
}

// History Item component
interface HistoryItemProps {
  type: 'pause' | 'resume';
  title: string;
  time: string;
  duration?: string;
  onClick?: () => void;
}

function HistoryItem({ type, title, time, duration, onClick }: HistoryItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg bg-background-secondary p-3 text-left transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`${title}, ${time}${duration ? `, duration: ${duration}` : ''}`}
    >
      <div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
          type === 'pause' ? 'bg-danger/10' : 'bg-success/10'
        )}
      >
        {type === 'pause' ? (
          <Pause className="h-4 w-4 text-danger" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4 text-success" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">{title}</div>
        <time className="font-mono text-[11px] text-foreground-tertiary">{time}</time>
      </div>
      {duration && (
        <span className="rounded bg-background-tertiary px-2 py-1 font-mono text-[11px] text-foreground-secondary">
          {duration}
        </span>
      )}
    </button>
  );
}

// Confirmation Modal component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ isOpen, onClose, onConfirm }: ConfirmModalProps) {
  const t = useTranslations('admin.emergency.modal');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (inputValue === 'PAUSE') {
      onConfirm();
      setInputValue('');
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleClose = () => {
    onClose();
    setInputValue('');
    setError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-surface-tertiary bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-surface-tertiary p-5 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-7 w-7 text-danger" aria-hidden="true" />
          </div>
          <h2 id="modal-title" className="text-xl font-semibold text-foreground">
            {t('title')}
          </h2>
          <p className="mt-2 text-[13px] text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="mb-4 rounded-lg border border-danger bg-danger/10 p-3">
            <p className="flex items-start gap-2 text-[13px] text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {t('warning')}
            </p>
          </div>

          <label
            htmlFor="confirm-input"
            className="block text-[13px] text-foreground-secondary"
          >
            {t('confirmLabel')}
          </label>
          <input
            id="confirm-input"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(false);
            }}
            placeholder={t('placeholder')}
            className={cn(
              'mt-2 w-full rounded-lg border bg-background-secondary px-3 py-3 font-mono text-sm text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-hinomaru',
              error ? 'border-danger' : 'border-surface-tertiary'
            )}
            autoComplete="off"
          />
          {error && (
            <p className="mt-2 text-xs text-danger">{t('inputError')}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-surface-tertiary p-5">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            {t('cancelButton')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleConfirm}>
            {t('confirmButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminEmergency() {
  const t = useTranslations('admin.emergency');
  const [isOperational, setIsOperational] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    severity: false,
    council: false,
    impact: false,
    notification: false,
    recovery: false,
  });

  const handleChecklistToggle = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePauseConfirm = () => {
    setIsOperational(false);
    setIsModalOpen(false);
    // In production, this would trigger an API call
  };

  const recoverySteps = [
    { title: t('recovery.steps.step1.title'), description: t('recovery.steps.step1.description') },
    { title: t('recovery.steps.step2.title'), description: t('recovery.steps.step2.description') },
    { title: t('recovery.steps.step3.title'), description: t('recovery.steps.step3.description') },
    { title: t('recovery.steps.step4.title'), description: t('recovery.steps.step4.description') },
    { title: t('recovery.steps.step5.title'), description: t('recovery.steps.step5.description') },
    { title: t('recovery.steps.step6.title'), description: t('recovery.steps.step6.description') },
  ];

  const checklistItems = [
    { id: 'severity', label: t('checklist.items.severity') },
    { id: 'council', label: t('checklist.items.council') },
    { id: 'impact', label: t('checklist.items.impact') },
    { id: 'notification', label: t('checklist.items.notification') },
    { id: 'recovery', label: t('checklist.items.recovery') },
  ];

  const historyItems = [
    { type: 'resume' as const, title: t('history.resumed'), time: '2025-12-15 16:42:00', duration: '4h 23m' },
    { type: 'pause' as const, title: `${t('history.paused')} - L1 Gas Spike`, time: '2025-12-15 12:19:00' },
    { type: 'resume' as const, title: t('history.resumed'), time: '2025-11-28 09:15:00', duration: '2h 45m' },
    { type: 'pause' as const, title: t('history.maintenance'), time: '2025-11-28 06:30:00' },
  ];

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <StatusBanner isOperational={isOperational} />
        </div>

        {/* Emergency Controls Grid */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pause Control Card */}
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="text-base">{t('pauseControl.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="py-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  disabled={!isOperational}
                  className={cn(
                    'mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-[3px] transition-all',
                    isOperational
                      ? 'border-hinomaru bg-hinomaru/10 text-hinomaru hover:scale-105 hover:bg-hinomaru hover:text-white hover:shadow-[0_0_40px_rgba(188,0,45,0.4)]'
                      : 'cursor-not-allowed border-foreground-tertiary bg-surface-secondary text-foreground-tertiary'
                  )}
                  aria-label={t('pauseControl.executeButton')}
                >
                  <Pause className="h-12 w-12" />
                </button>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t('pauseControl.systemPause')}
                </h3>
                <p className="mb-6 text-sm text-foreground-secondary">
                  {t('pauseControl.description')}
                </p>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  disabled={!isOperational}
                >
                  {t('pauseControl.executeButton')}
                </Button>
              </div>

              {/* Warning Box */}
              <div className="mt-4 rounded-lg border border-warning bg-warning/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  {t('pauseControl.warning.title')}
                </div>
                <div className="space-y-1 text-[13px] text-foreground-secondary">
                  <p>{t('pauseControl.warning.text1')}</p>
                  <p>{t('pauseControl.warning.text2')}</p>
                  <p>{t('pauseControl.warning.text3')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pre-Pause Checklist Card */}
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="text-base">{t('checklist.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3" role="group" aria-label={t('checklist.title')}>
                {checklistItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    checked={checklist[item.id]}
                    onToggle={handleChecklistToggle}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recovery & History Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recovery Procedures Card */}
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="text-base">{t('recovery.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {recoverySteps.map((step, index) => (
                  <RecoveryStep
                    key={index}
                    number={index + 1}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pause History Card */}
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="text-base">{t('history.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-2">
                {historyItems.map((item, index) => (
                  <HistoryItem
                    key={index}
                    type={item.type}
                    title={item.title}
                    time={item.time}
                    duration={item.duration}
                    onClick={() => {
                      // History detail modal would open here
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handlePauseConfirm}
      />
    </main>
  );
}
