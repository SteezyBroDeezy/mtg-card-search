import { useState } from 'react'
import { SEARCH_FILTERS } from '../lib/search'

function SearchHelp({ theme }) {
  const [isOpen, setIsOpen] = useState(false)

  const quickExamples = [
    { query: 't:creature c:red pow>=4', desc: 'Red creatures with 4+ power' },
    { query: 'f:commander id:bg t:creature', desc: 'Golgari commander creatures' },
    { query: 'o:"draw a card" cmc<=2', desc: 'Cheap card draw' },
    { query: 'is:reserved usd>50', desc: 'Reserved list cards over $50' },
    { query: 't:planeswalker loy>=5', desc: 'Planeswalkers with 5+ loyalty' },
    { query: 'k:flying k:lifelink', desc: 'Flying + Lifelink creatures' },
    { query: 'a:magali r:mythic', desc: 'Magali Villeneuve mythics' },
    { query: 'year>=2023 f:standard', desc: 'Recent Standard cards' },
  ]

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full ${theme.accent} text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-2xl z-40`}
        title="Search Help"
      >
        ?
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`${theme.bgSecondary} rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex justify-between items-center p-4 border-b ${theme.border}`}>
              <h2 className="text-xl font-bold">Search Syntax Guide</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
              {/* Quick Examples */}
              <div className="mb-6">
                <h3 className={`font-semibold mb-3 ${theme.text}`}>Quick Examples</h3>
                <div className="grid gap-2">
                  {quickExamples.map((ex, i) => (
                    <div key={i} className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                      <code className="text-blue-400 text-sm">{ex.query}</code>
                      <p className={`${theme.textSecondary} text-sm mt-1`}>{ex.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Filters */}
              <div>
                <h3 className={`font-semibold mb-3 ${theme.text}`}>All Search Filters</h3>
                <div className="grid gap-3">
                  {SEARCH_FILTERS.map(filter => (
                    <div key={filter.prefix} className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-blue-400 font-bold">{filter.prefix}</code>
                        <span className="font-medium">{filter.name}</span>
                        <span className={`${theme.textSecondary} text-sm`}>— {filter.description}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {filter.examples.map(ex => (
                          <code
                            key={ex}
                            className={`px-2 py-0.5 text-xs ${theme.bgSecondary} rounded`}
                          >
                            {ex}
                          </code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className={`mt-6 p-4 ${theme.bgTertiary} rounded-lg`}>
                <h3 className={`font-semibold mb-2 ${theme.text}`}>Tips</h3>
                <ul className={`${theme.textSecondary} text-sm space-y-1`}>
                  <li>• Combine multiple filters: <code className="text-blue-400">c:red t:creature cmc&lt;3</code></li>
                  <li>• Use quotes for phrases: <code className="text-blue-400">o:"enters the battlefield"</code></li>
                  <li>• Comparison operators: <code className="text-blue-400">=</code>, <code className="text-blue-400">&lt;</code>, <code className="text-blue-400">&lt;=</code>, <code className="text-blue-400">&gt;</code>, <code className="text-blue-400">&gt;=</code></li>
                  <li>• Color identity for Commander: <code className="text-blue-400">id:wubrg</code> finds 5-color cards</li>
                  <li>• Click the <strong>Filters</strong> button for visual filter toggles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SearchHelp
