import { computed, ref, watchEffect } from "vue"
import { DEV_ONLY } from "../../@common/env"
import { localize } from "../core/i18n"
import { page } from "../core/paging"
import { storage } from "../core/storage"

const toggleButtonID = "enh-hide-options-btn"

page(["videoList", "imageList"], (pageID, onLeave) => {
  const hideOptions = ref(storage.get("hide_list_options"))
  const toggleText = computed(() =>
    localize(hideOptions.value ? "ui.show_list_options" : "ui.hide_list_options")
  )

  const optionsContainer = $(".sortFilter").eq(0).closest(".col-lg-3")

  const toggleButton = $(
    `<button id="${toggleButtonID}" class="button button--primary button--ghost d-lg-none" type="button"></button>`
  )
    .insertBefore(optionsContainer)
    .on("click", () => (hideOptions.value = !hideOptions.value))

  watchEffect(() => {
    storage.set("hide_list_options", hideOptions.value)
    optionsContainer.toggleClass("d-none", hideOptions.value)
  })

  watchEffect(() => {
    toggleButton.text(toggleText.value)
  })

  DEV_ONLY(
    onLeave(() => {
      toggleButton.remove()
    })
  )
})
