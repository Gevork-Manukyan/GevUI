import {
  type ReactNode,
  Children,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react"

const STEP_WIDTH = 280
const CARD_WIDTH = 260
const WINDOW_RADIUS = 2
const SCALE_FACTOR = 0.12
const BASE_Z = 100

function getPositionInWindow(
  childIndex: number,
  center: number,
  n: number,
): number {
  return (
    childIndex +
    n * Math.round((center - childIndex) / n)
  )
}

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

type RailProps = {
  n: number
  stepWidth: number
  scaleFactor: number
  dragOffset: MotionValue<number>
  items: ReactNode[]
}

function Rail({
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

type CardSlotProps = {
  index: number
  n: number
  stepWidth: number
  scaleFactor: number
  dragOffset: MotionValue<number>
  children: ReactNode
}

function CardSlot({
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
