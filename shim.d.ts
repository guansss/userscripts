// shims for type hints in IDE
// see https://www.tampermonkey.net/documentation.php

declare const unsafeWindow: Window;

declare function GM_setValue(name: string, value: any): void

declare function GM_getValue<T>(name: string, defaultValue?: T): T

declare function GM_addStyle(css: string): HTMLStyleElement

declare function GM_getResourceText(name: string): string

declare function GM_download(details: {
    url: string,
    name?: string
    headers?: any
    saveAs?: boolean
    onerror?(error: 'not_enabled' | 'not_whitelisted' | 'not_permitted' | 'not_supported' | 'not_succeeded', details: { current?: string }): void
    onload?(): void
    onprogress?(): void
    ontimeout?(): void
}): {
    abort(): void
}
