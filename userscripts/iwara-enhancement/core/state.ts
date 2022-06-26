import { reactive } from 'vue';

export const state = reactive({
    theme: 'light',
});

const storageTimer = setInterval(() => {
    state.theme = localStorage.theme;
}, 1000);

__ON_RELOAD__(() => {
    clearInterval(storageTimer);
});
