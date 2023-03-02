import { reactive } from "vue"
import { ON_RELOAD } from "../../@common/env"

export const state = reactive({
  theme: "light",
})

const storageTimer = setInterval(() => {
  state.theme = localStorage.theme
}, 1000)

ON_RELOAD(() => {
  clearInterval(storageTimer)
})
