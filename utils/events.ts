let readyPromise: Promise<void>;

export function ready() {
    if (!readyPromise) {
        readyPromise = new Promise<void>((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => resolve);
            } else {
                resolve();
            }
        });
    }

    return readyPromise;
}
