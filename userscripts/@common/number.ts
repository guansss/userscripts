export function clamp(val: number, min: number, max: number) {
  return val < min ? min : val > max ? max : val
}

export function parseAbbreviatedNumber(str: string) {
  const units = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
  }

  let number = parseFloat(str)

  if (!isNaN(number)) {
    const unit = str.trim().slice(-1).toLowerCase()

    return number * ((units as any)[unit] || 1)
  }

  return NaN
}
