/// <reference types="webpack/module" />

declare const DEV: boolean

declare const __LOCALES__: Record<string, Record<string, any>>

// the ID of current module, usually its absolute path
declare const __MODULE_ID__: string

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
