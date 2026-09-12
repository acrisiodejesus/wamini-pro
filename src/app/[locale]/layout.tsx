import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Inter } from 'next/font/google';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import Providers from './providers';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import CookieConsent from '@/components/layout/CookieConsent';
import '../globals.css';

// Carrega Inter de forma self-hosted via next/font — elimina dependência de CDN
// e activa font-display:swap automaticamente
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
 
  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <AccessibilityPanel />
            <ServiceWorkerRegister />
            <CookieConsent />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
