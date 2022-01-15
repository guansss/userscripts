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
