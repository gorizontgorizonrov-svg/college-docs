"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Locale } from "./config";
import type { TranslationDict } from "./types";
import { COOKIE_NAME } from "./config";
import { getDict } from "./getDict";

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

interface I18nContextValue {
  locale: Locale;
  dict: TranslationDict;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  initialDict,
  children,
}: {
  initialLocale: Locale;
  initialDict: TranslationDict;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dict, setDict] = useState<TranslationDict>(initialDict);

  const setLocale = useCallback(async (newLocale: Locale) => {
    document.cookie = `${COOKIE_NAME}=${newLocale};path=/;max-age=31536000`;
    const newDict = await getDict(newLocale);
    setLocaleState(newLocale);
    setDict(newDict);
    window.location.reload();
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
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
    },
    [dict]
  );

  return (
    <I18nContext.Provider value={{ locale, dict, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}

export type { Locale, TranslationDict };
