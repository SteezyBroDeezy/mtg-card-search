import { useEffect, useRef, useState } from 'react'
import { swallowNextClick } from './ghostClick'

// ---------------------------------------------------------------- scroll lock
//
// While any overlay is open the page behind it must not move. Without this,
// a downward swipe that isn't consumed by the overlay chains through to the
// document and scrolls the results grid underneath — so dismissing a card
// left you somewhere else on the page.
//
// Overlays stack (card detail over quick view, save-to-list over card
// detail), so the lock is reference-counted: the page is only released when
// the last overlay closes.

let lockCount = 0
let savedScrollY = 0

function lockBodyScroll() {
  if (lockCount++ > 0) return
  savedScrollY = window.scrollY
  const body = document.body
  body.style.position = 'fixed'
  body.style.top = `-${savedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (lockCount === 0) return
  if (--lockCount > 0) return
  const body = document.body
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  body.style.overflow = ''
  // position:fixed dropped the scroll position; put it back exactly.
  window.scrollTo(0, savedScrollY)
}

/**
 * Drag-down-to-dismiss for overlays, the way native sheets behave.
 *
 * Spread `swipeHandlers` and `swipeStyle` onto the panel that should move
 * (the modal content, not the backdrop). While the finger is down the panel
 * follows it; past `threshold` pixels it closes on release, otherwise it
 * springs back.
 *
 * The gesture is contained to the overlay it started in: touch events are
 * stopped from bubbling, so a sheet stacked on top of another sheet never
 * drags the one behind it, and the page underneath is scroll-locked for as
 * long as the overlay is open.
 *
 * A drag is ignored when it starts inside a scrollable region that's already
 * scrolled down, so swiping through a long card list still scrolls.
 *
 * `enabled` must be false when the component is mounted but its overlay is
 * closed (SearchHelp renders its trigger button all the time), or the page
 * would be locked permanently.
 */
export function useSwipeToClose(onClose, { threshold = 110, enabled = true } = {}) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    lockBodyScroll()
    return unlockBodyScroll
  }, [enabled])

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
    // Keep the gesture inside this overlay — a sheet on top of another sheet
    // must not drag the one behind it.
    e.stopPropagation()
    if (!enabled || e.touches.length !== 1) return
    const touch = e.touches[0]
    const scroller = findScroller(e.target)
    // Mid-scroll: let the scroll win, don't start a dismiss drag.
    if (scroller && scroller.scrollTop > 0) return
    startRef.current = { x: touch.clientX, y: touch.clientY, scroller, locked: false }
  }

  function onTouchMove(e) {
    e.stopPropagation()
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

  function onTouchEnd(e) {
    e?.stopPropagation?.()
    const shouldClose = dragY > threshold
    startRef.current = null
    setDragging(false)
    setDragY(0)
    if (shouldClose) {
      // The overlay is about to vanish; don't let the trailing click reach
      // whatever ends up under the finger.
      swallowNextClick()
      onClose?.()
    }
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
      overscrollBehavior: 'contain',
    },
  }
}
