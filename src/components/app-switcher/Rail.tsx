import type { ReactNode } from "react"
import { motion, type MotionValue } from "motion/react"
import { CardSlot } from "./CardSlot"

export type RailProps = {
  itemCount: number
  stepWidth: number
  scaleFactor: number
  dragOffset: MotionValue<number>
  items: ReactNode[]
  containerWidth: number
  fade: boolean
  fadeStartDistance: number
  cardWidth: number
  cardHeight: number
}

export function Rail({
  itemCount,
  stepWidth,
  scaleFactor,
  dragOffset,
  items,
  containerWidth,
  fade,
  fadeStartDistance,
  cardWidth,
  cardHeight,
}: RailProps) {
  return (
    <motion.div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: cardWidth,
        height: cardHeight,
        transform: "translate(-50%, -50%)",
      }}
    >
      {items.map((child, index) => (
        <CardSlot
          key={index}
          index={index}
          itemCount={itemCount}
          stepWidth={stepWidth}
          scaleFactor={scaleFactor}
          dragOffset={dragOffset}
          containerWidth={containerWidth}
          fade={fade}
          fadeStartDistance={fadeStartDistance}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
        >
          {child}
        </CardSlot>
      ))}
    </motion.div>
  )
}
