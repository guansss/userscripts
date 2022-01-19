/// <reference types="vite/client" />

declare const DEBUG: boolean;

declare const __LOCALES__: Record<string, Record<string, any>>;

// an elegant fix for incorrect typing of setTimeout() and setInterval()
// https://stackoverflow.com/a/68296856
declare namespace NodeJS {
    type Timeout = number;
    type Timer = number;
}
