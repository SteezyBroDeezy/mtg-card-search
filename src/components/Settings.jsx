import { themes, saveTheme } from '../lib/theme'

function Settings({ currentTheme, onThemeChange, onClose, cardCount, onSync }) {
  function handleThemeClick(themeName) {
    saveTheme(themeName)
    onThemeChange(themeName)
  }

  const theme = themes[currentTheme]

  // Group themes for display
  const themeGroups = {
    'Basic': ['dark', 'light'],
    'Mana Colors': ['white', 'blue', 'black', 'red', 'green'],
    'Special': ['mystical', 'artifact', 'multicolor', 'phyrexian', 'eldrazi']
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className={`${theme.bgSecondary} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${theme.text}`}>Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>

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

        <div className={`border-t ${theme.border} pt-4`}>
          <h3 className={`font-medium mb-3 ${theme.text}`}>Database</h3>
          <p className={`${theme.textSecondary} text-sm mb-1`}>
            {cardCount.toLocaleString()} cards stored locally
          </p>
          <p className={`${theme.textSecondary} text-xs mb-3`}>
            Re-sync to get the latest cards and prices from Scryfall
          </p>
          <button
            onClick={onSync}
            className={`w-full py-3 ${theme.accent} text-white rounded-lg font-medium`}
          >
            Sync Card Database
          </button>
        </div>

        <div className={`border-t ${theme.border} pt-4 mt-4`}>
          <h3 className={`font-medium mb-3 ${theme.text}`}>About</h3>
          <p className={`${theme.textSecondary} text-sm`}>
            MTG Card Search - An offline-capable Magic: The Gathering card search tool.
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
