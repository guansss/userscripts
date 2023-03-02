export function enableHMR(module: NodeModule) {
  if (!module.hot) {
    throw new Error("HMR is not enabled")
  }

  const handler = (status: webpack.HotUpdateStatus) => {
    if (status === "prepare") {
      module.hot.removeStatusHandler(handler)

      const deps = new Set<NodeModule>()

      const collectDeps = (mod: NodeModule | undefined) => {
        if (mod && !deps.has(mod)) {
          deps.add(mod)
          mod.children.forEach(collectDeps)
        }
      }

      collectDeps(module)

      deps.forEach((mod) => {
        const isSelf = mod.id === module.id

        if (!isSelf) {
          mod?.hot.invalidate()
        }
      })
    }
  }

  module.hot.addStatusHandler(handler)
  module.hot.accept()
}
