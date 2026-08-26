/**
 * Swallow the click that follows a touch we already handled.
 *
 * Picking a suggestion fires on pointerdown so it lands before the input's
 * blur tears the list down. But preventDefault on pointerdown does not stop
 * mobile Safari from still dispatching the click at that coordinate — and by
 * then the dropdown has closed, so the click hits whatever is now underneath
 * and triggers it. Same story after a swipe dismisses an overlay.
 *
 * This catches that one click in the capture phase, before it can reach
 * anything, then removes itself.
 */
export function swallowNextClick(windowMs = 400) {
  if (typeof document === 'undefined') return

  const cleanup = () => {
    document.removeEventListener('click', onClick, true)
    clearTimeout(timer)
  }

  const onClick = (event) => {
    event.stopPropagation()
    event.preventDefault()
    cleanup()
  }

  // Bounded so a deliberate tap a moment later still works.
  const timer = setTimeout(cleanup, windowMs)
  document.addEventListener('click', onClick, true)
}
