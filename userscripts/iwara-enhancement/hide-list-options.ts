import { computed, ref, watchEffect } from 'vue';
import { page, unpage } from './common';
import { localize } from './i18n';
import { storage } from './store';

const toggleButtonID = 'enh-hide-options-btn';

page(['videoList', 'imageList'], 'hide_list_options', () => {
    const hideOptions = ref(storage.get('hide_list_options'));
    const toggleText = computed(() => localize(hideOptions.value ? 'ui.show_list_options' : 'ui.hide_list_options'));

    const optionsContainer = $('.sortFilter').eq(0).closest('.col-lg-3');

    const toggleButton = $(
        `<button id="${toggleButtonID}" class="button button--primary button--ghost d-lg-none" type="button"></button>`
    )
        .insertBefore(optionsContainer)
        .on('click', () => (hideOptions.value = !hideOptions.value));

    watchEffect(() => {
        storage.set('hide_list_options', hideOptions.value);
        optionsContainer.toggleClass('d-none', hideOptions.value);
    });

    watchEffect(() => {
        toggleButton.text(toggleText.value);
    });
});

if (import.meta.hot) {
    import.meta.hot.accept(() => {});
    import.meta.hot.dispose(() => {
        unpage('hide_list_options');
        $('#' + toggleButtonID).remove();
    });
}
