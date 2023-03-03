/// <reference types="webpack/module" />

declare const DEV: boolean

declare const __LOCALES__: Record<string, Record<string, any>>

// the ID (folder name) of the script that is accessing this variable
declare const SCRIPT_ID: string

// an elegant fix for incorrect typing of setTimeout() and setInterval()
// https://stackoverflow.com/a/68296856
declare namespace NodeJS {
  type Timeout = number
  type Timer = number
}

// https://github.com/apvarun/toastify-js#api
declare module "toastify-js" {
  interface Toastify {
    (options: Record<string, any>): Toastify

    showToast(): void
    hideToast(): void
  }

  const Toastify: Toastify
  export default Toastify
}
