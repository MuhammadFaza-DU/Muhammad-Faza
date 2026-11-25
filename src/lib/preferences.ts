export function resolveTheme(saved: unknown): "light" | "dark" {
  return saved === "dark" ? "dark" : "light";
}
