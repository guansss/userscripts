/// <reference types="vite/client" />

declare const __DEV__: boolean;

declare const __LOCALES__: Record<string, Record<string, any>>;

// called when the module itself is about to be hot reloaded
declare function __ON_RELOAD__(callback: () => void);

// an elegant fix for incorrect typing of setTimeout() and setInterval()
// https://stackoverflow.com/a/68296856
declare namespace NodeJS {
    type Timeout = number;
    type Timer = number;
}
