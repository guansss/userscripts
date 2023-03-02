import { createI18n } from "vue-i18n"
import locales from "../i18n"
import { storage } from "./storage"

export const i18n = createI18n({
  locale: storage.get("locale"),
  fallbackLocale: "en",
  messages: locales,

  // disable warnings - I know what I'm doing!!
  silentFallbackWarn: true,
  silentTranslationWarn: true,
  warnHtmlInMessage: "off",
})

export function matchLocale(locale: string): string {
  return i18n.global.availableLocales.includes(locale as any)
    ? locale
    : i18n.global.availableLocales.find((loc: string) => locale.startsWith(loc)) || "en"
}

// shorthand helper making TypeScript happy
export function localize(message: string) {
  // @ts-ignore TS2589: Type instantiation is excessively deep and possibly infinite.
  return i18n.global.t(message)
}
