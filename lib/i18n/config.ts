export const locales = ["ru", "ky", "en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  ky: "Кыргызча",
  en: "English",
  zh: "中文",
};

export const localeFlags: Record<Locale, string> = {
  ru: "🇷🇺",
  ky: "🇰🇬",
  en: "🇬🇧",
  zh: "🇨🇳",
};

export const localeLabels: Record<Locale, string> = {
  ru: "Русский язык",
  ky: "Кыргыз тили",
  en: "English language",
  zh: "中文语言",
};

export const COOKIE_NAME = "NEXT_LOCALE";
