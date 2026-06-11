import { cookies } from "next/headers";
import type { Locale } from "./config";
import type { TranslationDict } from "./types";
import { locales, defaultLocale, COOKIE_NAME } from "./config";
import { getDict } from "./getDict";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(COOKIE_NAME)?.value as Locale | undefined;
  if (locale && locales.includes(locale)) return locale;
  return defaultLocale;
}

export type { Locale, TranslationDict };

export { defaultLocale, locales };

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export interface TFunction {
  (key: string, vars?: Record<string, string | number>): string;
  dict: TranslationDict;
}

export async function getTranslations(): Promise<TFunction> {
  const locale = await getLocale();
  const dict = await getDict(locale);

  const t = ((key: string, vars?: Record<string, string | number>) => {
    const parts = key.split(".");
    let val: unknown = dict;
    for (const part of parts) {
      if (val && typeof val === "object" && part in (val as Record<string, unknown>)) {
        val = (val as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    if (typeof val !== "string") return key;
    return vars ? interpolate(val, vars) : val;
  }) as TFunction;

  t.dict = dict;
  return t;
}
