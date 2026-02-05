import {
  type ReactNode,
  type CSSProperties,
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
  /** Optional CSS class name applied to the root container. */
  className?: string
  /** Optional inline styles applied to the root container. */
  style?: CSSProperties
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
  className,
  style,
}: AppSwitcherProps) {
  const items = useMemo(
    () => Children.toArray(children),
    [children],
  )
  const itemCount = items.length
  const scrollOffset = useMotionValue(0)
  const overlayX = useMotionValue(0)
  const invertPointer = invertSwipe || invertDrag
  const dragOffset = useTransform(
    [scrollOffset, overlayX],
    ([scrollValue, overlayValue]: number[]) =>
      (scrollValue ?? 0) + (invertPointer ? (overlayValue ?? 0) : -(overlayValue ?? 0)),
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
    (pointerEvent: React.PointerEvent) => {
      overlayX.jump(overlayX.get())
      flushOverlay()
      dragControls.start(pointerEvent.nativeEvent)
    },
    [dragControls, overlayX, flushOverlay],
  )

  useEffect(() => {
    const containerElement = containerRef.current
    if (!containerElement) return
    const onWheel = (wheelEvent: WheelEvent) => {
      if (wheelEvent.deltaX !== 0) {
        wheelEvent.preventDefault()
        const delta = invertScroll ? wheelEvent.deltaX : -wheelEvent.deltaX
        scrollOffset.set(scrollOffset.get() + delta)
      }
    }
    containerElement.addEventListener("wheel", onWheel, { passive: false })
    return () => containerElement.removeEventListener("wheel", onWheel)
  }, [scrollOffset, invertScroll])

  if (itemCount === 0) return null

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
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
        itemCount={itemCount}
        stepWidth={stepWidth}
        scaleFactor={scaleFactor}
        dragOffset={dragOffset}
        items={items}
      />
    </div>
  )
}
