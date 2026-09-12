import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !['en', 'pt', 'emakua'].includes(locale)) {
    locale = 'pt';
  }

  return {
    locale,
    messages: (await import(`../locales/${locale}/common.json`)).default
  };
});
