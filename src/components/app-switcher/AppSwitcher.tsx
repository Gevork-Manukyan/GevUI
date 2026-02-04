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

/**
 * Props for the AppSwitcher infinite carousel component.
 */
export type AppSwitcherProps = {
  /** One or more card elements. Each direct child is rendered as a card in the carousel. */
  children: ReactNode
  /**
   * Horizontal distance (px) between card centers. Larger values spread cards apart.
   * @default 280
   */
  stepWidth?: number
  /**
   * How much cards shrink with distance from center (0 = no shrink, 1 = center only full size).
   * @default 0.12
   */
  scaleFactor?: number
  /**
   * When true, inverts touch/swipe direction: swipe right moves content right (default: content moves left).
   * @default false
   */
  invertSwipe?: boolean
  /**
   * When true, inverts click-and-drag direction: drag right moves content right (default: content moves left).
   * @default false
   */
  invertDrag?: boolean
  /**
   * When true, inverts horizontal wheel/trackpad scroll: scroll right moves content right (default: content moves left).
   * @default false
   */
  invertScroll?: boolean
}

/**
 * Infinite horizontal carousel with overlapping cards, similar to the iOS App Switcher.
 * The center card is largest; cards to the left and right scale down and sit behind (lower z-index).
 * Supports swipe (touch), click-and-drag (mouse), and horizontal wheel scroll, with optional momentum
 * and per-input direction inversion.
 */
export function AppSwitcher({
  children,
  stepWidth = STEP_WIDTH,
  scaleFactor = SCALE_FACTOR,
  invertSwipe = false,
  invertDrag = false,
  invertScroll = false,
}: AppSwitcherProps) {
  const items = useMemo(
    () => Children.toArray(children),
    [children],
  )
  const n = items.length
  const scrollOffset = useMotionValue(0)
  const overlayX = useMotionValue(0)
  const invertPointer = invertSwipe || invertDrag
  const dragOffset = useTransform(
    [scrollOffset, overlayX],
    ([s, o]: number[]) =>
      (s ?? 0) + (invertPointer ? (o ?? 0) : -(o ?? 0)),
  )
  const dragControls = useDragControls()

  const flushOverlay = useCallback(() => {
    scrollOffset.set(
      scrollOffset.get() + (invertPointer ? overlayX.get() : -overlayX.get()),
    )
    overlayX.set(0)
  }, [scrollOffset, overlayX, invertPointer])

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
        const delta = invertScroll ? e.deltaX : -e.deltaX
        scrollOffset.set(scrollOffset.get() + delta)
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [scrollOffset, invertScroll])

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
