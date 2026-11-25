export interface StackFitInput {
  cardHeights: readonly number[];
  headerHeight: number;
  viewportHeight: number;
  stackOffset: number;
  pinGap: number;
  bottomClearance: number;
}

export function canStack(input: StackFitInput): boolean {
  const {cardHeights, headerHeight, viewportHeight, stackOffset, pinGap, bottomClearance} = input;
  if (!cardHeights.length || !cardHeights.every(height => Number.isFinite(height) && height > 0)) return false;
  return Math.max(...cardHeights) + (cardHeights.length - 1) * stackOffset
    + headerHeight + pinGap + bottomClearance <= viewportHeight;
}
