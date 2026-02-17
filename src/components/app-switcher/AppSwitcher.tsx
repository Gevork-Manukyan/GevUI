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
  AnimatePresence,
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
  SWIPE_DOWN_THRESHOLD_PX,
  SWIPE_UP_THRESHOLD_PX,
} from "./constants"
import { getCardIndexAtClientX } from "./utils"
import { RailView } from "./RailView"

/**
 * Item shape when using the `items` prop. Each item defines the card content and optional destination.
 */
export type AppSwitcherItem = {
  /** What is shown in the carousel for this card. */
  content: ReactNode
  /** Optional route/URL to navigate to when the card is selected. */
  path?: string
  /** Optional component to show when the card is selected (parent decides where/how to render). */
  component?: ReactNode
}

/**
 * Props for the AppSwitcher infinite carousel component.
 */
export type AppSwitcherProps = {
  /** One or more card elements. Each direct child is rendered as a card in the carousel. Ignored when `items` is provided. */
  children?: ReactNode
  /**
   * Optional list of items (content + optional path/component). When provided, cards are derived from items; `children` is ignored.
   */
  items?: AppSwitcherItem[]
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
   * When true (default), selecting a card whose item has a `component` hides the rail and shows that component with a Back control.
   * When false, only onCardSelect is called and the parent handles behavior.
   * No effect when not using the `items` prop.
   */
  showComponentOnSelect?: boolean
  /**
   * Called when the user clicks a card (pointer down + up with minimal movement).
   * Receives the logical card index (0 to itemCount - 1) and, when using the `items` prop, the selected item. Not called when the user drags.
   */
  onCardSelect?: (index: number, item?: AppSwitcherItem) => void
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
  items: itemsProp,
  stepWidth = STEP_WIDTH,
  scaleFactor = SCALE_FACTOR,
  invertSwipe = false,
  invertDrag = false,
  invertScroll = false,
  fade = true,
  fadeStartDistance = 1,
  cardWidth = CARD_WIDTH,
  cardHeight = CARD_HEIGHT,
  showComponentOnSelect = true,
  onCardSelect,
  className,
  style,
}: AppSwitcherProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [activeComponent, setActiveComponent] = useState<ReactNode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerDownRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const componentViewPointerDownRef = useRef<{
    clientX: number
    clientY: number
  } | null>(null)
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

  const cardContents = useMemo(
    () =>
      itemsProp != null
        ? itemsProp.map((item) => item.content)
        : Children.toArray(children),
    [itemsProp, children],
  )
  const itemCount = cardContents.length
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

  const handleClickOrDragEnd = useCallback(
    (pointerUpEvent?: PointerEvent) => {
      const hasPointerUp = pointerUpEvent != null
      const hasPointerDown = pointerDownRef.current != null
      const hasContainer = containerRef.current != null

      let shouldSelect: boolean
      const pointerDown = pointerDownRef.current
      if (hasPointerUp && pointerDown) {
        const totalDeltaX = pointerUpEvent.clientX - pointerDown.clientX
        const totalDeltaY = pointerUpEvent.clientY - pointerDown.clientY
        const isTap = !wasDragRef.current
        const isSwipeDown =
          totalDeltaY > SWIPE_DOWN_THRESHOLD_PX &&
          totalDeltaY > Math.abs(totalDeltaX)
        const isSwipeUp =
          totalDeltaY < -SWIPE_UP_THRESHOLD_PX &&
          Math.abs(totalDeltaY) > Math.abs(totalDeltaX)
        shouldSelect =
          hasContainer && (isTap || isSwipeDown) && !isSwipeUp
      } else {
        shouldSelect = !wasDragRef.current && hasPointerDown && hasContainer
      }

      if (shouldSelect && pointerDownRef.current && containerRef.current) {
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
        const selectedItem = itemsProp?.[index]
        onCardSelect?.(index, selectedItem)
        if (showComponentOnSelect && selectedItem?.component) {
          setActiveComponent(selectedItem.component)
        }
      }
      pointerDownRef.current = null
      wasDragRef.current = false
      totalMovementRef.current = 0
    },
    [
      scrollOffset,
      overlayX,
      invertPointer,
      stepWidth,
      itemCount,
      itemsProp,
      showComponentOnSelect,
      onCardSelect,
    ],
  )

  const startDrag = useCallback(
    (pointerEvent: React.PointerEvent) => {
      overlayX.jump(overlayX.get())
      flushOverlay()
      dragControls.start(pointerEvent.nativeEvent)

      const onPointerUp = (event: PointerEvent) => {
        handleClickOrDragEnd(event)
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

  const showComponentView = activeComponent != null

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        maxHeight: "100vh",
        overflow: "hidden",
        cursor: showComponentView ? "default" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
      }}
    >
      <AnimatePresence mode="wait">
        {showComponentView ? (
          <motion.div
            key="component"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                touchAction: "pan-x",
              }}
              onPointerDown={(event) => {
            componentViewPointerDownRef.current = {
              clientX: event.clientX,
              clientY: event.clientY,
            }
            const onPointerUp = (pointerUpEvent: PointerEvent) => {
              const pointerDown = componentViewPointerDownRef.current
              if (pointerDown) {
                const totalDeltaX =
                  pointerUpEvent.clientX - pointerDown.clientX
                const totalDeltaY =
                  pointerUpEvent.clientY - pointerDown.clientY
                const isSwipeUp =
                  totalDeltaY < 0 &&
                  totalDeltaY < -SWIPE_UP_THRESHOLD_PX &&
                  Math.abs(totalDeltaY) > Math.abs(totalDeltaX)
                if (isSwipeUp) {
                  setActiveComponent(null)
                }
              }
              componentViewPointerDownRef.current = null
              document.removeEventListener("pointerup", onPointerUp)
              document.removeEventListener("pointercancel", onPointerUp)
            }
            document.addEventListener("pointerup", onPointerUp)
            document.addEventListener("pointercancel", onPointerUp)
          }}
        >
          <button
            type="button"
            onClick={() => setActiveComponent(null)}
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 1001,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              touchAction: "pan-x",
            }}
          >
            {activeComponent}
          </div>
        </div>
          </motion.div>
        ) : (
          <motion.div
            key="rail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <RailView
          onPointerDown={(pointerEvent) => {
            pointerDownRef.current = {
              clientX: pointerEvent.clientX,
              clientY: pointerEvent.clientY,
            }
            wasDragRef.current = false
            totalMovementRef.current = 0
            startDrag(pointerEvent)
          }}
          overlayX={overlayX}
          dragControls={dragControls}
          totalMovementRef={totalMovementRef}
          wasDragRef={wasDragRef}
          onDragEnd={() => handleClickOrDragEnd()}
          itemCount={itemCount}
          stepWidth={stepWidth}
          scaleFactor={scaleFactor}
          dragOffset={dragOffset}
          items={cardContents}
          containerWidth={containerWidth}
          fade={fade}
          fadeStartDistance={fadeStartDistance}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
