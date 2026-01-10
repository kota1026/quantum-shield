import Link from 'next/link';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Clock,
  Users,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@quantum-shield/ui';

const steps = [
  {
    icon: Key,
    title: '1. Generate Quantum-Resistant Keys',
    description:
      'When you connect your wallet, we generate a Dilithium-III key pair. This is a NIST-approved post-quantum cryptographic algorithm.',
    details: [
      'Your private key stays in your browser only',
      'Never sent to any server',
      'Backup is encrypted and can be restored',
    ],
  },
  {
    icon: Lock,
    title: '2. Lock Your Assets',
    description:
      'Deposit your assets into the Quantum Shield vault. They are now protected by quantum-resistant security.',
    details: [
      'Assets are stored in audited smart contracts',
      'Protected by multi-prover verification',
      'Visible on-chain at all times',
    ],
  },
  {
    icon: Clock,
    title: '3. Time-Lock Protection',
    description:
      'Every unlock request has a mandatory waiting period. This gives you time to react if your keys are compromised.',
    details: [
      'Normal unlock: 24-hour delay',
      'Emergency unlock: 7-day delay',
      'You can cancel during the waiting period',
    ],
  },
  {
    icon: Users,
    title: '4. Multi-Prover Verification',
    description:
      'Multiple independent provers must sign every unlock request. This prevents single points of failure.',
    details: [
      'Provers stake collateral as guarantee',
      'Slashing for malicious behavior',
      'Observers can challenge suspicious activity',
    ],
  },
  {
    icon: Unlock,
    title: '5. Secure Unlock',
    description:
      'After the time lock expires and provers have verified your request, your assets are returned to your wallet.',
    details: [
      'Full amount returned',
      'No custodial risk',
      'Completely transparent process',
    ],
  },
];

const securityFeatures = [
  {
    icon: Shield,
    title: 'Post-Quantum Cryptography',
    description:
      'Uses NIST-approved algorithms (Dilithium-III, SPHINCS+) that are resistant to quantum computer attacks.',
  },
  {
    icon: Clock,
    title: 'Time Locks',
    description:
      'Mandatory waiting periods for all unlocks. Even if your keys are compromised, you have time to react.',
  },
  {
    icon: Users,
    title: 'Multi-Prover System',
    description:
      'Multiple independent parties must verify each transaction. No single point of failure.',
  },
  {
    icon: AlertTriangle,
    title: 'Slashing Mechanism',
    description:
      'Provers stake collateral. Malicious behavior results in quadratic slashing, ensuring honest operation.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          How Quantum Shield Works
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Understand the technology that keeps your assets safe from both
          today&apos;s threats and tomorrow&apos;s quantum computers.
        </p>
      </section>

      {/* Steps Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {steps.map((step, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-qs-primary-100 dark:bg-qs-primary-900">
                    <step.icon className="h-6 w-6 text-qs-primary-600 dark:text-qs-primary-400" />
                  </div>
                  <div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-qs-success-500" />
                      <span className="text-sm text-muted-foreground">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Security Features
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {securityFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="mb-2 h-10 w-10 text-qs-primary-500" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to get started?</CardTitle>
            <CardDescription>
              Protect your assets with quantum-resistant security today.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/onboarding">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/security">Learn About Security</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
