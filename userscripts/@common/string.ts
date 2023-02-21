import { clamp } from "./number"

export function formatDate(date: Date, delimiter = "/") {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ]
    .map((num) => String(num).padStart(2, "0"))
    .join(delimiter)
}

export function formatError(e: unknown, fallback = "Unknown error"): string {
  if (typeof e === "string") {
    return e || fallback
  }

  if (e !== null && typeof e === "object") {
    if (e instanceof Event && e.type === "error") {
      return "Failed to load resource"
    }

    if ((e as Error).message) {
      return (e as Error).message
    }

    const str = String(e)
    return str === "[object Object]" ? fallback : str
  }

  return fallback
}

export function adjustHexColor(color: string, amount: number) {
  return color.replace(/\w\w/g, (color) =>
    clamp(parseInt(color, 16) + amount, 0, 255)
      .toString(16)
      .padStart(2, "0")
  )
}
