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

  return {
    locale,
    messages: {
      ...consumer,
      ...tokenHub,
    },
  };
});
