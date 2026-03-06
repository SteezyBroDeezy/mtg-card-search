
  import { themes, saveTheme } from '../lib/theme'

  function Settings({ currentTheme, onThemeChange, onClose, cardCount,
  onSync }) {
    function handleThemeClick(themeName) {
      saveTheme(themeName)
      onThemeChange(themeName)
    }

    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center
  justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className={`${themes[currentTheme].bgSecondary} rounded-xl w-full
  max-w-md p-6`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-bold
  ${themes[currentTheme].text}`}>Settings</h2>
            <button onClick={onClose} className="text-gray-400
  hover:text-white text-2xl">
              x
            </button>
          </div>

          <div className="mb-6">
            <h3 className={`font-medium mb-3
  ${themes[currentTheme].text}`}>Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeClick(key)}
                  className={`p-3 rounded-lg border-2 ${theme.bg} ${
                    currentTheme === key ? 'border-blue-500' :
  'border-transparent'
                  }`}
                >
                  <span className={theme.text}>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`border-t ${themes[currentTheme].border} pt-4`}>
            <h3 className={`font-medium mb-3
  ${themes[currentTheme].text}`}>Database</h3>
            <p className={`${themes[currentTheme].textSecondary} text-sm
  mb-3`}>
              {cardCount.toLocaleString()} cards stored locally
            </p>
            <button
              onClick={onSync}
              className={`w-full py-3 ${themes[currentTheme].accent}
  text-white rounded-lg font-medium`}
            >
              Sync Card Database
            </button>
          </div>
        </div>
      </div>
    )
  }

  export default Settings