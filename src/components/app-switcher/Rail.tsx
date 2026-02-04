import type { ReactNode } from "react"
import { motion, type MotionValue } from "motion/react"
import { CARD_WIDTH } from "./utils"
import { CardSlot } from "./CardSlot"

export type RailProps = {
  n: number
  stepWidth: number
  scaleFactor: number
  dragOffset: MotionValue<number>
  items: ReactNode[]
}

export function Rail({
  n,
  stepWidth,
  scaleFactor,
  dragOffset,
  items,
}: RailProps) {
  return (
    <motion.div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -CARD_WIDTH / 2,
        marginTop: -140,
        width: CARD_WIDTH,
        height: 280,
      }}
    >
      {items.map((child, i) => (
        <CardSlot
          key={i}
          index={i}
          n={n}
          stepWidth={stepWidth}
          scaleFactor={scaleFactor}
          dragOffset={dragOffset}
        >
          {child}
        </CardSlot>
      ))}
    </motion.div>
  )
}
