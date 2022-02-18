import jQuery from 'jquery';

declare global {
    interface Window {
        $: typeof jQuery;
    }
}

window.$ = jQuery;
