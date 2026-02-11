export function getPositionInWindow(
  childIndex: number,
  center: number,
  itemCount: number,
): number {
  return childIndex + itemCount * Math.round((center - childIndex) / itemCount)
}

export type ContainerRect = { left: number; width: number }

/**
 * Returns the logical card index (0 to itemCount - 1) whose center is closest to the given clientX.
 * Uses the same layout math as CardSlot for consistency.
 */
export function getCardIndexAtClientX(
  clientX: number,
  containerRect: ContainerRect,
  totalOffsetPx: number,
  stepWidth: number,
  itemCount: number,
): number {
  const containerCenterX = containerRect.left + containerRect.width / 2
  const pointerXRelativeToCenter = clientX - containerCenterX
  const center = totalOffsetPx / stepWidth

  let closestIndex = 0
  let closestDistance = Infinity

  for (let index = 0; index < itemCount; index++) {
    const position = getPositionInWindow(index, center, itemCount)
    const cardCenterX = (position - center) * stepWidth
    const distance = Math.abs(cardCenterX - pointerXRelativeToCenter)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  return closestIndex
}

