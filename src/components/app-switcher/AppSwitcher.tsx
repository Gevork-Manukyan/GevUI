import {
  type ReactNode,
  type CSSProperties,
  Children,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  useDragControls,
} from "motion/react"
import {
  STEP_WIDTH,
  SCALE_FACTOR,
  CARD_WIDTH,
  CARD_HEIGHT,
  getCardIndexAtClientX,
} from "./utils"
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
  /**
   * When true, cards fade out near the container edges; when false, opacity is 1 until the viewport edge then 0.
   * @default true
   */
  fade?: boolean
  /**
   * Distance from center (in steps, same as layout) at which the fade starts. From center to this distance opacity is 1; from here to the edge, opacity goes to 0.
   * @default 1
   */
  fadeStartDistance?: number
  /**
   * Width (px) of each card slot. Should match your card content so the carousel centers correctly.
   * @default 260
   */
  cardWidth?: number
  /**
   * Height (px) of each card slot. Should match your card content.
   * @default 280
   */
  cardHeight?: number
  /**
   * Called when the user clicks a card (pointer down + up with minimal movement).
   * Receives the logical card index (0 to itemCount - 1). Not called when the user drags.
   */
  onCardSelect?: (index: number) => void
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
  fade = true,
  fadeStartDistance = 1,
  cardWidth = CARD_WIDTH,
  cardHeight = CARD_HEIGHT,
  onCardSelect,
  className,
  style,
}: AppSwitcherProps) {
  const CLICK_MOVEMENT_THRESHOLD_PX = 5
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerDownRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const wasDragRef = useRef(false)
  const totalMovementRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

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

  const handleClickOrDragEnd = useCallback(() => {
    if (!wasDragRef.current && pointerDownRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const totalOffset = scrollOffset.get() + (invertPointer ? overlayX.get() : -overlayX.get())
      const index = getCardIndexAtClientX(
        pointerDownRef.current.clientX,
        { left: rect.left, width: rect.width },
        totalOffset,
        stepWidth,
        itemCount,
      )
      scrollOffset.set(
        scrollOffset.get() - (invertPointer ? overlayX.get() : -overlayX.get()),
      )
      overlayX.set(0)
      onCardSelect?.(index)
    }
    pointerDownRef.current = null
    wasDragRef.current = false
    totalMovementRef.current = 0
  }, [
    scrollOffset,
    overlayX,
    invertPointer,
    stepWidth,
    itemCount,
    onCardSelect,
  ])

  const startDrag = useCallback(
    (pointerEvent: React.PointerEvent) => {
      overlayX.jump(overlayX.get())
      flushOverlay()
      dragControls.start(pointerEvent.nativeEvent)

      const onPointerUp = () => {
        handleClickOrDragEnd()
        document.removeEventListener("pointerup", onPointerUp)
        document.removeEventListener("pointercancel", onPointerUp)
      }
      document.addEventListener("pointerup", onPointerUp)
      document.addEventListener("pointercancel", onPointerUp)
    },
    [dragControls, overlayX, flushOverlay, handleClickOrDragEnd],
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
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
      }}
    >
      <div
        role="presentation"
        onPointerDown={(pointerEvent) => {
          pointerDownRef.current = {
            clientX: pointerEvent.clientX,
            clientY: pointerEvent.clientY,
          }
          wasDragRef.current = false
          totalMovementRef.current = 0
          startDrag(pointerEvent)
        }}
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
        onDrag={(_event, info) => {
          totalMovementRef.current += info.delta.x
          if (Math.abs(totalMovementRef.current) > CLICK_MOVEMENT_THRESHOLD_PX) {
            wasDragRef.current = true
          }
        }}
        onDragEnd={handleClickOrDragEnd}
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
        containerWidth={containerWidth}
        fade={fade}
        fadeStartDistance={fadeStartDistance}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
      />
    </div>
  )
}
