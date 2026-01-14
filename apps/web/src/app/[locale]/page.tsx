import { redirect } from '@/i18n/routing';

// Redirect root to /consumer landing page
export default function HomePage() {
  redirect({ href: '/consumer', locale: 'ja' });
}
