'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { Shield, Wallet, Key, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@quantum-shield/ui';

type Step = 'connect' | 'generate' | 'backup' | 'complete';

const steps: { id: Step; title: string; description: string }[] = [
  {
    id: 'connect',
    title: 'Connect Wallet',
    description: 'Connect your Ethereum wallet to get started',
  },
  {
    id: 'generate',
    title: 'Generate Keys',
    description: 'Generate your quantum-resistant Dilithium keys',
  },
  {
    id: 'backup',
    title: 'Backup Keys',
    description: 'Securely backup your private key',
  },
  {
    id: 'complete',
    title: 'Ready!',
    description: 'You are ready to use Quantum Shield',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const [currentStep, setCurrentStep] = useState<Step>('connect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const [backedUp, setBackedUp] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    // Simulate key generation (will be replaced with actual Dilithium WASM)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setKeysGenerated(true);
    setIsGenerating(false);
  };

  const handleBackup = () => {
    // In real implementation, this would trigger download of encrypted key file
    setBackedUp(true);
  };

  const goToNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goToPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  // Auto-advance when wallet connects
  if (isConnected && currentStep === 'connect') {
    setCurrentStep('generate');
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{steps[currentStepIndex].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {currentStep === 'connect' && <Wallet className="h-12 w-12 text-qs-primary-500" />}
            {currentStep === 'generate' && <Key className="h-12 w-12 text-qs-primary-500" />}
            {currentStep === 'backup' && <Shield className="h-12 w-12 text-qs-warning-500" />}
            {currentStep === 'complete' && <CheckCircle className="h-12 w-12 text-qs-success-500" />}
          </div>
          <CardTitle className="text-2xl">{steps[currentStepIndex].title}</CardTitle>
          <CardDescription>{steps[currentStepIndex].description}</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Connect Wallet Step */}
          {currentStep === 'connect' && (
            <div className="space-y-4">
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                >
                  {connector.name}
                </Button>
              ))}
            </div>
          )}

          {/* Generate Keys Step */}
          {currentStep === 'generate' && (
            <div className="space-y-6">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertTitle>Quantum-Resistant Keys</AlertTitle>
                <AlertDescription>
                  We will generate a Dilithium-III key pair for you. This is a
                  NIST-approved post-quantum cryptographic algorithm that will
                  keep your assets secure against future quantum computers.
                </AlertDescription>
              </Alert>

              {keysGenerated ? (
                <div className="text-center">
                  <CheckCircle className="mx-auto mb-4 h-16 w-16 text-qs-success-500" />
                  <p className="font-medium">Keys Generated Successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    Your Dilithium-III key pair has been created.
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleGenerateKeys}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Keys'}
                </Button>
              )}
            </div>
          )}

          {/* Backup Step */}
          {currentStep === 'backup' && (
            <div className="space-y-6">
              <Alert variant="warning">
                <Shield className="h-4 w-4" />
                <AlertTitle>Important: Backup Your Keys</AlertTitle>
                <AlertDescription>
                  Your private key is stored locally in your browser. If you
                  lose access to this device, you will need your backup to
                  recover your assets. Store it securely!
                </AlertDescription>
              </Alert>

              {backedUp ? (
                <div className="text-center">
                  <CheckCircle className="mx-auto mb-4 h-16 w-16 text-qs-success-500" />
                  <p className="font-medium">Backup Downloaded!</p>
                  <p className="text-sm text-muted-foreground">
                    Store your backup file in a safe place.
                  </p>
                </div>
              ) : (
                <Button className="w-full" onClick={handleBackup}>
                  Download Encrypted Backup
                </Button>
              )}
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="space-y-6 text-center">
              <p className="text-lg">
                Congratulations! You are now ready to use Quantum Shield.
              </p>
              <Button
                size="lg"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={goToPrev}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep !== 'complete' && (
          <Button
            onClick={goToNext}
            disabled={
              (currentStep === 'connect' && !isConnected) ||
              (currentStep === 'generate' && !keysGenerated) ||
              (currentStep === 'backup' && !backedUp)
            }
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
