import { createI18n } from 'vue-i18n';
import { storage } from './store';

export const i18n = createI18n({
    locale: storage.get('lang'),
    fallbackLocale: 'en',
    messages: __LOCALES__,

    // disable warnings - I know what I'm doing!!
    silentFallbackWarn: true,
    silentTranslationWarn: true,
    warnHtmlInMessage: 'off',
});

// shorthand helper making TypeScript happy
export function localize(message: string) {
    // @ts-ignore TS2589: Type instantiation is excessively deep and possibly infinite.
    return i18n.global.t(message);
}
