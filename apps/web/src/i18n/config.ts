export {
  DEFAULT_LOCALE,
  LOCALES,
  localeTags,
} from "../../../../scripts/catalog/locales.ts";
export type { Locale, LocalizedText } from "../../../../scripts/catalog/locales.ts";

import { DEFAULT_LOCALE, type Locale } from "../../../../scripts/catalog/locales.ts";

/** Endonyms: each language names itself as its own speakers write it. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
};

/** The default locale owns the bare paths; the others are prefixed. */
export function localeHref(locale: Locale, path = "/"): string {
  const suffix = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE ? suffix || "/" : `/${locale}${suffix}`;
}

/** Astro passes `undefined` for the default locale's empty rest segment. */
export function localeFromParam(param: string | undefined): Locale {
  return (param as Locale | undefined) ?? DEFAULT_LOCALE;
}

/** Open Graph wants underscore-separated language_TERRITORY pairs. */
export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  zh: "zh_CN",
  ja: "ja_JP",
};
