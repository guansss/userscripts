import { Emitter } from "mitt"

export const ready = new Promise<void>((resolve) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => resolve)
  } else {
    resolve()
  }
})

export function once<T extends Record<string, any>, E extends keyof T>(
  emitter: Emitter<T>,
  event: E,
  listener: (data: T[E]) => void
): (data: T[E]) => void {
  const fn = (data: T[E]) => {
    emitter.off(event, fn)
    listener(data)
  }

  emitter.on(event, fn)

  return fn
}
