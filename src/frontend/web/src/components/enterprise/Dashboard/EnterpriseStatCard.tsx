'use client';

import { cn } from '@/lib/utils';
import {
  Wallet,
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Activity,
  Shield,
  UserCheck,
  Mail,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type IconType = 'wallet' | 'chart' | 'document' | 'users' | 'trending' | 'activity' | 'shield' | 'userCheck' | 'mail';

interface EnterpriseStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  tooltip?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon: IconType;
  className?: string;
}

const ICON_MAP: Record<IconType, { icon: React.ComponentType<{ className?: string }>; style: string }> = {
  wallet: {
    icon: Wallet,
    style: 'bg-hinomaru/10 text-hinomaru-400',
  },
  chart: {
    icon: BarChart3,
    style: 'bg-gold/10 text-gold',
  },
  document: {
    icon: FileText,
    style: 'bg-success/10 text-success',
  },
  users: {
    icon: Users,
    style: 'bg-info/10 text-info',
  },
  trending: {
    icon: TrendingUp,
    style: 'bg-gold/10 text-gold',
  },
  activity: {
    icon: Activity,
    style: 'bg-success/10 text-success',
  },
  shield: {
    icon: Shield,
    style: 'bg-hinomaru/10 text-hinomaru-400',
  },
  userCheck: {
    icon: UserCheck,
    style: 'bg-info/10 text-info',
  },
  mail: {
    icon: Mail,
    style: 'bg-warning/10 text-warning',
  },
};

export function EnterpriseStatCard({
  label,
  value,
  unit,
  tooltip,
  change,
  icon,
  className,
}: EnterpriseStatCardProps) {
  const { icon: Icon, style } = ICON_MAP[icon];

  const labelContent = (
    <span className="text-xs text-foreground-tertiary flex items-center gap-1">
      {label}
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help inline-flex">
                <HelpCircle className="w-3.5 h-3.5 text-foreground-tertiary hover:text-foreground-secondary transition-colors" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );

  return (
    <div
      className={cn(
        'bg-card border border-white/5 rounded-xl p-6',
        'relative overflow-hidden transition-all duration-200',
        'hover:border-white/10 group',
        className
      )}
    >
      {/* Gradient top border on hover */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-0.5',
          'bg-gradient-to-r from-hinomaru to-gold',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
        aria-hidden="true"
      />

      <div className="flex justify-between items-start mb-2">
        {labelContent}
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', style)}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      <div className="text-[28px] font-bold tracking-tight text-foreground mb-1">
        {value}
        {unit && <span className="text-sm font-medium text-foreground-secondary ml-1">{unit}</span>}
      </div>

      {change && (
        <div
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            change.isPositive ? 'text-success' : 'text-danger'
          )}
        >
          {change.isPositive ? (
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-3 h-3" aria-hidden="true" />
          )}
          <span>{change.value}</span>
        </div>
      )}
    </div>
  );
}
