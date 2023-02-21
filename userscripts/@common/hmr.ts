export type OnInvalidateCallback = () => void

const onInvalidateCallbacks: OnInvalidateCallback[] = []

export function onInvalidate(cb: OnInvalidateCallback) {
  onInvalidateCallbacks.push(cb)
}

export function invalidate() {
  onInvalidateCallbacks.forEach((cb) => cb())
  onInvalidateCallbacks.length = 0
}
