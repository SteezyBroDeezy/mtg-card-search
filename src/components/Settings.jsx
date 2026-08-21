import { themes, saveTheme } from '../lib/theme'
import { EFFECT_LAYERS, INTENSITY_OPTIONS } from '../lib/effects'
import { useSwipeToClose } from '../lib/useSwipeToClose'
import SwipeHandle from './SwipeHandle'

function Settings({ currentTheme, onThemeChange, onClose, cardCount, onSync, groupByName, onGroupByNameChange, appMode, onAppModeChange, dbStatus, onDownload, lastDbSyncLabel, onCheckForUpdate, checkingUpdate, buildTime,
  effectConfig = { mode: 'auto', layers: [] }, onEffectConfigChange,
  effectIntensity = 'normal', onEffectIntensityChange }) {
  const swipe = useSwipeToClose(onClose)
  function handleThemeClick(themeName) {
    saveTheme(themeName)
    onThemeChange(themeName)
  }

  const theme = themes[currentTheme]

  // Group themes for display
  const namedGroups = {
    'Basic': ['dark', 'light'],
    'Mana Colors': ['white', 'blue', 'black', 'red', 'green'],
    'Guilds': ['boros', 'dimir', 'simic', 'rakdos', 'golgari'],
    'Lore': ['mystical', 'artifact', 'multicolor', 'phyrexian', 'eldrazi', 'bone'],
    'Planes': ['zendikar', 'innistrad', 'kamigawa'],
    'Animated': ['dragon', 'planeswalker', 'neon', 'cosmic', 'goldMythic', 'iceStorm', 'bloodMoon'],
    'Ambient': ['deepSpace', 'nebula', 'aurora', 'fireflies', 'rainyDay', 'parchment'],
  }

  // Anything added to theme.js but not listed above still shows up, so a new
  // theme can never be invisible in the picker.
  const grouped = new Set(Object.values(namedGroups).flat())
  const ungrouped = Object.keys(themes).filter(key => !grouped.has(key))
  const themeGroups = ungrouped.length > 0
    ? { ...namedGroups, 'More': ungrouped }
    : namedGroups

  const isAuto = effectConfig.mode === 'auto'
  const activeLayers = isAuto ? [] : effectConfig.layers

  function setMode(mode) {
    onEffectConfigChange?.({ mode, layers: mode === 'auto' ? [] : activeLayers })
  }

  function toggleLayer(value) {
    const next = activeLayers.includes(value)
      ? activeLayers.filter(l => l !== value)
      : [...activeLayers, value]
    onEffectConfigChange?.({ mode: 'custom', layers: next })
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className={`${theme.bgSecondary} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 pt-2`}
        onClick={(e) => e.stopPropagation()}
        style={swipe.swipeStyle}
        {...swipe.swipeHandlers}
      >
        <SwipeHandle />
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${theme.text}`}>Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>

        {/* Search Settings */}
        <div className="mb-6">
          <h3 className={`font-medium mb-3 ${theme.text}`}>Search Settings</h3>

          <label className={`flex items-center justify-between p-3 ${theme.bgTertiary} rounded-lg cursor-pointer`}>
            <div>
              <p className={theme.text}>Group cards by name</p>
              <p className={`${theme.textSecondary} text-sm`}>
                Show one result per card name, with a badge for multiple printings
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={groupByName}
                onChange={(e) => onGroupByNameChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>

          <p className={`${theme.textSecondary} text-xs mt-2 px-1`}>
            When enabled, search shows the cheapest printing of each unique card. Click a card to see all printings and prices.
          </p>
        </div>

        {/* Theme Selection */}
        <div className="mb-6">
          <h3 className={`font-medium mb-4 ${theme.text}`}>Theme</h3>

          {Object.entries(themeGroups).map(([groupName, themeKeys]) => (
            <div key={groupName} className="mb-4">
              <p className={`${theme.textSecondary} text-xs uppercase tracking-wide mb-2`}>
                {groupName}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {themeKeys.map(key => {
                  const t = themes[key]
                  if (!t) return null
                  return (
                    <button
                      key={key}
                      onClick={() => handleThemeClick(key)}
                      className={`p-3 rounded-lg border-2 transition-all ${t.bg} ${
                        currentTheme === key
                          ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105'
                          : 'border-transparent hover:border-gray-500'
                      }`}
                    >
                      <span className={`${t.text} text-sm font-medium`}>{t.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Background Effects — independent of the theme, so any effect can
            be layered over any palette. */}
        <div className={`border-t ${theme.border} pt-4 mb-6`}>
          <h3 className={`font-medium mb-1 ${theme.text}`}>Background Effects</h3>
          <p className={`${theme.textSecondary} text-xs mb-3`}>
            Stack any of these over whichever theme you're using. They sit behind
            the app and never intercept taps.
          </p>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode('auto')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                isAuto ? 'border-blue-500 bg-blue-600/20 ' + theme.text : `${theme.bgTertiary} border-transparent ${theme.textSecondary}`
              }`}
            >
              Match theme
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                !isAuto ? 'border-blue-500 bg-blue-600/20 ' + theme.text : `${theme.bgTertiary} border-transparent ${theme.textSecondary}`
              }`}
            >
              Choose my own
            </button>
          </div>

          {!isAuto && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {EFFECT_LAYERS.map(layer => {
                  const on = activeLayers.includes(layer.value)
                  return (
                    <button
                      key={layer.value}
                      onClick={() => toggleLayer(layer.value)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        on
                          ? 'border-blue-500 bg-blue-600/20'
                          : `${theme.bgTertiary} border-transparent hover:border-gray-500`
                      }`}
                    >
                      <span className={`${theme.text} text-sm font-medium flex items-center gap-2`}>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          on ? 'bg-blue-500 border-blue-500 text-white' : `border-gray-500 ${theme.textSecondary}`
                        }`}>
                          {on ? '✓' : ''}
                        </span>
                        {layer.label}
                      </span>
                      <span className={`${theme.textSecondary} text-xs block mt-1 pl-6`}>
                        {layer.description}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className={`${theme.textSecondary} text-xs mb-3`}>
                {activeLayers.length === 0
                  ? 'Nothing selected — the background stays plain.'
                  : `${activeLayers.length} effect${activeLayers.length === 1 ? '' : 's'} active. Starfield + Planets + Space debris makes a full space scene.`}
              </p>
            </>
          )}

          <div>
            <p className={`${theme.textSecondary} text-xs uppercase tracking-wide mb-2`}>Intensity</p>
            <div className="flex gap-2">
              {INTENSITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onEffectIntensityChange?.(opt.value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                    effectIntensity === opt.value
                      ? 'border-blue-500 bg-blue-600/20 ' + theme.text
                      : `${theme.bgTertiary} border-transparent ${theme.textSecondary}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className={`${theme.textSecondary} text-xs mt-2`}>
              Controls how many particles appear and how visible they are. All effects
              hold still if your phone has Reduce Motion switched on.
            </p>
          </div>
        </div>

        {/* Search Mode */}
        {onAppModeChange && (
          <div className={`border-t ${theme.border} pt-4`}>
            <h3 className={`font-medium mb-3 ${theme.text}`}>Search Mode</h3>

            <label className={`flex items-center justify-between p-3 ${theme.bgTertiary} rounded-lg cursor-pointer`}>
              <div className="pr-3">
                <p className={theme.text}>Use online mode</p>
                <p className={`${theme.textSecondary} text-sm`}>
                  Query Scryfall live instead of using the local database. No download needed.
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={appMode === 'online'}
                  onChange={(e) => onAppModeChange(e.target.checked ? 'online' : 'offline')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>

            <p className={`${theme.textSecondary} text-xs mt-2 px-1`}>
              {appMode === 'online'
                ? 'Currently online: searches use the Scryfall API. Browse Sets is unavailable in this mode.'
                : 'Currently offline: searches use the locally downloaded card database.'}
            </p>
          </div>
        )}

        {/* Database */}
        <div className={`border-t ${theme.border} pt-4 mt-4`}>
          <h3 className={`font-medium mb-3 ${theme.text}`}>Database</h3>
          <p className={`${theme.textSecondary} text-sm mb-1`}>
            {dbStatus === 'ready'
              ? `${cardCount.toLocaleString()} cards stored locally · ${lastDbSyncLabel || 'never updated'}`
              : 'No local database — running in online mode'}
          </p>
          <p className={`${theme.textSecondary} text-xs mb-3`}>
            {dbStatus === 'ready'
              ? 'Updating only downloads cards released since the last update, plus refreshed prices — it takes seconds, not minutes. Also runs automatically once a day on Wi-Fi.'
              : 'Download the database to enable offline search'}
          </p>

          <button
            onClick={onSync}
            className={`w-full py-3 ${theme.accent} text-white rounded-lg font-medium`}
          >
            {dbStatus === 'ready' ? 'Update Card Database' : 'Download Card Database'}
          </button>
          <p className={`${theme.textSecondary} text-xs text-center mt-2`}>
            {dbStatus === 'ready'
              ? 'Needs an internet connection.'
              : 'Downloads ~30,000 unique cards. Works on mobile!'}
          </p>
        </div>

        {/* App version */}
        <div className={`border-t ${theme.border} pt-4 mt-4`}>
          <h3 className={`font-medium mb-3 ${theme.text}`}>App Version</h3>
          <p className={`${theme.textSecondary} text-xs mb-3`}>
            The app updates itself in the background — when a new version is ready an
            Update ribbon appears at the bottom of the screen. You never need to
            delete and re-install it.
          </p>
          <button
            onClick={onCheckForUpdate}
            disabled={checkingUpdate}
            className={`w-full py-3 ${theme.bgTertiary} border ${theme.border} ${theme.text} rounded-lg font-medium disabled:opacity-60`}
          >
            {checkingUpdate ? 'Checking…' : 'Check for Updates'}
          </button>
          {buildTime && (
            <p className={`${theme.textSecondary} text-xs text-center mt-2`}>
              Build {buildTime}
            </p>
          )}
        </div>

        {/* About */}
        <div className={`border-t ${theme.border} pt-4 mt-4`}>
          <h3 className={`font-medium mb-3 ${theme.text}`}>About</h3>
          <p className={`${theme.textSecondary} text-sm`}>
            MTG Card Search - An offline-capable Magic: The Gathering card search tool with the most comprehensive search features available.
          </p>
          <p className={`${theme.textSecondary} text-xs mt-2`}>
            Card data provided by Scryfall. This app is not affiliated with Wizards of the Coast.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
