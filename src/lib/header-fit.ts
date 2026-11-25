export function computeHeaderMode({
  fullHeight, navHeight, viewportHeight,
}: { fullHeight: number; navHeight: number; viewportHeight: number }): "normal" | "nav-only" | "scrolling-nav" {
  if (navHeight > viewportHeight * .45) return "scrolling-nav";
  return fullHeight > viewportHeight * .45 ? "nav-only" : "normal";
}
