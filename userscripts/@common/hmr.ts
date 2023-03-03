interface WebpackModule extends Omit<NodeModule, "children"> {
  children: (string | number)[]
}

export function enableHMR(_module: NodeModule) {
  const module = _module as unknown as WebpackModule

  if (!module.hot) {
    throw new Error("HMR is not enabled")
  }

  const handler = (status: webpack.HotUpdateStatus) => {
    if (status === "prepare") {
      module.hot.removeStatusHandler(handler)

      const getModule = (id: string | number) => require.cache[id] as WebpackModule | undefined

      const deps = new Set<WebpackModule>()

      const collectDeps = (mod: WebpackModule | undefined) => {
        if (mod && !deps.has(mod)) {
          deps.add(mod)
          mod.children?.forEach((id) => collectDeps(getModule(id)))
        }
      }

      collectDeps(module)

      deps.forEach((mod) => {
        const isSelf = mod.id === module.id

        if (!isSelf) {
          mod?.hot?.invalidate()
        }
      })
    }
  }

  module.hot.addStatusHandler(handler)
  module.hot.accept()
}
