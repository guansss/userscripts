// cached keys, since there will most likely be only one React instance in the page
let reactInstanceKey = '';
let reactEventHandlersKey = '';

export function getReactInstance(element: HTMLElement) {
    if (reactInstanceKey) {
        return (element as any)[reactInstanceKey];
    }

    for (const key of Object.keys(element)) {
        if (key.startsWith('__reactInternalInstance$')) {
            reactInstanceKey = key;
            return (element as any)[key];
        }
    }
}

export function getReactEventHandlers(element: HTMLElement) {
    if (reactEventHandlersKey) {
        return (element as any)[reactEventHandlersKey];
    }

    for (const key of Object.keys(element)) {
        if (key.startsWith('__reactEventHandlers$')) {
            reactEventHandlersKey = key;
            return (element as any)[key];
        }
    }
}
