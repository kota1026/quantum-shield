'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@quantum-shield/ui';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'What is Quantum Shield?',
    answer:
      'Quantum Shield is a quantum-resistant asset protection protocol. It allows you to lock your digital assets (like ETH) and secure them with post-quantum cryptography. This means your assets will remain safe even when powerful quantum computers become available.',
  },
  {
    category: 'Getting Started',
    question: 'How do I get started?',
    answer:
      'Simply connect your Ethereum wallet, generate your quantum-resistant keys, and you are ready to lock your first assets. The onboarding process takes about 2 minutes.',
  },
  {
    category: 'Getting Started',
    question: 'What wallets are supported?',
    answer:
      'We support all major Ethereum wallets including MetaMask, WalletConnect-compatible wallets, Coinbase Wallet, and hardware wallets like Ledger and Trezor.',
  },

  // Security
  {
    category: 'Security',
    question: 'What is post-quantum cryptography?',
    answer:
      'Post-quantum cryptography refers to cryptographic algorithms that are secure against attacks from both classical and quantum computers. Traditional algorithms like ECDSA can be broken by quantum computers, but algorithms like Dilithium and SPHINCS+ cannot.',
  },
  {
    category: 'Security',
    question: 'Where are my private keys stored?',
    answer:
      'Your private keys are stored only in your browser (encrypted local storage). They never leave your device and are never sent to any server. We recommend backing up your keys to ensure you can always recover your assets.',
  },
  {
    category: 'Security',
    question: 'What happens if I lose my keys?',
    answer:
      'If you have a backup, you can restore your keys at any time. If you have lost both your keys and backup, you can use the emergency unlock feature, but it requires a 7-day waiting period and a bond deposit.',
  },
  {
    category: 'Security',
    question: 'Can Quantum Shield access my assets?',
    answer:
      'No. Quantum Shield is non-custodial. Your assets are held in smart contracts, and only you (with your keys) can initiate unlock requests. Even the Quantum Shield team cannot access your assets.',
  },

  // Locking & Unlocking
  {
    category: 'Locking & Unlocking',
    question: 'How do I lock my assets?',
    answer:
      'Go to the Dashboard, click "New Lock", enter the amount you want to lock, confirm the transaction in your wallet, and your assets are secured. The entire process takes about a minute.',
  },
  {
    category: 'Locking & Unlocking',
    question: 'How do I unlock my assets?',
    answer:
      'Click "Request Unlock" on any locked asset, sign with your Dilithium key, wait for prover verification, and then wait for the 24-hour time lock to expire. After that, you can claim your assets.',
  },
  {
    category: 'Locking & Unlocking',
    question: 'Why is there a 24-hour waiting period?',
    answer:
      'The time lock is a security feature. If your keys are compromised, you have 24 hours to notice and cancel the unlock request before your assets are released. This prevents instant theft even if an attacker gains access to your keys.',
  },
  {
    category: 'Locking & Unlocking',
    question: 'What is an emergency unlock?',
    answer:
      'Emergency unlock is for situations where you cannot access your normal keys but still have your wallet. It requires a 7-day waiting period and a bond deposit (5% of the amount or 0.5 ETH minimum). The bond is returned after successful unlock.',
  },

  // Provers & Verification
  {
    category: 'Provers & Verification',
    question: 'What are provers?',
    answer:
      'Provers are independent operators who verify unlock requests using their SPHINCS+ keys. They stake collateral to participate and earn fees for honest verification. Multiple provers must agree before an unlock is approved.',
  },
  {
    category: 'Provers & Verification',
    question: 'What happens if a prover acts maliciously?',
    answer:
      'Malicious provers face slashing. The penalty follows a quadratic formula (N² × 10%), meaning repeated offenses result in exponentially higher penalties. This strongly incentivizes honest behavior.',
  },
  {
    category: 'Provers & Verification',
    question: 'Can I become a prover?',
    answer:
      'Yes! Anyone can apply to become a prover. You will need to meet certain technical requirements, pass a verification process, and stake the minimum collateral. Visit the Prover Portal for more information.',
  },

  // Fees & Economics
  {
    category: 'Fees & Economics',
    question: 'What are the fees?',
    answer:
      'Locking is free (just gas costs). Unlocking has a small protocol fee that goes to provers and the protocol treasury. Emergency unlocks require a bond deposit that is returned after successful unlock.',
  },
  {
    category: 'Fees & Economics',
    question: 'What happens to the emergency bond?',
    answer:
      'If your emergency unlock is successful (no challenges), your full bond is returned. If someone successfully challenges your unlock (proves fraud), the bond is distributed to the challenger and slashed parties.',
  },
];

const categories = [...new Set(faqData.map((item) => item.category))];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const filteredFAQ = faqData.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === null || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const groupedFAQ = categories.reduce(
    (acc, category) => {
      acc[category] = filteredFAQ.filter((item) => item.category === category);
      return acc;
    },
    {} as Record<string, FAQItem[]>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Find answers to common questions about Quantum Shield.
        </p>

        {/* Search */}
        <div className="mx-auto max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 pb-8">
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* FAQ List */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {Object.entries(groupedFAQ).map(
            ([category, items]) =>
              items.length > 0 && (
                <div key={category}>
                  <h2 className="mb-4 text-xl font-semibold">{category}</h2>
                  <div className="space-y-2">
                    {items.map((item, index) => {
                      const globalIndex = faqData.indexOf(item);
                      const isExpanded = expandedItems.has(globalIndex);

                      return (
                        <Card key={globalIndex}>
                          <button
                            className="w-full text-left"
                            onClick={() => toggleItem(globalIndex)}
                          >
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                              <CardTitle className="text-base font-medium">
                                {item.question}
                              </CardTitle>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                              )}
                            </CardHeader>
                          </button>
                          {isExpanded && (
                            <CardContent className="pt-0">
                              <p className="text-muted-foreground">
                                {item.answer}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )
          )}

          {filteredFAQ.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No questions found matching your search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-8 text-center">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Still have questions?</CardTitle>
            <CardDescription>
              Our team is here to help. Reach out on Discord or check our
              documentation.
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
              <a
                href="https://docs.quantumshield.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
