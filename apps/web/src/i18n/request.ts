import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  // Load all translation namespaces
  // Note: JSON files may have a root key matching the namespace name (e.g., { "consumer": {...} })
  // We spread the nested content to avoid double-nesting
  const commonJson = (await import(`../../locales/${locale}/common.json`)).default;
  const consumerJson = (await import(`../../locales/${locale}/consumer.json`)).default;
  const qsHubJson = (await import(`../../locales/${locale}/qs-hub.json`)).default;
  const proverJson = (await import(`../../locales/${locale}/prover.json`)).default;
  const observerJson = (await import(`../../locales/${locale}/observer.json`)).default;
  const explorerJson = (await import(`../../locales/${locale}/explorer.json`)).default;
  const adminJson = (await import(`../../locales/${locale}/admin.json`)).default;
  const ecosystemJson = (await import(`../../locales/${locale}/ecosystem.json`)).default;
  const ecosystemTechnicalJson = (await import(`../../locales/${locale}/ecosystemTechnical.json`)).default;
  const ecosystemNewJson = (await import(`../../locales/${locale}/ecosystemNew.json`)).default;
  const qsAdminJson = (await import(`../../locales/${locale}/qs-admin.json`)).default;

  // Extract nested content if the JSON has a root key matching the namespace
  const common = commonJson.common || commonJson;
  const consumer = consumerJson.consumer || consumerJson;
  const qsHub = qsHubJson['qs-hub'] || qsHubJson;
  const prover = proverJson.prover || proverJson;
  const observer = observerJson.observer || observerJson;
  const explorer = explorerJson.explorer || explorerJson;
  const admin = adminJson.admin || adminJson;
  const ecosystem = ecosystemJson.ecosystem || ecosystemJson;
  const ecosystemTechnical = ecosystemTechnicalJson.ecosystemTechnical || ecosystemTechnicalJson;
  const ecosystemNew = ecosystemNewJson.ecosystemNew || ecosystemNewJson;
  const qsAdmin = qsAdminJson.qsAdmin || qsAdminJson;

  return {
    locale,
    messages: {
      common,
      consumer,
      'qs-hub': qsHub,
      prover,
      observer,
      explorer,
      admin,
      ecosystem,
      ecosystemTechnical,
      ecosystemNew,
      qsAdmin,
    },
  };
});
