export const LOCALES = ["en", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const localeTags: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  ja: "ja",
};

export type LocalizedText = Record<Locale, string>;
