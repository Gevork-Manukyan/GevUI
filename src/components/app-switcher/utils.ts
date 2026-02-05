export const STEP_WIDTH = 280
export const CARD_WIDTH = 260
export const CARD_HEIGHT = 280
export const SCALE_FACTOR = 0.12
export const BASE_Z = 100

export function getPositionInWindow(
  childIndex: number,
  center: number,
  itemCount: number,
): number {
  return childIndex + itemCount * Math.round((center - childIndex) / itemCount)
}

