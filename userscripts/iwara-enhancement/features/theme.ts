import { watchEffect } from "vue"
import { adjustHexColor } from "../../@common/string"
import { state } from "../core/state"

watchEffect(updateTheme)

export function updateTheme() {
  const theme = state.theme
  const adjustmentSign = theme === "light" ? -1 : 1
  const bodyColor = getComputedStyle(document.body).getPropertyValue("--body")

  document.body.style.setProperty(
    "--enh-body-focus",
    adjustHexColor(bodyColor, adjustmentSign * 15)
  )
  document.body.style.setProperty(
    "--enh-body-highlight",
    adjustHexColor(bodyColor, adjustmentSign * 30)
  )
}
