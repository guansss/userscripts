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

// written by ChatGPT
export function adjustAlpha(color: string, alpha: number): string {
  if (alpha < 0 || alpha > 1) {
    throw new Error('Alpha value must be between 0 and 1');
  }

  let r: number, g: number, b: number;

  if (color.startsWith('#')) {
    if (color.length !== 7) {
      throw new Error('Invalid color format');
    }

    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

    if (!match) {
      throw new Error('Invalid color format');
    }

    r = parseInt(match[1]!, 10);
    g = parseInt(match[2]!, 10);
    b = parseInt(match[3]!, 10);
  } else {
    throw new Error('Invalid color format');
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Replaces characters that are forbidden in file systems.
 */
export function sanitizePath(path: string, illegalCharReplacement: string, keepDelimiters = true) {
  path = path.replace(/[*:<>?|]/g, illegalCharReplacement)

  if (!keepDelimiters) {
    path = path.replace(/[\\/]/g, illegalCharReplacement)
  }

  return path
}
