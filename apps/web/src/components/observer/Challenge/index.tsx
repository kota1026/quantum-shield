'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { ArrowLeft, Plus, AlertTriangle, Check, ExternalLink } from 'lucide-react';

interface TargetTransaction {
  address: string;
  amount: string;
  unlockType: 'emergency' | 'normal';
  timeRemaining: string;
  txHash: string;
  riskScore: number;
}

// Mock data for demonstration
const mockTransaction: TargetTransaction = {
  address: '0x4b7c8a2e1f9d3c6b5a4e7f8d9c1b2a3e4f5d6c7b',
  amount: '45.00',
  unlockType: 'emergency',
  timeRemaining: '6d 14:22:18',
  txHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
  riskScore: 87,
};

function calculateBond(amount: number): number {
  return Math.max(0.1, amount * 0.01);
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: TargetTransaction;
  bondAmount: string;
  t: ReturnType<typeof useTranslations>;
}

function ConfirmModal({ isOpen, onClose, onConfirm, transaction, bondAmount, t }: ConfirmModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-card border border-border-default rounded-2xl p-8 max-w-md w-[90%]">
        <h2 id="confirm-modal-title" className="text-xl font-bold text-center mb-6">
          {t('confirm.title')}
        </h2>

        <div className="bg-background-secondary rounded-xl p-6 mb-6">
          <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
            <span className="text-text-secondary">{t('confirm.target')}</span>
            <span className="font-semibold font-mono text-sm">
              {transaction.address.slice(0, 6)}...{transaction.address.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
            <span className="text-text-secondary">{t('confirm.unlockAmount')}</span>
            <span className="font-semibold">{transaction.amount} ETH</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
            <span className="text-text-secondary">{t('confirm.bondRequired')}</span>
            <span className="font-semibold text-warning">{bondAmount} ETH</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-text-secondary">{t('confirm.defensePeriod')}</span>
            <span className="font-semibold">72 hours</span>
          </div>
        </div>

        <div className="bg-error/10 border border-error rounded-lg p-4 mb-6 text-sm text-error">
          {t('confirm.warning', { amount: bondAmount })}
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 w-4 h-4 accent-accent-hinomaru"
          />
          <span className="text-sm text-text-secondary">
            {t('confirm.acknowledgement')}
          </span>
        </label>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-transparent border border-border-default rounded-lg text-text-secondary hover:border-accent-gold hover:text-accent-gold transition-colors"
          >
            {t('confirm.cancelButton')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!acknowledged}
            className="flex-1 py-3 px-6 bg-gradient-to-br from-accent-hinomaru to-accent-hinomaru-light rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-accent-hinomaru/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {t('confirm.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChallengeForm() {
  const t = useTranslations('observer.dashboard.challenge');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(['firstTime', 'largeAmount', 'newAccount']);
  const [additionalEvidence, setAdditionalEvidence] = useState(
    'This appears to be a compromised account attempting emergency unlock. The account was created 12 days ago, made a single large deposit, and is now attempting emergency withdrawal at an unusual time (3:42 AM local time). The deposit transaction originated from a mixer contract.'
  );
  const [supportingLinks, setSupportingLinks] = useState<string[]>(['']);

  const bondAmount = calculateBond(parseFloat(mockTransaction.amount)).toFixed(2);

  const toggleFactor = (factor: string) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const addLink = () => {
    setSupportingLinks((prev) => [...prev, '']);
  };

  const updateLink = (index: number, value: string) => {
    setSupportingLinks((prev) => {
      const newLinks = [...prev];
      newLinks[index] = value;
      return newLinks;
    });
  };

  const handleSubmit = () => {
    // In production, this would submit to the blockchain
    window.location.href = '/observer/challenge/1';
  };

  const riskFactors = [
    { key: 'firstTime', label: t('evidence.firstTimeEmergency') },
    { key: 'largeAmount', label: t('evidence.largeAmount') },
    { key: 'newAccount', label: t('evidence.newAccount') },
    { key: 'suspicious', label: t('evidence.suspicious') },
  ];

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,var(--accent-hinomaru-dim),transparent_60%)] opacity-50" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-8 py-8">
        <ObserverHeader />

        <Link
          href="/observer/suspicious"
          className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-border-default rounded-lg text-text-secondary text-sm hover:border-accent-gold hover:text-accent-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToSuspicious')}
        </Link>

        <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>

        {/* Target Transaction Card */}
        <section
          className="bg-card border border-border-subtle rounded-2xl p-8 mb-6"
          aria-labelledby="target-section-title"
        >
          <h2 id="target-section-title" className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-6 h-6 bg-accent-hinomaru rounded-full flex items-center justify-center text-xs font-semibold">
              1
            </span>
            {t('targetTransaction.title')}
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                {t('targetTransaction.targetAddress')}
              </div>
              <div className="font-mono text-sm">{mockTransaction.address}</div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                {t('targetTransaction.amount')}
              </div>
              <div className="text-base font-semibold">{mockTransaction.amount} ETH</div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                {t('targetTransaction.unlockType')}
              </div>
              <div className="text-base font-semibold text-warning">
                {t('targetTransaction.emergency')}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                {t('targetTransaction.timeRemaining')}
              </div>
              <div className="font-mono text-base font-semibold text-warning">
                {mockTransaction.timeRemaining}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                {t('targetTransaction.txHash')}
              </div>
              <div className="font-mono text-sm">{mockTransaction.txHash}</div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                {t('targetTransaction.riskScore')}
              </div>
              <div className="text-base font-semibold text-error">
                {mockTransaction.riskScore} / 100 (High Risk)
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Card */}
        <section
          className="bg-card border border-border-subtle rounded-2xl p-8 mb-6"
          aria-labelledby="evidence-section-title"
        >
          <h2 id="evidence-section-title" className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-6 h-6 bg-accent-hinomaru rounded-full flex items-center justify-center text-xs font-semibold">
              2
            </span>
            {t('evidence.title')}
          </h2>

          <div className="bg-background-secondary rounded-xl p-6 mb-6">
            <div className="text-sm font-semibold mb-4">{t('evidence.selectFactors')}</div>
            <div className="space-y-3">
              {riskFactors.map((factor) => (
                <label
                  key={factor.key}
                  className="flex items-center gap-4 py-2 border-b border-border-subtle last:border-0 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFactors.includes(factor.key)}
                    onChange={() => toggleFactor(factor.key)}
                    className="w-5 h-5 accent-accent-hinomaru"
                  />
                  <span className="text-sm">{factor.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="additional-evidence" className="block text-sm font-medium mb-2">
              {t('evidence.additionalEvidence')}
            </label>
            <textarea
              id="additional-evidence"
              value={additionalEvidence}
              onChange={(e) => setAdditionalEvidence(e.target.value)}
              placeholder={t('evidence.additionalPlaceholder')}
              className="w-full min-h-[120px] p-4 bg-background-secondary border border-border-default rounded-lg text-sm resize-y focus:outline-none focus:border-accent-hinomaru focus:ring-2 focus:ring-accent-hinomaru/20"
            />
            <p className="text-xs text-text-tertiary mt-1">{t('evidence.evidenceHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('evidence.supportingLinks')}
            </label>
            {supportingLinks.map((link, index) => (
              <input
                key={index}
                type="url"
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
                placeholder="https://etherscan.io/tx/..."
                className="w-full p-4 mb-2 bg-background-secondary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-hinomaru focus:ring-2 focus:ring-accent-hinomaru/20"
              />
            ))}
            <button
              type="button"
              onClick={addLink}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-dashed border-border-default rounded-lg text-text-secondary text-sm hover:border-accent-gold hover:text-accent-gold transition-colors mt-2"
            >
              <Plus className="w-4 h-4" />
              {t('evidence.addLink')}
            </button>
          </div>
        </section>

        {/* Bond Card */}
        <section
          className="bg-card border border-border-subtle rounded-2xl p-8 mb-6"
          aria-labelledby="bond-section-title"
        >
          <h2 id="bond-section-title" className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-6 h-6 bg-accent-hinomaru rounded-full flex items-center justify-center text-xs font-semibold">
              3
            </span>
            {t('bond.title')}
          </h2>

          <div className="bg-warning/10 border border-warning rounded-xl p-6">
            <div className="text-sm font-semibold text-warning mb-4">
              {t('bond.requiredAmount')}
            </div>
            <div className="text-sm text-text-secondary mb-4">
              {t('bond.calculation')}
              <br />
              = MAX(0.1 ETH, {mockTransaction.amount} ETH × 1%)
              <br />
              = MAX(0.1 ETH, {bondAmount} ETH)
            </div>
            <div className="text-2xl font-bold text-warning mb-2">{bondAmount} ETH</div>
            <div className="text-xs text-text-tertiary space-y-1">
              <p>{t('bond.warningLose')}</p>
              <p>{t('bond.warningWin')}</p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Link
            href="/observer/suspicious"
            className="py-4 px-8 bg-transparent border border-border-default rounded-lg text-text-secondary text-base hover:border-accent-gold hover:text-accent-gold transition-colors"
          >
            {t('actions.cancel')}
          </Link>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex-1 py-4 px-8 bg-gradient-to-br from-accent-hinomaru to-accent-hinomaru-light rounded-lg text-white text-base font-semibold hover:shadow-lg hover:shadow-accent-hinomaru/40 hover:-translate-y-0.5 transition-all"
          >
            {t('actions.submit', { amount: `${bondAmount} ETH` })}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        transaction={mockTransaction}
        bondAmount={bondAmount}
        t={t}
      />
    </div>
  );
}
