import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { onInvalidate } from './hmr';

let hasErrored = false;

interface Options {
    text: string;
    duration?: number;
    [key: string]: any;
}

function ensureOptions(options: Options | string): Options {
    return typeof options === 'string' ? { text: options } : options;
}

export function toast(options: Options | string) {
    options = ensureOptions(options);

    const toast = Toastify({
        duration: 2000,
        close: true,
        ...options,
        text: `[${GM_info.script.name}]:\n${options.text}`,
        style: {
            cursor: 'initial',
            ...options.style,
        },
    });

    toast.showToast();

    if (__DEV__) {
        onInvalidate(() => {
            toast.hideToast();
        });
    }
}

export function toastWarn(options: Options | string) {
    options = ensureOptions(options);

    toast({
        ...options,
        style: {
            background: '#ffbd69',
            ...options.style,
        },
    });
}

export function toastError(options: Options | string) {
    // only show the first error, ignore the rest
    if (hasErrored) {
        return;
    }

    hasErrored = true;

    options = ensureOptions(options);

    toast({
        ...options,
        duration: -1,
        style: {
            background: '#ff5f6d',
            ...options.style,
        },
    });

    if (__DEV__) {
        onInvalidate(() => {
            hasErrored = false;
        });
    }
}
