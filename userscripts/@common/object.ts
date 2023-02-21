export type FunctionKey<T> = keyof {
  [K in keyof T as T[K] extends Function ? K : never]: any
}

export function hookMethod<T extends Record<string, any>, K extends FunctionKey<T>>(
  object: T,
  method: K,
  callback: T[K]
) {
  const original = object[method]

  object[method] = function (this: T) {
    ;(callback as Function).apply(this, arguments)
    return original.apply(this, arguments)
  } as any
}
