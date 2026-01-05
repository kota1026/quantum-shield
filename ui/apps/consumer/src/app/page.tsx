import Link from 'next/link';
import { Shield, Lock, Unlock, ArrowRight, Clock, Users } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@quantum-shield/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mb-8 flex justify-center">
          <Shield className="h-20 w-20 text-qs-primary-500" />
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          Quantum Shield
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Protect your digital assets with quantum-resistant cryptography.
          Secure today, safe from tomorrow&apos;s threats.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/onboarding">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/how-it-works">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Lock className="mb-2 h-10 w-10 text-qs-primary-500" />
              <CardTitle>Quantum-Resistant Security</CardTitle>
              <CardDescription>
                Protected by NIST-approved Dilithium-III and SPHINCS+ algorithms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your assets are secured with post-quantum cryptography that will
                remain secure even when quantum computers become powerful enough
                to break traditional encryption.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="mb-2 h-10 w-10 text-qs-secondary-500" />
              <CardTitle>Time-Locked Protection</CardTitle>
              <CardDescription>
                24-hour delay for normal unlocks, 7-day emergency recovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in time locks give you time to react if your keys are
                compromised. Emergency recovery ensures you never lose access
                to your assets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-qs-success-500" />
              <CardTitle>Decentralized Verification</CardTitle>
              <CardDescription>
                Multi-prover signature system with economic guarantees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Multiple independent provers verify every transaction. Slashing
                mechanisms ensure honest behavior and protect against collusion.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="mx-auto max-w-2xl bg-qs-primary-50 dark:bg-qs-primary-950">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to secure your assets?</CardTitle>
            <CardDescription>
              Start protecting your digital assets with quantum-resistant security today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" asChild>
              <Link href="/onboarding">
                Connect Wallet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 Quantum Shield. All rights reserved.</p>
      </footer>
    </div>
  );
}
