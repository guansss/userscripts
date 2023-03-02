declare module "*.css" {
  const content: Record<string, string>
  export default content
}

declare module "*?raw" {
  const content: string
  export default content
}

declare module "*?raw&literal" {
  const content: string
  export default content
}
