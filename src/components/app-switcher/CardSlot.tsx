import type { ReactNode } from "react"
import { motion, useTransform, type MotionValue } from "motion/react"
import {
  CARD_WIDTH,
  WINDOW_RADIUS,
  BASE_Z,
  getPositionInWindow,
} from "./utils"

export type CardSlotProps = {
  index: number
  n: number
  stepWidth: number
  scaleFactor: number
  dragOffset: MotionValue<number>
  children: ReactNode
}

export function CardSlot({
  index,
  n,
  stepWidth,
  scaleFactor,
  dragOffset,
  children,
}: CardSlotProps) {
  const x = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, n)
    return (position - center) * stepWidth
  })
  const scale = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, n)
    const distance = Math.abs(position - center)
    return Math.max(0.5, 1 - scaleFactor * distance)
  })
  const zIndex = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, n)
    return BASE_Z - Math.round(Math.abs(position - center))
  })
  const opacity = useTransform(dragOffset, (offset) => {
    const center = offset / stepWidth
    const position = getPositionInWindow(index, center, n)
    const distance = Math.abs(position - center)
    return distance <= WINDOW_RADIUS ? 1 : 0
  })

  return (
    <motion.div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CARD_WIDTH,
        height: 280,
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
