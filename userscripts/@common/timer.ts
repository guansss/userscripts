import { ON_RELOAD } from "./env"

/**
 * A canceled Promise will not trigger then/catch/finally. Cancels on HMR by default.
 */
export class CancelablePromise<T> extends Promise<T> {
  cancelOnReload = true

  private _canceled = false

  get canceled() {
    return this._canceled
  }

  constructor(executor: () => Generator<unknown, T> | AsyncGenerator<unknown, T>) {
    super(async (resolve, reject) => {
      const generator = executor()

      try {
        while (!this._canceled) {
          const result = await generator.next()

          if (result.done) {
            resolve(result.value)
            break
          }
        }
      } catch (e) {
        reject(e)
      }
    })

    ON_RELOAD(() => {
      if (this.cancelOnReload) {
        this.cancel()
      }
    })
  }

  cancel() {
    this._canceled = true
  }

  withCanceler(canceler: (onCancel: () => void) => void) {
    canceler(() => this.cancel())
    return this
  }
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
export function until<T>(fn: () => T, interval: number): CancelablePromise<NonNullable<T>> {
  const promise = new CancelablePromise<NonNullable<T>>(function* () {
    while (true) {
      const result = fn()

      if (result) {
        return result
      }

      yield delay(interval)
    }
  })

  return promise
}

/**
 * Periodically calls given function until the returned jQuery object is not empty.
 * @returns A CancelablePromise that resolves with the jQuery object.
 */
export function until$<T extends JQuery>(fn: () => T, interval: number): CancelablePromise<T> {
  return until(() => {
    const result = fn()

    if (result.length) {
      return result
    }
  }, interval)
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
