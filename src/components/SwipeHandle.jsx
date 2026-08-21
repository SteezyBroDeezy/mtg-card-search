/** The little grab bar that tells you a panel can be pulled down. */
function SwipeHandle() {
  return (
    <div className="flex justify-center pt-2 pb-1 sm:hidden" aria-hidden="true">
      <div className="w-10 h-1.5 rounded-full bg-white/30" />
    </div>
  )
}

export default SwipeHandle
