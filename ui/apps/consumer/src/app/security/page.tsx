import Link from 'next/link';
import {
  Shield,
  Lock,
  Key,
  Clock,
  Users,
  AlertTriangle,
  Eye,
  CheckCircle,
  ArrowRight,
  Cpu,
  FileKey,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@quantum-shield/ui';

const cryptoAlgorithms = [
  {
    name: 'Dilithium-III',
    type: 'User Signatures',
    standard: 'FIPS 204',
    description:
      'A lattice-based digital signature scheme used for user authentication. Resistant to attacks from quantum computers.',
    icon: Key,
    badge: 'NIST Approved',
  },
  {
    name: 'SPHINCS+-128s',
    type: 'Prover Signatures',
    standard: 'FIPS 205',
    description:
      'A hash-based signature scheme used by provers. Provides long-term security against quantum threats.',
    icon: FileKey,
    badge: 'NIST Approved',
  },
  {
    name: 'SHA3-256',
    type: 'State Hashing',
    standard: 'FIPS 202',
    description:
      'A cryptographic hash function used for state verification. Quantum-resistant due to 256-bit security level.',
    icon: Shield,
    badge: 'NIST Standard',
  },
];

const securityLayers = [
  {
    icon: Key,
    title: 'Self-Custody',
    description:
      'Your private keys never leave your device. We cannot access your assets, and neither can anyone else without your keys.',
    color: 'text-qs-primary-500',
  },
  {
    icon: Clock,
    title: 'Time Lock Protection',
    description:
      'Every unlock has a mandatory waiting period. Normal unlocks require 24 hours, emergency unlocks require 7 days.',
    color: 'text-qs-secondary-500',
  },
  {
    icon: Users,
    title: 'Multi-Prover Verification',
    description:
      'Multiple independent provers must verify each unlock request. No single party can compromise your assets.',
    color: 'text-qs-success-500',
  },
  {
    icon: AlertTriangle,
    title: 'Slashing Mechanism',
    description:
      'Provers stake collateral. Malicious behavior triggers quadratic slashing (N² × 10%), ensuring honesty.',
    color: 'text-qs-warning-500',
  },
  {
    icon: Eye,
    title: 'Observer Network',
    description:
      'Anyone can monitor the system and challenge suspicious activity. Successful challenges are rewarded.',
    color: 'text-qs-info-500',
  },
  {
    icon: Cpu,
    title: 'On-Chain Transparency',
    description:
      'All operations are verifiable on-chain. Nothing happens in secret, and everything can be audited.',
    color: 'text-qs-error-500',
  },
];

const threatProtection = [
  {
    threat: 'Quantum Computer Attack',
    protection: 'NIST-approved post-quantum algorithms (Dilithium, SPHINCS+)',
    status: 'Protected',
  },
  {
    threat: 'Key Compromise',
    protection: '24h/7d time locks give you time to react',
    status: 'Protected',
  },
  {
    threat: 'Prover Collusion',
    protection: 'Multi-prover system with quadratic slashing',
    status: 'Protected',
  },
  {
    threat: 'Smart Contract Bug',
    protection: 'Formal verification and multiple audits',
    status: 'Protected',
  },
  {
    threat: 'Centralization Risk',
    protection: 'Decentralized prover network with permissionless entry',
    status: 'Protected',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Shield className="mx-auto mb-6 h-16 w-16 text-qs-primary-500" />
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Security Architecture
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Quantum Shield is built with security-first principles. Learn about
          the multiple layers of protection that keep your assets safe.
        </p>
      </section>

      {/* Quantum-Resistant Cryptography */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold">
          Quantum-Resistant Cryptography
        </h2>
        <p className="mb-8 max-w-3xl text-muted-foreground">
          We use only NIST-approved post-quantum cryptographic algorithms.
          These algorithms are designed to be secure against attacks from both
          classical and quantum computers.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {cryptoAlgorithms.map((algo) => (
            <Card key={algo.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <algo.icon className="h-10 w-10 text-qs-primary-500" />
                  <Badge variant="success">{algo.badge}</Badge>
                </div>
                <CardTitle>{algo.name}</CardTitle>
                <CardDescription>
                  {algo.type} • {algo.standard}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {algo.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Layers */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-6 text-2xl font-bold">Defense in Depth</h2>
        <p className="mb-8 max-w-3xl text-muted-foreground">
          Quantum Shield employs multiple independent security layers. Even if
          one layer is compromised, the others continue to protect your assets.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {securityLayers.map((layer, index) => (
            <Card key={index}>
              <CardHeader>
                <layer.icon className={`mb-2 h-10 w-10 ${layer.color}`} />
                <CardTitle>{layer.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {layer.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Threat Protection */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold">Threat Protection Matrix</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Threat</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Protection
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {threatProtection.map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium">{item.threat}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.protection}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Core Principles */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-6 text-2xl font-bold">Immutable Core Principles</h2>
        <p className="mb-8 max-w-3xl text-muted-foreground">
          These principles cannot be changed, even by governance vote. They are
          the foundation of Quantum Shield&apos;s security model.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 'CP-1', title: 'Complete Quantum Resistance' },
            { id: 'CP-2', title: 'Self-Custody' },
            { id: 'CP-3', title: 'Time Lock Existence' },
            { id: 'CP-4', title: 'Slashing Existence' },
            { id: 'CP-5', title: 'Full Transparency' },
          ].map((principle) => (
            <Card key={principle.id} className="bg-muted/30">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle className="h-5 w-5 text-qs-success-500" />
                <div>
                  <span className="font-mono text-sm text-muted-foreground">
                    {principle.id}
                  </span>
                  <p className="font-medium">{principle.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              Ready to secure your assets?
            </CardTitle>
            <CardDescription>
              Experience quantum-resistant security for yourself.
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
              <Link href="/faq">Read FAQ</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
