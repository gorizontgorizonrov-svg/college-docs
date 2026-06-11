import type { Locale } from "./config";
import type { TranslationDict } from "./types";

const dictionaries = new Map<Locale, () => Promise<TranslationDict>>([
  ["ru", () => import("./dictionaries/ru").then((m) => m.default)],
  ["ky", () => import("./dictionaries/ky").then((m) => m.default)],
  ["en", () => import("./dictionaries/en").then((m) => m.default)],
  ["zh", () => import("./dictionaries/zh").then((m) => m.default)],
]);

export async function getDict(locale: Locale): Promise<TranslationDict> {
  const loader = dictionaries.get(locale);
  if (!loader) return (await import("./dictionaries/ru")).default;
  return loader();
}
