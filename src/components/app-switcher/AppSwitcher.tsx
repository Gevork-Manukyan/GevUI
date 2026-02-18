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
  SCROLL_DOWN_THRESHOLD_PX,
  SCROLL_UP_THRESHOLD_PX,
} from "./constants"
import { getCardIndexAtClientX, getNearestCardCenterOffsetPx } from "./utils"
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
 * Options to tune drag momentum/inertia when the user releases. Passed to Motion's dragTransition.
 * Omitted properties use Motion's defaults.
 */
export type AppSwitcherDragTransition = {
  /** Affects how far the drag continues after release. */
  power?: number
  /** Time constant for velocity decay. */
  timeConstant?: number
  /** Stiffness of the bounce at the end of the inertia. */
  bounceStiffness?: number
  /** Damping of the bounce at the end of the inertia. */
  bounceDamping?: number
}

/**
 * Config for snap-to-center: when scrolling stops, animate the rail so the nearest card centers.
 * Omitted properties use defaults. Tween (duration/ease) takes precedence over spring if duration is set.
 */
export type AppSwitcherSnapToCenter = {
  /** Debounce delay (ms) after last wheel event before snapping. Not used for drag (snap runs when momentum ends). */
  delayMs?: number
  /** Only snap if current offset is more than this many px from the nearest card center. */
  thresholdPx?: number
  /** Tween duration in seconds. If set, tween is used and ease can be set. */
  duration?: number
  /** Easing for tween (e.g. [0.4, 0, 0.2, 1] or "easeOut"). Used when duration is set. */
  ease?: number[] | string
  /** Spring stiffness. Used when duration is not set. */
  stiffness?: number
  /** Spring damping. Used when duration is not set. */
  damping?: number
}

/**
 * Per-input scroll speed multipliers. Omitted keys default to 1.
 */
