import type { ReactNode } from "react"
import { motion, type MotionValue } from "motion/react"
import type { DragControls, PanInfo } from "motion/react"
import type { AppSwitcherDragTransition } from "./AppSwitcher"
import { CLICK_MOVEMENT_THRESHOLD_PX } from "./constants"
import { Rail } from "./Rail"

export type RailViewProps = {
  onPointerDown: (event: React.PointerEvent) => void
  overlayX: MotionValue<number>
  dragControls: DragControls
  totalMovementRef: { current: number }
  wasDragRef: { current: boolean }
  onDragEnd: () => void
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
  dragMomentum?: boolean
  dragTransition?: AppSwitcherDragTransition
}

export function RailView({
  onPointerDown,
  overlayX,
  dragControls,
  totalMovementRef,
  wasDragRef,
  onDragEnd,
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
  dragMomentum = true,
  dragTransition,
}: RailViewProps) {
  return (
    <>
      <div
        role="presentation"
        onPointerDown={onPointerDown}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          zIndex: 1000,
        }}
      />
      <motion.div
        drag="x"
        dragElastic={0.1}
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={dragMomentum}
        {...(dragTransition != null && { dragTransition })}
        onDrag={(_event: PointerEvent, info: PanInfo) => {
          totalMovementRef.current += info.delta.x
          if (Math.abs(totalMovementRef.current) > CLICK_MOVEMENT_THRESHOLD_PX) {
            wasDragRef.current = true
          }
        }}
        onDragEnd={onDragEnd}
        style={{
          position: "absolute",
          inset: 0,
          x: overlayX,
          cursor: "grab",
          touchAction: "pan-x",
          userSelect: "none",
          WebkitUserSelect: "none",
          zIndex: 999,
        }}
        whileDrag={{ cursor: "grabbing" }}
      />
      <Rail
        itemCount={itemCount}
        stepWidth={stepWidth}
        scaleFactor={scaleFactor}
        dragOffset={dragOffset}
        items={items}
        containerWidth={containerWidth}
        fade={fade}
        fadeStartDistance={fadeStartDistance}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
      />
    </>
  )
}
