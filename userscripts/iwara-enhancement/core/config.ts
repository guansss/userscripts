import { computed, ref, watchEffect } from 'vue';
import { i18n, matchLocale } from './i18n';
import { storage } from './store';

const locale = ref(storage.get('locale'));

watchEffect(() => {
    i18n.global.locale = locale.value;

    storage.set('locale', locale.value);
});

export function useConfigSettings() {
    // locale that will actually be used, with fallback applied
    const activeLocale = computed(() => matchLocale(locale.value));

    return {
        locale,
        activeLocale,
    };
}
