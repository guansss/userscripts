import { computed, ref, watchEffect } from 'vue';
import { localize } from './i18n';
import { page, unpage } from './paging';
import { storage } from './store';

const toggleButtonID = 'enh-hide-options-btn';

page(['videoList', 'imageList'], 'hide_list_options', (pageID, onLeave) => {
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

    if (__DEV__) {
        onLeave(() => {
            toggleButton.remove();
        });
    }
});

if (__DEV__) {
    __ON_RELOAD__(() => {
        unpage('hide_list_options');
    });
}
