import { useRef, useState } from 'react'

/**
 * Drag-down-to-dismiss for overlays, the way native sheets behave.
 *
 * Spread `swipeHandlers` and `swipeStyle` onto the panel that should move
 * (the modal content, not the backdrop). While the finger is down the panel
 * follows it; past `threshold` pixels it closes on release, otherwise it
 * springs back.
 *
 * A drag is ignored when it starts inside a scrollable region that's already
 * scrolled down, so swiping through a long card list still scrolls normally.
 */
export function useSwipeToClose(onClose, { threshold = 110 } = {}) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef(null)

  function findScroller(node) {
    let el = node
    while (el && el.nodeType === 1) {
      const style = window.getComputedStyle(el)
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) return el
      el = el.parentElement
    }
    return null
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    const scroller = findScroller(e.target)
    // Mid-scroll: let the scroll win, don't start a dismiss drag.
    if (scroller && scroller.scrollTop > 0) return
    startRef.current = { x: touch.clientX, y: touch.clientY, scroller, locked: false }
  }

  function onTouchMove(e) {
    const start = startRef.current
    if (!start || e.touches.length !== 1) return
    const touch = e.touches[0]
    const dy = touch.clientY - start.y
    const dx = touch.clientX - start.x

    // Decide once whether this gesture is a vertical pull-down. A mostly
    // horizontal move (or an upward one) is left alone.
    if (!start.locked) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        startRef.current = null
        return
      }
      start.locked = true
      setDragging(true)
    }

    if (start.scroller && start.scroller.scrollTop > 0) {
      startRef.current = null
      setDragging(false)
      setDragY(0)
      return
    }

    // Resistance past the threshold so it never feels like free fall.
    setDragY(dy > threshold ? threshold + (dy - threshold) * 0.35 : dy)
  }

  function onTouchEnd() {
    const shouldClose = dragY > threshold
    startRef.current = null
    setDragging(false)
    setDragY(0)
    if (shouldClose) onClose?.()
  }

  return {
    dragging,
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
    swipeStyle: {
      transform: dragY ? `translateY(${dragY}px)` : undefined,
      opacity: dragY ? Math.max(0.4, 1 - dragY / 400) : undefined,
      transition: dragging ? 'none' : 'transform 0.25s ease, opacity 0.25s ease',
      touchAction: 'pan-y',
    },
  }
}
