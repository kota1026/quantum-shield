'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Unlock,
  Key,
  Shield,
  Server,
  Layers,
  Users,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle,
  Hash,
  ShieldCheck,
  Ban,
  FileText,
  Eye,
  Cpu,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  ArrowDown,
  Database,
  Globe,
  Wallet,
  HelpCircle,
  BookOpen,
  Info,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// TechTerm Component - Shows technical terms with tooltip explanations
function TechTerm({
  term,
  tooltipKey,
  children,
}: {
  term: string;
  tooltipKey: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('ecosystemTechnical');

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 border-b border-dashed border-gold/50 cursor-help hover:border-gold transition-colors">
            {children}
            <HelpCircle className="w-3 h-3 text-gold/70" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{t(`tooltips.${tooltipKey}`)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// WhyExplanation Component - Shows expandable "Why?" explanations
function WhyExplanation({ explanationKey }: { explanationKey: string }) {
  const t = useTranslations('ecosystemTechnical');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
      >
        <Info className="w-4 h-4" />
        <span>{t(`whyExplanations.${explanationKey}.title`)}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-gold/5 border border-gold/20 rounded-lg text-sm text-foreground-secondary animate-in slide-in-from-top-2 duration-200">
          {t(`whyExplanations.${explanationKey}.content`)}
        </div>
      )}
    </div>
  );
}

const algorithms = ['dilithium', 'sphincs', 'sha3'] as const;

const specCategories = ['timing', 'signatures', 'staking', 'limits'] as const;

const specItems: Record<string, string[]> = {
  timing: ['normalUnlock', 'emergencyUnlock', 'proverTimeout', 'challengeDefense'],
  signatures: ['threshold', 'vrfTimeout', 'sigDeadline'],
  staking: ['proverMin', 'observerMin', 'emergencyBond'],
  limits: ['tvlCap', 'minLock'],
};

const principles = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5'] as const;

// Sequence step definitions with layer and crypto info
interface SequenceStep {
  step: number;
  actor: 'user' | 'l3' | 'l1' | 'prover' | 'observer';
  crypto?: 'dilithium' | 'sphincs' | 'sha3' | 'vrf';
  storage?: 'l1' | 'l3';
  contract?: string;
}

const lockSteps: SequenceStep[] = [
  { step: 1, actor: 'user', crypto: 'dilithium' },
  { step: 2, actor: 'l3', crypto: 'dilithium', storage: 'l3' },
  { step: 3, actor: 'l3', crypto: 'sha3', storage: 'l3' },
  { step: 4, actor: 'l1', storage: 'l1', contract: 'L1Vault' },
  { step: 5, actor: 'l1', storage: 'l1', contract: 'L1Vault' },
];

const unlockSteps: SequenceStep[] = [
  { step: 1, actor: 'user', crypto: 'dilithium' },
  { step: 2, actor: 'l3', crypto: 'vrf', storage: 'l3' },
  { step: 3, actor: 'l3', storage: 'l3' },
  { step: 4, actor: 'prover', crypto: 'sphincs' },
  { step: 5, actor: 'l1', crypto: 'sphincs', storage: 'l1', contract: 'SPHINCSVerifier' },
  { step: 6, actor: 'l1', storage: 'l1', contract: 'L1Vault' },
  { step: 7, actor: 'l1', storage: 'l1', contract: 'L1Vault' },
];

const emergencySteps: SequenceStep[] = [
  { step: 1, actor: 'l3' },
  { step: 2, actor: 'user', storage: 'l1', contract: 'L1Vault' },
  { step: 3, actor: 'user', storage: 'l1' },
  { step: 4, actor: 'observer', storage: 'l1' },
  { step: 5, actor: 'l1', storage: 'l1', contract: 'L1Vault' },
];

