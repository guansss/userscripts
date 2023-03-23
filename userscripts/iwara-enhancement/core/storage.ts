import { createStorage } from "../../@common/storage"

export const storage = createStorage<{
  v: string
  locale: string
  volume: number
  auto_down_enabled: boolean
  preferred_res: "Source" | "540p" | "360p"
  filename: string
  illegal_char_replacement: string
  dark: boolean
  like_rates: boolean
  like_rate_highlight: number
  like_rate_highlight_opacity: number
  player_size: number
  hide_list_options: boolean
}>(SCRIPT_ID, {
  v: GM_info.script.version,
  locale: navigator.language,
  volume: 0.5,
  auto_down_enabled: true,
  preferred_res: "Source",
  filename: "{DATE} {TITLE} - {AUTHOR} ({ID})",
  illegal_char_replacement: "_",
  dark: false,
  like_rates: true,
  like_rate_highlight: 4,
  like_rate_highlight_opacity: 0.2,
  player_size: 100,
  hide_list_options: false,
})
