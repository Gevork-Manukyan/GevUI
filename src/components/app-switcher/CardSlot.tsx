import type { ReactNode } from "react"
import { motion, useTransform, type MotionValue } from "motion/react"
import { BASE_Z, getPositionInWindow } from "./utils"

export type CardSlotProps = {
  index: number
  itemCount: number
  stepWidth: number
  scaleFactor: number
  dragOffset: MotionValue<number>
  containerWidth: number
  fade: boolean
  fadeStartDistance: number
  cardWidth: number
  cardHeight: number
  children: ReactNode
}

export function CardSlot({
  index,
  itemCount,
  stepWidth,
  scaleFactor,
  dragOffset,
  containerWidth,
  fade,
  fadeStartDistance,
  cardWidth,
  cardHeight,
  children,
}: CardSlotProps) {
  const x = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, itemCount)
    return (position - center) * stepWidth
  })

  const scale = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, itemCount)
    const distance = Math.abs(position - center)
    return Math.max(0.5, 1 - scaleFactor * distance)
  })

  const zIndex = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, itemCount)
    return BASE_Z - Math.round(Math.abs(position - center))
  })

  const opacity = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, itemCount)
    const xPx = (position - center) * stepWidth
    const absX = Math.abs(xPx)

    if (containerWidth <= 0) return 1
    const viewportEdgePx = containerWidth / 2 + cardWidth / 2
    if (absX > viewportEdgePx) return 0
    if (!fade) return 1

    const fadeStartPx = fadeStartDistance * stepWidth
    if (absX <= fadeStartPx) return 1
    if (fadeStartPx >= viewportEdgePx) return 1
    return 1 - (absX - fadeStartPx) / (viewportEdgePx - fadeStartPx)
  })

  return (
    <motion.div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: cardWidth,
        height: cardHeight,
        x,
        scale,
        zIndex,
        opacity,
        transformOrigin: "center center",
      }}
    >
      {children}
    </motion.div>
  )
}
