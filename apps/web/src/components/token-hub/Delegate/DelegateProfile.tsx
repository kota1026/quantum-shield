'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  Server,
  Vote,
  FlaskConical,
  Building2,
  Users,
  TrendingUp,
  Calendar,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { Link } from '@/i18n/navigation';

interface DelegateProfileProps {
  delegateId: string;
}

// Demo delegate data - In production, this would come from API
const DELEGATES_DATA: Record<string, {
  id: string;
  name: string;
  initial: string;
  address: string;
  rank: number;
  veQS: string;
  delegators: number;
  participation: number;
  tags: string[];
  bio: string;
  statement: string;
  recentVotes: { proposal: string; vote: 'yes' | 'no' | 'abstain'; date: string }[];
}> = {
  '1': {
    id: '1',
    name: 'list.watanabe',
    initial: 'W',
    address: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    rank: 1,
    veQS: '285K',
    delegators: 1247,
    participation: 98,
    tags: ['securityCouncil', 'defiExpert', 'longTermHolder'],
    bio: 'list.watanabeBio',
    statement: 'profile.watanabeStatement',
    recentVotes: [
      { proposal: 'QIP-42: 手数料調整', vote: 'yes', date: '2026-01-10' },
      { proposal: 'QIP-41: プロトコル改善', vote: 'yes', date: '2026-01-03' },
      { proposal: 'QIP-40: 財務配分', vote: 'no', date: '2025-12-28' },
    ],
  },
  '2': {
    id: '2',
    name: 'list.sato',
    initial: 'S',
    address: '0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0tabcdef12',
    rank: 2,
    veQS: '198K',
    delegators: 892,
    participation: 95,
    tags: ['research', 'governance'],
    bio: 'list.satoBio',
    statement: 'profile.satoStatement',
    recentVotes: [
      { proposal: 'QIP-42: 手数料調整', vote: 'yes', date: '2026-01-10' },
      { proposal: 'QIP-41: プロトコル改善', vote: 'yes', date: '2026-01-03' },
    ],
  },
  '3': {
    id: '3',
    name: 'list.tanaka',
    initial: 'T',
    address: '0x9i0j1k2l3m4n5o6p7q8r9s0tabcdef1234567890',
    rank: 3,
    veQS: '156K',
    delegators: 634,
    participation: 92,
    tags: ['defi', 'yieldStrategy'],
    bio: 'list.tanakaBio',
    statement: 'profile.tanakaStatement',
    recentVotes: [
      { proposal: 'QIP-42: 手数料調整', vote: 'abstain', date: '2026-01-10' },
    ],
  },
  '4': {
    id: '4',
    name: 'list.yamamoto',
    initial: 'Y',
    address: '0x3m4n5o6p7q8r9s0tabcdef1234567890abcdef12',
    rank: 4,
    veQS: '124K',
    delegators: 412,
    participation: 89,
    tags: ['infrastructure', 'prover'],
    bio: 'list.yamamotoBio',
    statement: 'profile.yamamotoStatement',
    recentVotes: [],
  },
  '5': {
    id: '5',
    name: 'list.suzuki',
    initial: 'K',
    address: '0x7q8r9s0tabcdef1234567890abcdef1234567890',
    rank: 5,
    veQS: '98K',
    delegators: 287,
    participation: 100,
    tags: ['purposeCommittee', 'cryptography'],
    bio: 'list.suzukiBio',
    statement: 'profile.suzukiStatement',
    recentVotes: [],
  },
  '6': {
    id: '6',
    name: 'list.matsumoto',
    initial: 'M',
    address: '0x1u2v3w4x5y6z7890abcdef1234567890abcdef12',
    rank: 6,
    veQS: '76K',
    delegators: 198,
    participation: 94,
    tags: ['daoGovernance', 'community'],
    bio: 'list.matsumotoBio',
    statement: 'profile.matsumotoStatement',
    recentVotes: [],
  },
};

