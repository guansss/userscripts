export function onClickOutside(el: HTMLElement, callback: (e: MouseEvent) => void) {
    document.addEventListener('click', handler);

    function handler(e: MouseEvent) {
        if (!el.contains(e.target as any)) {
            document.removeEventListener('click', handler);
            callback(e);
        }
    }
}
