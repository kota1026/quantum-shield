'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Key,
  Shield,
  Download,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@quantum-shield/ui';

export default function KeysPage() {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<'public' | 'private' | null>(null);

  // Mock key data - in production, retrieve from browser storage
  const keyData = {
    algorithm: 'Dilithium-III (FIPS 204)',
    publicKey:
      'dil3-pub-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    privateKey:
      'dil3-priv-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    createdAt: '2026-01-01 12:00:00',
    lastUsed: '2026-01-05 14:30:00',
  };

  const handleCopy = async (type: 'public' | 'private') => {
    const text = type === 'public' ? keyData.publicKey : keyData.privateKey;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExport = () => {
    // Create a secure backup file
    const backup = {
      algorithm: keyData.algorithm,
      publicKey: keyData.publicKey,
      // In production, encrypt private key before export
      encryptedPrivateKey: 'ENCRYPTED_DATA',
      createdAt: keyData.createdAt,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-shield-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Key Management</h1>
          <p className="text-muted-foreground">
            Manage your Dilithium keys (CP-2: Self-Custody)
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Security Notice */}
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Security Notice</AlertTitle>
          <AlertDescription>
            Your private key never leaves your browser. Keep your backup secure -
            if you lose it, you&apos;ll need to use Emergency Unlock which requires
            a bond and 7-day waiting period.
          </AlertDescription>
        </Alert>

        {/* Key Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-qs-primary-500" />
              <div>
                <CardTitle className="text-lg">Your Dilithium Keys</CardTitle>
                <CardDescription>
                  Quantum-resistant cryptographic keys
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Algorithm Info */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-qs-success-500" />
                <span className="font-medium">{keyData.algorithm}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                NIST Post-Quantum Cryptography Standard
              </p>
            </div>

            {/* Public Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Public Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted p-3 font-mono text-xs">
                  {keyData.publicKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy('public')}
                >
                  {copied === 'public' ? (
                    <CheckCircle className="h-4 w-4 text-qs-success-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Safe to share - used to verify your signatures
              </p>
            </div>

            {/* Private Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Private Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted p-3 font-mono text-xs">
                  {showPrivateKey
                    ? keyData.privateKey
                    : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                >
                  {showPrivateKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy('private')}
                  disabled={!showPrivateKey}
                >
                  {copied === 'private' ? (
                    <CheckCircle className="h-4 w-4 text-qs-success-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-qs-error-500">
                NEVER share this - grants full access to your locked assets
              </p>
            </div>

            {/* Timestamps */}
            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{keyData.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Used</p>
                <p className="font-medium">{keyData.lastUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Backup
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <RefreshCw className="mr-2 h-4 w-4" />
              Rotate Keys (Coming Soon)
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Key rotation will require migrating all active locks
            </p>
          </CardContent>
        </Card>

        {/* CP-2 Notice */}
        <div className="rounded-lg bg-qs-primary-50 p-4 dark:bg-qs-primary-950">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 flex-shrink-0 text-qs-primary-500" />
            <div>
              <p className="font-medium text-qs-primary-700 dark:text-qs-primary-300">
                CP-2: Self-Custody Principle
              </p>
              <p className="text-sm text-qs-primary-600 dark:text-qs-primary-400">
                Your keys are stored only in your browser. Quantum Shield never
                has access to your private keys. You are in full control of your
                assets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
