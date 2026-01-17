'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type NodeStatus = 'healthy' | 'warning' | 'offline';

interface NodeMetrics {
  block: string;
  peers: number;
  cpu: number;
  memory: number;
}

interface Node {
  id: string;
  name: string;
  location?: string;
  isPrimary?: boolean;
  status: NodeStatus;
  metrics: NodeMetrics;
}

// Stat mini card component
interface StatMiniProps {
  label: string;
  value: string;
  variant?: 'default' | 'success';
}

function StatMini({ label, value, variant = 'default' }: StatMiniProps) {
  return (
    <div className="rounded-xl border border-surface-tertiary bg-card p-4">
      <div className="mb-1 text-xs text-foreground-tertiary">{label}</div>
      <div
        className={cn(
          'font-mono text-2xl font-bold',
          variant === 'success' ? 'text-success' : 'text-foreground'
        )}
      >
        {value}
      </div>
    </div>
  );
}

// Status indicator component
interface StatusIndicatorProps {
  status: NodeStatus;
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  const statusConfig = {
    healthy: 'bg-success',
    warning: 'bg-warning',
    offline: 'bg-danger',
  };

  return (
    <span
      className={cn('h-2.5 w-2.5 rounded-full', statusConfig[status])}
      aria-hidden="true"
    />
  );
}

// Node card component
interface NodeCardProps {
  node: Node;
  onClick: () => void;
}

function NodeCard({ node, onClick }: NodeCardProps) {
  const t = useTranslations('admin.nodes');

  const displayName = node.isPrimary
    ? `${node.name} (${t('node.primary')})`
    : node.location
      ? `${node.name} (${node.location})`
      : node.name;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer rounded-xl bg-background-secondary p-5 transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      tabIndex={0}
      role="button"
      aria-label={`${displayName}, ${t(`status.${node.status}`)}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-foreground">{displayName}</span>
        <StatusIndicator status={node.status} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-xs text-foreground-tertiary">
          {t('node.metrics.block')}:{' '}
          <span className="font-mono font-medium text-foreground">
            {node.metrics.block}
          </span>
        </div>
        <div className="text-xs text-foreground-tertiary">
          {t('node.metrics.peers')}:{' '}
          <span className="font-mono font-medium text-foreground">
            {node.metrics.peers}
          </span>
        </div>
        <div className="text-xs text-foreground-tertiary">
          {t('node.metrics.cpu')}:{' '}
          <span className="font-mono font-medium text-foreground">
            {node.metrics.cpu}%
          </span>
        </div>
        <div className="text-xs text-foreground-tertiary">
          {t('node.metrics.memory')}:{' '}
          <span className="font-mono font-medium text-foreground">
            {node.metrics.memory}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminNodes() {
  const t = useTranslations('admin.nodes');

  // Mock data - in production would come from API
  const stats = {
    totalNodes: '12',
    healthy: '12',
    currentBlock: '1,234,567',
    avgTps: '245',
  };

  const nodes: Node[] = [
    {
      id: '1',
      name: 'Node-01',
      isPrimary: true,
      status: 'healthy',
      metrics: { block: '1,234,567', peers: 11, cpu: 45, memory: 62 },
    },
    {
      id: '2',
      name: 'Node-02',
      status: 'healthy',
      metrics: { block: '1,234,567', peers: 11, cpu: 38, memory: 58 },
    },
    {
      id: '3',
      name: 'Node-03',
      status: 'healthy',
      metrics: { block: '1,234,567', peers: 11, cpu: 42, memory: 55 },
    },
    {
      id: '4',
      name: 'Node-04',
      location: 'Tokyo',
      status: 'healthy',
      metrics: { block: '1,234,567', peers: 11, cpu: 35, memory: 51 },
    },
    {
      id: '5',
      name: 'Node-05',
      location: 'Singapore',
      status: 'healthy',
      metrics: { block: '1,234,567', peers: 11, cpu: 40, memory: 60 },
    },
    {
      id: '6',
      name: 'Node-06',
      location: 'London',
      status: 'healthy',
      metrics: { block: '1,234,567', peers: 11, cpu: 37, memory: 54 },
    },
  ];

  const handleNodeClick = (nodeId: string) => {
    // In production, would open detail modal or navigate
    console.log('Node clicked:', nodeId);
  };

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatMini label={t('stats.totalNodes.label')} value={stats.totalNodes} />
          <StatMini
            label={t('stats.healthy.label')}
            value={stats.healthy}
            variant="success"
          />
          <StatMini label={t('stats.currentBlock.label')} value={stats.currentBlock} />
          <StatMini label={t('stats.avgTps.label')} value={stats.avgTps} />
        </div>

        {/* Nodes Grid */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-tertiary px-5 py-4">
            <CardTitle className="text-base">{t('card.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label={t('card.title')}
            >
              {nodes.map((node) => (
                <div key={node.id} role="listitem">
                  <NodeCard node={node} onClick={() => handleNodeClick(node.id)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
