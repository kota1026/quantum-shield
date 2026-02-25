'use client';

import dynamic from 'next/dynamic';

const Onboarding = dynamic(
  () => import('@/components/consumer/Onboarding').then(mod => mod.Onboarding),
  { ssr: false }
);

export default function OnboardingPage() {
  return <Onboarding />;
}
