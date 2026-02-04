import {
  type ReactNode,
  Children,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react"
import { motion, useMotionValue } from "motion/react"
import { STEP_WIDTH, SCALE_FACTOR } from "./utils"
import { Rail } from "./Rail"

export type AppSwitcherProps = {
  children: ReactNode
  stepWidth?: number
  scaleFactor?: number
}

export function AppSwitcher({
  children,
  stepWidth = STEP_WIDTH,
  scaleFactor = SCALE_FACTOR,
}: AppSwitcherProps) {
  const items = useMemo(
    () => Children.toArray(children),
    [children],
  )
  const n = items.length
  const dragOffset = useMotionValue(0)
  const overlayX = useMotionValue(0)

  const onDrag = useCallback(
    (_: PointerEvent, info: { delta: { x: number } }) => {
      dragOffset.set(dragOffset.get() - info.delta.x)
      overlayX.set(0)
    },
    [dragOffset, overlayX],
  )

  const onDragEnd = useCallback(() => {
    overlayX.set(0)
  }, [overlayX])

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) {
        e.preventDefault()
        dragOffset.set(dragOffset.get() - e.deltaX)
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [dragOffset])

  if (n === 0) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 480,
        height: 320,
        margin: "0 auto",
        overflow: "hidden",
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <motion.div
        drag="x"
        dragElastic={0.1}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        style={{
          position: "absolute",
          inset: 0,
          x: overlayX,
          cursor: "grab",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
          zIndex: 1000,
        }}
        whileDrag={{ cursor: "grabbing" }}
      />
      <Rail
        n={n}
        stepWidth={stepWidth}
        scaleFactor={scaleFactor}
        dragOffset={dragOffset}
        items={items}
      />
    </div>
  )
}
