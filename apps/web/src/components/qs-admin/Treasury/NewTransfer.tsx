'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Send,
  Wallet,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const WALLETS = [
  { key: 'main', balance: '50,000 ETH' },
  { key: 'operational', balance: '12,500 ETH' },
  { key: 'grants', balance: '8,000 ETH' },
  { key: 'insurance', balance: '25,000 ETH' },
  { key: 'emergency', balance: '5,000 ETH' },
];

export function NewTransfer() {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');

  const [fromWallet, setFromWallet] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  const selectedFromWallet = WALLETS.find(w => w.key === fromWallet);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/qs-admin/treasury/transfers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Send className="h-6 w-6 text-hinomaru" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('newTransfer.title')}</h1>
            <p className="text-foreground-secondary">{t('newTransfer.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.transferInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Wallet */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('newTransfer.fromWallet')}</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {WALLETS.map((wallet) => (
                    <button
                      key={wallet.key}
                      onClick={() => setFromWallet(wallet.key)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-colors',
                        fromWallet === wallet.key
                          ? 'border-hinomaru bg-hinomaru/5'
                          : 'border-border hover:border-foreground-tertiary'
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Wallet className={cn('h-5 w-5', fromWallet === wallet.key ? 'text-hinomaru' : 'text-foreground-tertiary')} />
                        <span className="font-medium">{t(`wallets.${wallet.key}`)}</span>
                      </div>
                      <p className="text-sm text-foreground-secondary mt-1">{wallet.balance}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transfer Arrow */}
              <div className="flex justify-center">
                <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-foreground-tertiary rotate-90" />
                </div>
              </div>

              {/* To Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('newTransfer.toAddress')}</label>
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={toAddress}
                    onChange={(e) => {
                      setToAddress(e.target.value);
                      setToWallet('');
                    }}
                    placeholder={t('newTransfer.enterAddress')}
                    className="font-mono"
                  />
                  <p className="text-sm text-foreground-secondary text-center">or</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {WALLETS.filter(w => w.key !== fromWallet).map((wallet) => (
                      <button
                        key={wallet.key}
                        onClick={() => {
                          setToWallet(wallet.key);
                          setToAddress('');
                        }}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-colors',
                          toWallet === wallet.key
                            ? 'border-success bg-success/5'
                            : 'border-border hover:border-foreground-tertiary'
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <Wallet className={cn('h-4 w-4', toWallet === wallet.key ? 'text-success' : 'text-foreground-tertiary')} />
                          <span className="text-sm font-medium">{t(`wallets.${wallet.key}`)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('newTransfer.amount')}</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('newTransfer.enterAmount')}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary">ETH</span>
                </div>
                {selectedFromWallet && (
                  <p className="text-sm text-foreground-tertiary">
                    Available: {selectedFromWallet.balance}
                  </p>
                )}
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('newTransfer.purpose')}</label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={t('newTransfer.enterPurpose')}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Link href="/qs-admin/treasury/transfers">
                  <Button variant="outline">{tCommon('cancel')}</Button>
                </Link>
                <Button
                  className="bg-gradient-hinomaru"
                  disabled={!fromWallet || (!toAddress && !toWallet) || !amount || !purpose}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('newTransfer.submit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card className="border-info bg-info/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-info mt-0.5" />
                <div>
                  <p className="font-medium text-info">Multi-sig Required</p>
                  <p className="text-sm text-foreground-secondary mt-1">
                    This transfer will require multiple approvals before execution based on the source wallet's threshold settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {(fromWallet || toAddress || toWallet || amount) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fromWallet && (
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('table.from')}</p>
                    <p className="font-medium">{t(`wallets.${fromWallet}`)}</p>
                  </div>
                )}
                {(toAddress || toWallet) && (
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('table.to')}</p>
                    <p className="font-medium font-mono">{toAddress || t(`wallets.${toWallet}`)}</p>
                  </div>
                )}
                {amount && (
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('table.amount')}</p>
                    <p className="text-xl font-bold">{amount} ETH</p>
                  </div>
                )}
                {purpose && (
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('table.purpose')}</p>
                    <p className="text-sm">{purpose}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
