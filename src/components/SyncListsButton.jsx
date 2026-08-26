/**
 * Sync button for use inside overlays.
 *
 * Saving a card to a list writes locally and leaves the change pending, and
 * the only sync control used to live at the top of the page — so syncing
 * meant closing the card and scrolling back up. This puts the same action
 * where the saving happens.
 *
 * Renders nothing when signed out, since there is nothing to sync to.
 */
function SyncListsButton({ user, syncing, hasUnsynced, onSync, theme, className = '' }) {
  if (!user) return null

  const label = syncing
    ? 'Syncing...'
    : hasUnsynced
      ? 'Sync Now'
      : 'Synced'

  const tone = syncing
    ? 'bg-gray-600 text-gray-300 cursor-wait'
    : hasUnsynced
      ? 'bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-400 text-white'
      : 'bg-green-700 hover:bg-green-600 active:bg-green-500 text-white'

  return (
    <button
      onClick={(e) => {
        // These sit inside overlays whose backdrop closes on click.
        e.stopPropagation()
        if (!syncing) onSync?.()
      }}
      disabled={syncing}
      className={`min-h-[44px] px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${tone} ${className}`}
      title={hasUnsynced ? 'Push pending list changes to your account' : 'All list changes are synced'}
    >
      <span className={syncing ? 'animate-spin' : ''}>&#8635;</span>
      {label}
    </button>
  )
}

export default SyncListsButton
