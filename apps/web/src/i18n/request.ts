import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the requestLocale to get the actual locale value
  const locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  // Load all translation namespaces
  const consumer = (await import(`../../locales/${locale}/consumer.json`)).default;
  const tokenHub = (await import(`../../locales/${locale}/token-hub.json`)).default;
  const governance = (await import(`../../locales/${locale}/governance.json`)).default;
  const prover = (await import(`../../locales/${locale}/prover.json`)).default;
  const observer = (await import(`../../locales/${locale}/observer.json`)).default;
  const explorer = (await import(`../../locales/${locale}/explorer.json`)).default;
  const enterprise = (await import(`../../locales/${locale}/enterprise.json`)).default;
  const admin = (await import(`../../locales/${locale}/admin.json`)).default;

  return {
    locale,
    messages: {
      // Files with namespace key at top level - spread them
      ...consumer,      // { "consumer": { ... } }
      ...tokenHub,      // { "token-hub": { ... } }
      ...prover,        // { "prover": { ... } }
      ...observer,      // { "observer": { ... } }
      ...admin,         // { "admin": { ... } }
      // Files without namespace key - wrap them
      governance,       // { "common": ..., "landing": ... }
      explorer,         // { "common": ... }
      enterprise,       // { "sidebar": ... }
    },
  };
});