export type AppSwitcherScrollSpeed = {
  /** Wheel/trackpad horizontal scroll. */
  wheel?: number
  /** Touch swipe (drag). */
  swipe?: number
  /** Mouse (or pen) click-drag. */
  pointerDrag?: number
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
   * When true (default), tapping a card whose item has a `component` enters the component view.
   * When false, tap still selects (onCardSelect fires) but does not open the component.
   */
  tapToEnterComponent?: boolean
  /**
   * When true (default), swiping down on a card whose item has a `component` enters the component view.
   * When false, swipe-down still selects (onCardSelect fires) but does not open the component.
   */
  swipeDownToEnterComponent?: boolean
  /**
   * When true (default), scrolling down on the rail enters the center card's component.
   * When false, vertical scroll on the rail does not enter the component.
   */
  scrollDownToEnterComponent?: boolean
  /**
   * When true (default), scrolling up on the component view exits back to the carousel.
   * When false, vertical scroll on the component view does not exit.
   */
  scrollUpToExitComponent?: boolean
  /**
   * Called when the user clicks a card (pointer down + up with minimal movement).
   * Receives the logical card index (0 to itemCount - 1) and, when using the `items` prop, the selected item. Not called when the user drags.
   */
  onCardSelect?: (index: number, item?: AppSwitcherItem) => void
  /**
   * When true (default), drag continues with inertia after release. When false, drag stops immediately.
   * @default true
   */
  dragMomentum?: boolean
  /**
   * Optional config to tune the momentum/inertia feel when dragMomentum is true. Passed to Motion's dragTransition.
   */
  dragTransition?: AppSwitcherDragTransition
  /**
   * When true or a config object, when scrolling (wheel or drag) stops, the rail animates so the nearest card is centered.
   * @default false
   */
  snapToCenter?: boolean | AppSwitcherSnapToCenter
  /**
   * Multiplier for how far the rail moves per unit input. Number = same for all inputs; object = per-input (omitted keys default to 1).
   * @default 1
   */
  scrollSpeed?: number | AppSwitcherScrollSpeed
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
  tapToEnterComponent = true,
  swipeDownToEnterComponent = true,
  scrollDownToEnterComponent = true,
  scrollUpToExitComponent = true,
  dragMomentum = true,
  dragTransition,
  snapToCenter: snapToCenterProp = false,
  scrollSpeed: scrollSpeedProp = 1,
  onCardSelect,
  className,
  style,
}: AppSwitcherProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [activeComponent, setActiveComponent] = useState<ReactNode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wheelSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const speedConfig = useMemo(
    () =>
      typeof scrollSpeedProp === "number"
        ? { wheel: scrollSpeedProp, swipe: scrollSpeedProp, pointerDrag: scrollSpeedProp }
        : {
            wheel: scrollSpeedProp.wheel ?? 1,
            swipe: scrollSpeedProp.swipe ?? 1,
            pointerDrag: scrollSpeedProp.pointerDrag ?? 1,
          },
    [scrollSpeedProp],
  )

  const snapConfig = useMemo<AppSwitcherSnapToCenter | null>(
    () =>
      snapToCenterProp === true
        ? { delayMs: 120, thresholdPx: 2, stiffness: 300, damping: 30 }
        : typeof snapToCenterProp === "object" && snapToCenterProp != null
          ? snapToCenterProp
          : null,
    [snapToCenterProp],
  )
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
  const dragSpeedMultiplier = useMotionValue(1)
  const invertPointer = invertSwipe || invertDrag
  const dragOffset = useTransform(
    [scrollOffset, overlayX, dragSpeedMultiplier],
    ([scrollValue, overlayValue, dragMult]: number[]) =>
      (scrollValue ?? 0) +
      (invertPointer ? (overlayValue ?? 0) : -(overlayValue ?? 0)) *
        (dragMult ?? 1),
  )
  const dragControls = useDragControls()

  const flushOverlay = useCallback(() => {
    scrollOffset.set(
      scrollOffset.get() +
        (invertPointer ? overlayX.get() : -overlayX.get()) *
          dragSpeedMultiplier.get(),
    )
    overlayX.set(0)
  }, [scrollOffset, overlayX, invertPointer, dragSpeedMultiplier])

  const runSnap = useCallback(() => {
    if (snapConfig == null || activeComponent != null || itemCount === 0) return
    const currentOffset = scrollOffset.get()
    const targetOffset = getNearestCardCenterOffsetPx(currentOffset, stepWidth)
    const thresholdPx = snapConfig.thresholdPx ?? 0
    if (Math.abs(currentOffset - targetOffset) <= thresholdPx) return
    const stiffness = snapConfig.stiffness ?? 300
    const damping = snapConfig.damping ?? 30
    const duration = snapConfig.duration
    const ease = snapConfig.ease ?? [0.4, 0, 0.2, 1]

    if (duration != null && duration > 0) {
      const startOffset = scrollOffset.get()
      const startTime = performance.now()
      const durationMs = duration * 1000
      const step = (): void => {
        const elapsed = performance.now() - startTime
        const t = Math.min(elapsed / durationMs, 1)
        const easedT =
          typeof ease === "string"
            ? t
            : 1 - (1 - t) ** 3
        scrollOffset.set(startOffset + (targetOffset - startOffset) * easedT)
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    } else {
      const startOffset = scrollOffset.get()
      const startVelocity = 0
      let velocity = startVelocity
      let position = startOffset
      const step = (): void => {
        const delta = targetOffset - position
        const springForce = delta * (stiffness / 100)
        const dampingForce = -velocity * (damping / 10)
        velocity += springForce + dampingForce
        position += velocity * 0.016
        scrollOffset.set(position)
        if (Math.abs(delta) > 0.5 || Math.abs(velocity) > 0.5)
          requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
  }, [
    snapConfig,
    activeComponent,
    itemCount,
    scrollOffset,
    stepWidth,
  ])

  const runSnapRef = useRef(runSnap)
  useEffect(() => {
    runSnapRef.current = runSnap
  }, [runSnap])

  const flushOverlayThenSnap = useCallback(() => {
    flushOverlay()
    runSnapRef.current()
  }, [flushOverlay])

  useMotionValueEvent(overlayX, "animationComplete", flushOverlayThenSnap)

  const handleClickOrDragEnd = useCallback(
    (pointerUpEvent?: PointerEvent) => {
      const hasPointerUp = pointerUpEvent != null
      const hasPointerDown = pointerDownRef.current != null
      const hasContainer = containerRef.current != null

      let shouldSelect: boolean
      let isTap = false
      let isSwipeDown = false
      const pointerDown = pointerDownRef.current
      if (hasPointerUp && pointerDown) {
        const totalDeltaX = pointerUpEvent.clientX - pointerDown.clientX
        const totalDeltaY = pointerUpEvent.clientY - pointerDown.clientY
        isTap = !wasDragRef.current
        isSwipeDown =
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
        const totalOffset = dragOffset.get()
        const clientXForIndex =
          isSwipeDown ? rect.left + rect.width / 2 : pointerDownRef.current.clientX
        const index = getCardIndexAtClientX(
          clientXForIndex,
          { left: rect.left, width: rect.width },
          totalOffset,
          stepWidth,
          itemCount,
        )
        const selectedItem = itemsProp?.[index]
        const shouldEnterComponent = hasPointerUp
          ? (isTap && tapToEnterComponent) ||
            (isSwipeDown && swipeDownToEnterComponent)
          : tapToEnterComponent
        const enteringComponent =
          showComponentOnSelect &&
          selectedItem?.component &&
          shouldEnterComponent

        if (enteringComponent) {
          setActiveComponent(selectedItem.component)
        } else {
          scrollOffset.set(
            scrollOffset.get() +
              (invertPointer ? overlayX.get() : -overlayX.get()) *
                dragSpeedMultiplier.get(),
          )
          overlayX.set(0)
        }
        onCardSelect?.(index, selectedItem)
      }
      pointerDownRef.current = null
      wasDragRef.current = false
      totalMovementRef.current = 0
    },
    [
      dragOffset,
      scrollOffset,
      overlayX,
      invertPointer,
      dragSpeedMultiplier,
      stepWidth,
      itemCount,
      itemsProp,
      showComponentOnSelect,
      tapToEnterComponent,
      swipeDownToEnterComponent,
      onCardSelect,
    ],
  )

  const startDrag = useCallback(
    (pointerEvent: React.PointerEvent) => {
      dragSpeedMultiplier.set(
        pointerEvent.nativeEvent.pointerType === "touch"
          ? speedConfig.swipe
          : speedConfig.pointerDrag,
      )
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
    [
      dragControls,
      overlayX,
      flushOverlay,
      handleClickOrDragEnd,
      dragSpeedMultiplier,
      speedConfig.swipe,
      speedConfig.pointerDrag,
    ],
  )

  useEffect(() => {
    const containerElement = containerRef.current
    if (!containerElement) return
    const onWheel = (wheelEvent: WheelEvent) => {
      const inComponentView = activeComponent != null

      if (inComponentView) {
        const scrollUpIntent =
          wheelEvent.deltaY < -SCROLL_UP_THRESHOLD_PX &&
          Math.abs(wheelEvent.deltaY) > Math.abs(wheelEvent.deltaX)
        if (scrollUpIntent && scrollUpToExitComponent) {
          wheelEvent.preventDefault()
          setActiveComponent(null)
        }
        return
      }

      if (wheelEvent.deltaX !== 0) {
        wheelEvent.preventDefault()
        const delta = invertScroll ? wheelEvent.deltaX : -wheelEvent.deltaX
        scrollOffset.set(scrollOffset.get() + delta * speedConfig.wheel)
        if (snapConfig != null) {
          if (wheelSnapTimeoutRef.current != null)
            clearTimeout(wheelSnapTimeoutRef.current)
          wheelSnapTimeoutRef.current = setTimeout(() => {
            runSnapRef.current()
            wheelSnapTimeoutRef.current = null
          }, snapConfig.delayMs ?? 120)
        }
      }
      const scrollDownIntent =
        wheelEvent.deltaY > SCROLL_DOWN_THRESHOLD_PX &&
        wheelEvent.deltaY > Math.abs(wheelEvent.deltaX)
      if (
        scrollDownIntent &&
        scrollDownToEnterComponent &&
        itemsProp != null &&
        showComponentOnSelect
      ) {
        const containerRect = containerRef.current?.getBoundingClientRect()
        if (!containerRect) return
        const totalOffset = dragOffset.get()
        const containerCenterX = containerRect.left + containerRect.width / 2
        const centerIndex = getCardIndexAtClientX(
          containerCenterX,
          { left: containerRect.left, width: containerRect.width },
          totalOffset,
          stepWidth,
          itemCount,
        )
        const selectedItem = itemsProp[centerIndex]
        if (selectedItem?.component) {
          wheelEvent.preventDefault()
          onCardSelect?.(centerIndex, selectedItem)
          setActiveComponent(selectedItem.component)
        }
      }
    }
    containerElement.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      if (wheelSnapTimeoutRef.current != null) {
        clearTimeout(wheelSnapTimeoutRef.current)
        wheelSnapTimeoutRef.current = null
      }
      containerElement.removeEventListener("wheel", onWheel)
    }
  }, [
    activeComponent,
    scrollOffset,
    dragOffset,
    invertScroll,
    invertPointer,
    speedConfig.wheel,
    itemsProp,
    stepWidth,
    itemCount,
    snapConfig,
    scrollDownToEnterComponent,
    scrollUpToExitComponent,
    showComponentOnSelect,
    onCardSelect,
  ])

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
          dragMomentum={dragMomentum}
          dragTransition={dragTransition}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