function getTagIcon(tag: string) {
  switch (tag) {
    case 'securityCouncil':
    case 'purposeCommittee':
      return <Shield className="w-3 h-3" aria-hidden="true" />;
    case 'defiExpert':
    case 'defi':
    case 'yieldStrategy':
      return <Sparkles className="w-3 h-3" aria-hidden="true" />;
    case 'infrastructure':
    case 'prover':
      return <Server className="w-3 h-3" aria-hidden="true" />;
    case 'daoGovernance':
    case 'governance':
      return <Vote className="w-3 h-3" aria-hidden="true" />;
    case 'research':
    case 'cryptography':
      return <FlaskConical className="w-3 h-3" aria-hidden="true" />;
    case 'community':
      return <Building2 className="w-3 h-3" aria-hidden="true" />;
    default:
      return null;
  }
}

export function DelegateProfile({ delegateId }: DelegateProfileProps) {
  const t = useTranslations('token-hub.delegate');
  const tProfile = useTranslations('token-hub.delegateProfile');
  const tCommon = useTranslations('token-hub.common');
  const router = useRouter();
  const [delegateAmount, setDelegateAmount] = useState('');
  const [isDelegating, setIsDelegating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const delegate = useMemo(() => {
    return DELEGATES_DATA[delegateId] || DELEGATES_DATA['1'];
  }, [delegateId]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleDelegate = useCallback(async () => {
    if (!delegateAmount) return;
    setIsDelegating(true);
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDelegating(false);
    setIsSuccess(true);
  }, [delegateAmount]);

  const handleDone = useCallback(() => {
    router.push('/token-hub/delegate');
  }, [router]);

  // Success State
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pb-8">
        {/* Premium Background Effect - Success Glow */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[600px] h-[600px]',
              'bg-[radial-gradient(ellipse,rgba(34,197,94,0.15),transparent_60%)]'
            )}
          />
        </div>

        <main className="relative z-10 max-w-[600px] mx-auto px-4 sm:px-6 pt-6" role="main">
          <TokenHubHeader />

          {/* Success Card */}
          <Card padding="none" className="overflow-hidden mt-8">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
                <div className="relative w-24 h-24 bg-success/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-2">{tProfile('success.title')}</h1>
              <p className="text-foreground-secondary mb-6">{tProfile('success.description')}</p>

              {/* Delegation Summary */}
              <div className="bg-background-secondary rounded-xl p-6 mb-6 text-left">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{tProfile('success.delegatedTo')}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full',
                          'bg-gradient-to-br from-gold to-hinomaru',
                          'flex items-center justify-center',
                          'text-sm font-semibold text-white'
                        )}
                      >
                        {delegate.initial}
                      </div>
                      <span className="font-semibold">{t(delegate.name)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{tProfile('success.amount')}</span>
                    <span className="font-bold font-mono text-gold">{Number(delegateAmount).toLocaleString()} veQS</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{tProfile('success.txHash')}</span>
                    <a
                      href="https://etherscan.io/tx/0x8b4c...2e3f"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-gold hover:underline inline-flex items-center gap-1"
                    >
                      0x8b4c...2e3f
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleDone}
                  className="w-full"
                >
                  {tProfile('success.done')}
                </Button>
                <Link
                  href="/token-hub/dashboard"
                  className="text-sm text-gold hover:underline"
                >
                  {tProfile('success.dashboardLink')}
                </Link>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" role="main">
        <TokenHubHeader />

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-foreground-tertiary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {tProfile('back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Profile Header */}
            <Card padding="lg">
              <div className="flex items-start gap-6">
                <div
                  className={cn(
                    'w-20 h-20 rounded-full',
                    'bg-gradient-to-br from-gold to-hinomaru',
                    'flex items-center justify-center',
                    'text-3xl font-semibold text-white'
                  )}
                >
                  {delegate.initial}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{t(delegate.name)}</h1>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold',
                        'bg-gold/10 border border-gold text-gold'
                      )}
                    >
                      #{delegate.rank}
                    </span>
                  </div>
                  <div className="text-sm text-foreground-tertiary font-mono mb-4">
                    {delegate.address.slice(0, 10)}...{delegate.address.slice(-8)}
                    <a
                      href={`https://etherscan.io/address/${delegate.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-gold hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {delegate.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1',
                          'bg-background-secondary rounded-full',
                          'text-[11px] text-foreground-secondary'
                        )}
                      >
                        {getTagIcon(tag)}
                        {t(`tags.${tag}`)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <div className="text-xs text-foreground-tertiary mb-1">{tProfile('stats.veqs')}</div>
                <div className="text-xl font-bold font-mono text-gold">{delegate.veQS}</div>
              </Card>
              <Card padding="md" className="text-center">
                <div className="text-xs text-foreground-tertiary mb-1">{tProfile('stats.delegators')}</div>
                <div className="text-xl font-bold font-mono">{delegate.delegators.toLocaleString()}</div>
              </Card>
              <Card padding="md" className="text-center">
                <div className="text-xs text-foreground-tertiary mb-1">{tProfile('stats.participation')}</div>
                <div className="text-xl font-bold font-mono text-gold">{delegate.participation}%</div>
              </Card>
            </div>

            {/* Bio */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold mb-4">{tProfile('bio.title')}</h2>
              <p className="text-foreground-secondary">{t(delegate.bio)}</p>
            </Card>

            {/* Voting Statement */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold mb-4">{tProfile('statement.title')}</h2>
              <p className="text-foreground-secondary">{tProfile(delegate.statement)}</p>
            </Card>

            {/* Recent Votes */}
            {delegate.recentVotes.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Vote className="w-5 h-5 text-gold" aria-hidden="true" />
                    {tProfile('votes.title')}
                  </h2>
                </div>
                <ul className="divide-y divide-border">
                  {delegate.recentVotes.map((vote, index) => (
                    <li key={index} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{vote.proposal}</div>
                        <div className="text-xs text-foreground-tertiary">{vote.date}</div>
                      </div>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-semibold',
                          vote.vote === 'yes' && 'bg-success/10 text-success',
                          vote.vote === 'no' && 'bg-error/10 text-error',
                          vote.vote === 'abstain' && 'bg-background-secondary text-foreground-tertiary'
                        )}
                      >
                        {tProfile(`votes.${vote.vote}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Delegation Sidebar */}
          <div className="space-y-6">
            <Card padding="lg" className="sticky top-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" aria-hidden="true" />
                {tProfile('delegateForm.title')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground-secondary mb-2 block">
                    {tProfile('delegateForm.amount')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={delegateAmount}
                      onChange={(e) => setDelegateAmount(e.target.value)}
                      placeholder="0"
                      className={cn(
                        'w-full p-4 pr-16',
                        'bg-background-secondary border border-border rounded-xl',
                        'text-lg font-mono',
                        'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold'
                      )}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-foreground-tertiary">
                      veQS
                    </span>
                  </div>
                  <div className="text-xs text-foreground-tertiary mt-1">
                    {tProfile('delegateForm.available')}: 6,225 veQS
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleDelegate}
                  disabled={!delegateAmount || isDelegating}
                  className="w-full"
                >
                  {isDelegating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      {tProfile('delegateForm.delegating')}
                    </>
                  ) : (
                    tProfile('delegateForm.submit')
                  )}
                </Button>

                <p className="text-xs text-foreground-tertiary text-center">
                  {tProfile('delegateForm.notice')}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4" aria-label={tCommon('footer.navLabel')}>
            <Link
              href="/consumer/terms"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors"
            >
              {tCommon('footer.terms')}
            </Link>
            <Link
              href="/consumer/privacy"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors"
            >
              {tCommon('footer.privacy')}
            </Link>
          </nav>
          <p className="text-xs text-foreground-tertiary text-center max-w-lg mx-auto">
            {tCommon('footer.disclaimer')}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default DelegateProfile;
