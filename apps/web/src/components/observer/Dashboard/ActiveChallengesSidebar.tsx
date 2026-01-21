'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface ActiveChallenge {
  id: string;
  challengeId: string;
  targetAddress: string;
  amount: string;
  countdown: string;
  progress: number;
  status: 'defense' | 'judgment';
}

interface ActiveChallengesSidebarProps {
  challenges: ActiveChallenge[];
  className?: string;
}

export function ActiveChallengesSidebar({
  challenges,
  className,
}: ActiveChallengesSidebarProps) {
  const t = useTranslations('observer.dashboard.activeChallenges');

  return (
    <div
      className={cn(
        'bg-card border border-border/50 rounded-xl p-6',
        className
      )}
    >
      <h3 className="text-base font-bold text-foreground mb-4">
        {t('title')}
      </h3>
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <Link
            key={challenge.id}
            href={`/observer/challenge/${challenge.challengeId.replace('#CHG-', '')}`}
            className="block bg-background-secondary rounded-lg p-4 hover:bg-background-tertiary transition-colors"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm font-medium text-foreground-secondary">
                {challenge.challengeId}
              </span>
              <span className="font-mono text-base font-bold text-hinomaru">
                {challenge.countdown}
              </span>
            </div>
            <div className="text-sm font-medium text-foreground mb-2">
              {t('vs')} {challenge.targetAddress} • {challenge.amount}
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full"
                style={{ width: `${challenge.progress}%` }}
              />
            </div>
            <div className="text-xs font-medium text-foreground-secondary mt-1.5">
              {challenge.status === 'defense'
                ? t('defensePeriod')
                : t('awaitingJudgment')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
