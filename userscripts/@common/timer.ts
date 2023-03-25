import { ON_RELOAD } from "./env"

export interface CancelablePromise<T> extends Promise<T> {
  /**
   * When canceled, the Promise will never resolve/reject (if this method is correctly implemented...).
   */
  cancel(): void
}

// sometimes I just don't want the script to depend on Lodash...
export function throttle<T extends (...args: any) => any>(
  fn: T,
  timeout: number
): (...args: Parameters<T>) => void {
  let timer = 0

  return (...args: Parameters<T>) => {
    if (timer) {
      return
    }

    timer = setTimeout(() => {
      fn.apply(null, args)

      timer = 0
    }, timeout)
  }
}

/**
 * Periodically calls given function until the return value is truthy.
 * @returns A CancelablePromise that resolves with the function's return value when truthy.
 */
export function until<T>(
  fn: () => T,
  interval = 0,
  cancelOnReload = true
): CancelablePromise<NonNullable<T>> {
  let cancelled = false

  if (cancelOnReload) {
    ON_RELOAD(() => (cancelled = true))
  }

  const STOP = Symbol()

  const promise = new Promise<NonNullable<T>>((resolve, reject) => {
    const run = () => {
      if (cancelled) {
        return STOP
      }

      const result = fn()

      if (result) {
        resolve(result as NonNullable<T>)
        return STOP
      }
    }

    const timerId = setInterval(() => {
      try {
        if (run() === STOP) {
          clearInterval(timerId)
        }
      } catch (e) {
        reject(e)
        clearInterval(timerId)
      }
    }, interval)
  })

  ;(promise as CancelablePromise<any>).cancel = () => (cancelled = true)

  return promise as CancelablePromise<NonNullable<T>>
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * @returns A Promise that resolves/rejects with given Promise, and rejects on HMR during dev.
 */
export function alive<T>(promise: Promise<T>): Promise<T> {
  return DEV
    ? new Promise((resolve, reject) => {
        promise.then(resolve, reject)

        ON_RELOAD(() => {
          ;(promise as CancelablePromise<any>).cancel?.()
          reject(new Error("Module reloaded."))
        })
      })
    : promise
}
