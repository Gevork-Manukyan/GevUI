export const STEP_WIDTH = 280
export const CARD_WIDTH = 260
export const WINDOW_RADIUS = 2
export const SCALE_FACTOR = 0.12
export const BASE_Z = 100

export function getPositionInWindow(
  childIndex: number,
  center: number,
  n: number,
): number {
  return childIndex + n * Math.round((center - childIndex) / n)
}

