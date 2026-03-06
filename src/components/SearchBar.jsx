 import { useState } from 'react'

  function SearchBar({ onSearch, disabled }) {
    const [query, setQuery] = useState('')
    const [showHelp, setShowHelp] = useState(false)

    const handleSubmit = (e) => {
      e.preventDefault()
      onSearch(query)
    }

    return (
      <div className="w-full">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards... (e.g., c:red t:creature)"
              disabled={disabled}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700
   rounded-lg
                         text-white placeholder-gray-500 focus:outline-none
  focus:border-blue-500
                         disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={disabled}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg
  font-medium
                         hover:bg-blue-700 disabled:opacity-50
  disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>
        </form>

        {/* Help Toggle */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-400 text-sm mt-2 hover:underline"
        >
          {showHelp ? 'Hide search help' : 'Show search help'}
        </button>

        {/* Help Panel */}
        {showHelp && (
          <div className="mt-3 p-4 bg-gray-800 rounded-lg text-sm">
            <h3 className="font-bold mb-2">Search Syntax</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2
  text-gray-300">
              <div><code className="text-blue-400">lightning bolt</code> —
  search by name</div>
              <div><code className="text-blue-400">c:red</code> — red
  cards</div>
              <div><code className="text-blue-400">c:blue</code> — blue
  cards</div>
              <div><code className="text-blue-400">c:colorless</code> —
  colorless cards</div>
              <div><code className="text-blue-400">t:creature</code> —
  creatures</div>
              <div><code className="text-blue-400">t:instant</code> —
  instants</div>
              <div><code className="text-blue-400">cmc:3</code> — mana cost
  equals 3</div>
              <div><code className="text-blue-400">cmc&lt;=2</code> — mana
  cost 2 or less</div>
              <div><code className="text-blue-400">r:mythic</code> — mythic
  rarity</div>
              <div><code className="text-blue-400">s:neo</code> — from set
  NEO</div>
              <div><code className="text-blue-400">o:draw</code> — text
  contains "draw"</div>
            </div>
            <p className="mt-3 text-gray-400">Combine filters: <code
  className="text-blue-400">c:red t:creature cmc&lt;=2</code></p>
          </div>
        )}
      </div>
    )
  }

  export default SearchBar
