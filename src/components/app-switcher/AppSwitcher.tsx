import {
  type ReactNode,
  Children,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  useDragControls,
} from "motion/react"
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
  const scrollOffset = useMotionValue(0)
  const overlayX = useMotionValue(0)
  const dragOffset = useTransform(
    [scrollOffset, overlayX],
    ([s, o]: number[]) => (s ?? 0) - (o ?? 0),
  )
  const dragControls = useDragControls()

  const flushOverlay = useCallback(() => {
    scrollOffset.set(scrollOffset.get() - overlayX.get())
    overlayX.set(0)
  }, [scrollOffset, overlayX])

  useMotionValueEvent(overlayX, "animationComplete", flushOverlay)

  const containerRef = useRef<HTMLDivElement>(null)
  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      overlayX.jump(overlayX.get())
      flushOverlay()
      dragControls.start(e.nativeEvent)
    },
    [dragControls, overlayX, flushOverlay],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) {
        e.preventDefault()
        scrollOffset.set(scrollOffset.get() - e.deltaX)
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [scrollOffset])

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
      <div
        role="presentation"
        onPointerDown={startDrag}
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
        style={{
          position: "absolute",
          inset: 0,
          x: overlayX,
          cursor: "grab",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
          zIndex: 999,
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