// Data Flow Diagram Component
function DataFlowDiagram() {
  const t = useTranslations('ecosystemTechnical');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Globe className="w-5 h-5 text-gold" />
        {t('dataFlow.title')}
      </h3>

      <div className="relative">
        <div className="space-y-4">
          {/* User Layer */}
          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="w-5 h-5 text-success" />
              <h4 className="font-semibold text-success">{t('dataFlow.userLayer.title')}</h4>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="font-medium mb-1">{t('dataFlow.userLayer.keypair')}</div>
                <div className="text-xs text-foreground-secondary flex items-center gap-1">
                  <Key className="w-3 h-3 text-hinomaru" />
                  <TechTerm term="Dilithium" tooltipKey="dilithium">Dilithium-III</TechTerm> (FIPS 204)
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="font-medium mb-1">{t('dataFlow.userLayer.signing')}</div>
                <div className="text-xs text-foreground-secondary">{t('dataFlow.userLayer.signingDesc')}</div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="font-medium mb-1">{t('dataFlow.userLayer.storage')}</div>
                <div className="text-xs text-foreground-secondary">{t('dataFlow.userLayer.storageDesc')}</div>
              </div>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-gold animate-bounce" />
          </div>

          {/* L3 Layer */}
          <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="w-5 h-5 text-gold" />
              <h4 className="font-semibold text-gold">
                <TechTerm term="L3" tooltipKey="l3">L3</TechTerm>: Aegis Chain
              </h4>
            </div>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="font-medium mb-1">{t('dataFlow.l3Layer.consensus')}</div>
                <div className="text-xs text-foreground-secondary">
                  <TechTerm term="PBFT" tooltipKey="pbft">PBFT</TechTerm> (4 nodes, 3/4 sigs)
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="font-medium mb-1">{t('dataFlow.l3Layer.vrf')}</div>
                <div className="text-xs text-foreground-secondary flex items-center gap-1">
                  <Zap className="w-3 h-3 text-gold" />
                  Chainlink <TechTerm term="VRF" tooltipKey="vrf">VRF</TechTerm>
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="font-medium mb-1">{t('dataFlow.l3Layer.stateRoot')}</div>
                <div className="text-xs text-foreground-secondary flex items-center gap-1">
                  <Hash className="w-3 h-3 text-hinomaru" />
                  SHA3-256 SR_0
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="font-medium mb-1">{t('dataFlow.l3Layer.records')}</div>
                <div className="text-xs text-foreground-secondary">{t('dataFlow.l3Layer.recordsDesc')}</div>
              </div>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-hinomaru animate-bounce" />
          </div>

          {/* L1 Layer */}
          <div className="p-4 rounded-xl bg-hinomaru/10 border border-hinomaru/30">
            <div className="flex items-center gap-3 mb-3">
              <Server className="w-5 h-5 text-hinomaru" />
              <h4 className="font-semibold text-hinomaru">L1: Ethereum</h4>
            </div>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 bg-background/50 rounded-lg border-l-2 border-hinomaru">
                <div className="font-medium mb-1">L1Vault</div>
                <div className="text-xs text-foreground-secondary">lock() / unlock() / claim()</div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border-l-2 border-gold">
                <div className="font-medium mb-1">SPHINCSVerifier</div>
                <div className="text-xs text-foreground-secondary flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-gold" />
                  {t('dataFlow.l1Layer.verifier')}
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border-l-2 border-hinomaru">
                <div className="font-medium mb-1">ProverRegistry</div>
                <div className="text-xs text-foreground-secondary">{t('dataFlow.l1Layer.registry')}</div>
              </div>
              <div className="p-3 bg-background/50 rounded-lg border-l-2 border-warning">
                <div className="font-medium mb-1">
                  <TechTerm term="Timelock" tooltipKey="timelock">Timelock</TechTerm>
                </div>
                <div className="text-xs text-foreground-secondary">24h / 7d {t('dataFlow.l1Layer.immutable')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Animated Sequence Component
function AnimatedSequence({
  steps,
  sequenceKey,
  title,
  gas,
  time,
  triggerText,
}: {
  steps: SequenceStep[];
  sequenceKey: string;
  title: string;
  gas: string;
  time: string;
  triggerText?: string;
}) {
  const t = useTranslations('ecosystemTechnical');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const resetAnimation = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    setHasStarted(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < steps.length) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, steps.length]);

  const startAnimation = () => {
    setHasStarted(true);
    setIsPlaying(true);
    setCurrentStep(0);
  };

  const togglePlay = () => {
    if (!hasStarted) {
      startAnimation();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const getActorIcon = (actor: SequenceStep['actor']) => {
    switch (actor) {
      case 'user': return <Wallet className="w-4 h-4" />;
      case 'l3': return <Layers className="w-4 h-4" />;
      case 'l1': return <Server className="w-4 h-4" />;
      case 'prover': return <Cpu className="w-4 h-4" />;
      case 'observer': return <Eye className="w-4 h-4" />;
    }
  };

  const getActorColor = (actor: SequenceStep['actor'], isActive: boolean) => {
    const colors = {
      user: isActive ? 'bg-success/20 text-success border-success' : 'bg-success/10 text-success/50 border-success/30',
      l3: isActive ? 'bg-gold/20 text-gold border-gold' : 'bg-gold/10 text-gold/50 border-gold/30',
      l1: isActive ? 'bg-hinomaru/20 text-hinomaru border-hinomaru' : 'bg-hinomaru/10 text-hinomaru/50 border-hinomaru/30',
      prover: isActive ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-blue-500/10 text-blue-400/50 border-blue-500/30',
      observer: isActive ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'bg-purple-500/10 text-purple-400/50 border-purple-500/30',
    };
    return colors[actor];
  };

  const getCryptoIcon = (crypto?: SequenceStep['crypto']) => {
    if (!crypto) return null;
    switch (crypto) {
      case 'dilithium': return <Key className="w-3 h-3 text-hinomaru" />;
      case 'sphincs': return <ShieldCheck className="w-3 h-3 text-gold" />;
      case 'sha3': return <Hash className="w-3 h-3 text-hinomaru" />;
      case 'vrf': return <Zap className="w-3 h-3 text-gold" />;
    }
  };

  const getCryptoLabel = (crypto?: SequenceStep['crypto']) => {
    if (!crypto) return null;
    const labels = { dilithium: 'Dilithium', sphincs: 'SPHINCS+', sha3: 'SHA3-256', vrf: 'VRF' };
    return labels[crypto];
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {sequenceKey === 'lock' && <Lock className="w-6 h-6 text-hinomaru" />}
            {sequenceKey === 'unlock' && <Unlock className="w-6 h-6 text-gold" />}
            {sequenceKey === 'emergency' && <AlertTriangle className="w-6 h-6 text-warning" />}
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={togglePlay}
              className="flex items-center gap-2 h-11 px-4 min-w-[100px]"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? t('diagram.pause') : t('diagram.play')}
            </Button>
            <Button
              variant="ghost"
              onClick={resetAnimation}
              className="h-11 w-11 p-0"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-6 text-sm text-foreground-secondary">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            {gas}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {time}
          </span>
        </div>

        {triggerText && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
            {triggerText}
          </div>
        )}
      </div>

      {/* Sequence Steps */}
      <div className="p-6 bg-background-secondary/30">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = hasStarted && index <= currentStep;
            const isCurrent = hasStarted && index === currentStep;

            return (
              <div
                key={step.step}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-500',
                  isCurrent
                    ? 'border-gold bg-gold/5 shadow-lg shadow-gold/10 scale-[1.02]'
                    : isActive
                      ? 'border-border bg-background'
                      : 'border-border/30 bg-background/50 opacity-50'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Step number */}
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors',
                      isCurrent ? 'bg-gold text-background' : isActive ? 'bg-hinomaru text-white' : 'bg-border text-foreground-secondary'
                    )}
                  >
                    {step.step}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Actor + Crypto badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border', getActorColor(step.actor, isActive))}>
                        {getActorIcon(step.actor)}
                        {t(`diagram.actors.${step.actor}`)}
                      </span>
                      {step.crypto && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-background-secondary rounded-full text-xs border border-border">
                          {getCryptoIcon(step.crypto)}
                          {getCryptoLabel(step.crypto)}
                        </span>
                      )}
                      {step.storage && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-background-secondary rounded-full text-xs border border-border">
                          <Database className="w-3 h-3" />
                          {step.storage.toUpperCase()}
                          {step.contract && ` / ${step.contract}`}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <p className="font-medium text-sm mb-1">
                      {t(`sequences.${sequenceKey}.steps.${index}`)}
                    </p>

                    {/* Detail */}
                    <p className="text-xs text-foreground-secondary">
                      {t(`sequences.${sequenceKey}.details.${index}`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-hinomaru to-gold transition-all duration-500"
              style={{ width: hasStarted ? `${((currentStep + 1) / steps.length) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-foreground-secondary min-w-[40px] text-right">
            {hasStarted ? currentStep + 1 : 0} / {steps.length}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border/50 bg-background-secondary/20">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-hinomaru" />
            <span>Dilithium ({t('diagram.legend.userSig')})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>SPHINCS+ ({t('diagram.legend.proverSig')})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-hinomaru" />
            <span>SHA3 ({t('diagram.legend.hash')})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>{t('diagram.legend.storage')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TechnicalDetails() {
  const t = useTranslations('ecosystemTechnical');

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(188, 0, 45, 0.1), transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-border/50" role="banner">
        <div className="flex items-center gap-4">
          <Link href="/ecosystem" className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('backToEcosystem')}</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 relative flex items-center justify-center" aria-hidden="true">
            <div className="absolute inset-0 border border-gold rounded-full">
              <span className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
            </div>
            <div className="w-5 h-5 bg-hinomaru rounded-full" />
          </div>
          <span className="font-semibold">Quantum Shield</span>
        </div>
      </header>

      <main className="relative z-10 max-w-[1200px] mx-auto px-8 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-foreground-secondary text-lg">
            {t('description')}
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="p-6 mb-12">
          <h2 className="font-bold text-lg mb-4">{t('toc.title')}</h2>
          <nav className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
            {['dataFlow', 'architecture', 'crypto', 'sequences', 'roles', 'specs', 'principles', 'glossary'].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-secondary transition-colors text-sm"
              >
                <ArrowRight className="w-4 h-4 text-gold" />
                <span>{section === 'glossary' ? t('glossary.title') : t(`toc.${section}`)}</span>
              </a>
            ))}
          </nav>
        </Card>

        {/* Data Flow Section */}
        <section className="mb-16" id="dataFlow">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Globe className="w-6 h-6 text-gold" />
            {t('dataFlow.sectionTitle')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('dataFlow.sectionDesc')}
          </p>
          <DataFlowDiagram />
        </section>

        {/* Architecture Section */}
        <section className="mb-16" id="architecture">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Layers className="w-6 h-6 text-gold" />
            {t('architecture.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('architecture.description')}
          </p>

          <div className="space-y-4">
            {(['user', 'l3', 'l1'] as const).map((layer, index) => (
              <Card key={layer} className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      layer === 'l1' && 'bg-hinomaru/10',
                      layer === 'l3' && 'bg-gold/10',
                      layer === 'user' && 'bg-success/10'
                    )}
                  >
                    {layer === 'l1' && <Server className="w-6 h-6 text-hinomaru" />}
                    {layer === 'l3' && <Layers className="w-6 h-6 text-gold" />}
                    {layer === 'user' && <Users className="w-6 h-6 text-success" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {t(`architecture.layers.${layer}.title`)}
                    </h3>
                    <p className="text-sm text-foreground-secondary mb-3">
                      {t(`architecture.layers.${layer}.description`)}
                    </p>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {(t.raw(`architecture.layers.${layer}.components`) as string[]).map(
                        (component, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            <span className="text-foreground-secondary">{component}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
                {index < 2 && (
                  <div className="flex justify-center mt-4">
                    <div className="w-px h-8 bg-border" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Cryptography Section */}
        <section className="mb-16" id="crypto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Key className="w-6 h-6 text-gold" />
            {t('crypto.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('crypto.description')}
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {algorithms.map((algo) => (
              <Card key={algo} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {algo === 'dilithium' && <Key className="w-5 h-5 text-hinomaru" />}
                  {algo === 'sphincs' && <ShieldCheck className="w-5 h-5 text-gold" />}
                  {algo === 'sha3' && <Hash className="w-5 h-5 text-hinomaru" />}
                  <div>
                    <h3 className="font-bold">{t(`crypto.algorithms.${algo}.name`)}</h3>
                    <span className="text-xs text-gold">{t(`crypto.algorithms.${algo}.standard`)}</span>
                  </div>
                </div>
                <p className="text-sm text-gold font-medium mb-2">
                  {t(`crypto.algorithms.${algo}.use`)}
                </p>
                <p className="text-sm text-foreground-secondary">
                  {t(`crypto.algorithms.${algo}.description`)}
                </p>

                {/* Usage context */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="text-xs text-foreground-tertiary mb-2">{t('crypto.usedIn')}</div>
                  <div className="flex flex-wrap gap-1">
                    {algo === 'dilithium' && (
                      <>
                        <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded">{t('diagram.actors.user')}</span>
                        <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded">L3 Nodes</span>
                      </>
                    )}
                    {algo === 'sphincs' && (
                      <>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">Prover</span>
                        <span className="px-2 py-0.5 bg-hinomaru/10 text-hinomaru text-xs rounded">L1 Verifier</span>
                      </>
                    )}
                    {algo === 'sha3' && (
                      <>
                        <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded">L3 State</span>
                        <span className="px-2 py-0.5 bg-hinomaru/10 text-hinomaru text-xs rounded">L1 Merkle</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 border-danger/30 bg-danger/5">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-5 h-5 text-danger" />
              <h3 className="font-bold text-danger">{t('crypto.prohibited.title')}</h3>
            </div>
            <ul className="space-y-2">
              {(t.raw('crypto.prohibited.items') as string[]).map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Sequences Section - Animated */}
        <section className="mb-16" id="sequences">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-gold" />
            {t('sequences.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('sequences.description')}
          </p>

          <div className="space-y-8">
            <AnimatedSequence
              steps={lockSteps}
              sequenceKey="lock"
              title={t('sequences.lock.title')}
              gas={t('sequences.lock.gas')}
              time={t('sequences.lock.time')}
            />

            <AnimatedSequence
              steps={unlockSteps}
              sequenceKey="unlock"
              title={t('sequences.unlock.title')}
              gas={t('sequences.unlock.gas')}
              time={t('sequences.unlock.time')}
            />

            <AnimatedSequence
              steps={emergencySteps}
              sequenceKey="emergency"
              title={t('sequences.emergency.title')}
              gas={t('sequences.emergency.gas')}
              time={t('sequences.emergency.time')}
              triggerText={t('sequences.emergency.trigger')}
            />
          </div>
        </section>

        {/* Roles Section */}
        <section className="mb-16" id="roles">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-gold" />
            {t('roles.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('roles.description')}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {(['prover', 'observer', 'user'] as const).map((role) => (
              <Card key={role} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {role === 'prover' && <Cpu className="w-6 h-6 text-hinomaru" />}
                  {role === 'observer' && <Eye className="w-6 h-6 text-gold" />}
                  {role === 'user' && <Users className="w-6 h-6 text-hinomaru" />}
                  <h3 className="font-bold text-lg">{t(`roles.${role}.title`)}</h3>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t(`roles.${role}.description`)}
                </p>

                <h4 className="text-sm font-semibold mb-2 text-gold">
                  {role === 'user' ? t('roles.actionsLabel') : t('roles.responsibilitiesLabel')}
                </h4>
                <ul className="space-y-1 mb-4">
                  {(t.raw(`roles.${role}.${role === 'user' ? 'actions' : 'responsibilities'}`) as string[]).map(
                    (item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-foreground-secondary">{item}</span>
                      </li>
                    )
                  )}
                </ul>

                {role !== 'user' && (
                  <>
                    <h4 className="text-sm font-semibold mb-2 text-gold">{t('roles.requirementsLabel')}</h4>
                    <div className="text-sm text-foreground-secondary space-y-1">
                      <p>
                        <strong>{t('roles.stakeLabel')}:</strong> {t(`roles.${role}.requirements.stake`)}
                      </p>
                      {role === 'prover' && (
                        <>
                          <p>
                            <strong>HSM:</strong> {t('roles.prover.requirements.hsm')}
                          </p>
                          <p>
                            <strong>{t('roles.uptimeLabel')}:</strong> {t('roles.prover.requirements.uptime')}
                          </p>
                        </>
                      )}
                    </div>
                  </>
                )}

                {role === 'user' && (
                  <>
                    <h4 className="text-sm font-semibold mb-2 text-gold">{t('roles.benefitsLabel')}</h4>
                    <ul className="space-y-1">
                      {(t.raw('roles.user.benefits') as string[]).map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-foreground-secondary">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Specs Section */}
        <section className="mb-16" id="specs">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-gold" />
            {t('specs.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('specs.description')}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {specCategories.map((category) => (
              <Card key={category} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {category === 'timing' && <Clock className="w-5 h-5 text-hinomaru" />}
                  {category === 'signatures' && <Key className="w-5 h-5 text-gold" />}
                  {category === 'staking' && <Shield className="w-5 h-5 text-gold" />}
                  {category === 'limits' && <Server className="w-5 h-5 text-hinomaru" />}
                  <h3 className="font-bold">{t(`specs.${category}.title`)}</h3>
                </div>
                <div className="space-y-3">
                  {specItems[category].map((item) => (
                    <div key={item} className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t(`specs.${category}.items.${item}.label`)}</p>
                        <p className="text-xs text-foreground-tertiary">
                          {t(`specs.${category}.items.${item}.description`)}
                        </p>
                      </div>
                      <span className="font-bold text-gold ml-4">
                        {t(`specs.${category}.items.${item}.value`)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Why explanations for timing section */}
                {category === 'timing' && (
                  <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                    <WhyExplanation explanationKey="why24Hours" />
                    <WhyExplanation explanationKey="why7Days" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Principles Section */}
        <section className="mb-16" id="principles">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-gold" />
            {t('principles.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('principles.description')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map((cp) => (
              <Card key={cp} className="p-5 border-gold/30">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <h3 className="font-bold text-sm">{t(`principles.items.${cp}.title`)}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t(`principles.items.${cp}.description`)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Glossary Section */}
        <section className="mb-16" id="glossary">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-gold" />
            {t('glossary.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('glossary.description')}
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {['pbft', 'vrf', 'lattice', 'hashBased', 'shor', 'grover', 'timelock', 'slashing', 'hsm', 'l3'].map((termKey) => (
              <Card key={termKey} className="p-4">
                <h3 className="font-bold text-gold mb-2">{t(`glossary.terms.${termKey}.term`)}</h3>
                <p className="text-sm text-foreground-secondary">{t(`glossary.terms.${termKey}.definition`)}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Rewards Link Section */}
        <section className="mb-16">
          <Card className="p-6 border-gold/30 bg-gradient-to-r from-gold/5 to-transparent">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{t('rewards.title')}</h3>
                  <p className="text-sm text-foreground-secondary">
                    {t('rewards.description')}
                  </p>
                </div>
              </div>
              <Link href="/token-hub/landing">
                <Button variant="outline" className="flex items-center gap-2 h-11 whitespace-nowrap">
                  {t('rewards.link')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-hinomaru/10 to-gold/10 rounded-2xl p-12 border border-hinomaru/20">
          <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-foreground-secondary mb-8 max-w-lg mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/consumer/landing">
              <Button variant="primary" size="lg" className="flex items-center gap-2 h-12">
                {t('cta.getStarted')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/ecosystem">
              <Button variant="outline" size="lg" className="h-12">
                {t('cta.backToApps')}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-20 py-8">
        <div className="max-w-[1200px] mx-auto px-8 text-center text-sm text-foreground-tertiary">
          <p>{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
