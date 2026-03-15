import { useState } from 'react'

function SyntaxHelp({ theme, onSearch }) {
  const [isOpen, setIsOpen] = useState(false)

  const runExample = (query) => {
    if (onSearch) {
      onSearch(query)
    }
  }

  return (
    <div className={`mb-4 ${theme.bgSecondary} rounded-lg border ${theme.border}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 flex items-center gap-2 text-left text-sm font-medium ${theme.textSecondary} hover:text-purple-400 transition-colors`}
      >
        <span className="text-purple-400">{isOpen ? '▼' : '▶'}</span>
        Search Syntax Help
      </button>

      {isOpen && (
        <div className={`px-4 pb-4 ${theme.bgTertiary} rounded-b-lg`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-3">
            {/* Basic Filters */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Basic Filters</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-blue-400">t:creature</code> Type is creature</div>
                <div><code className="text-blue-400">t:legendary</code> Has legendary supertype</div>
                <div><code className="text-blue-400">c:red</code> or <code className="text-blue-400">c:r</code> Contains red</div>
                <div><code className="text-blue-400">c:ub</code> Contains blue AND black</div>
                <div><code className="text-blue-400">r:mythic</code> Mythic rare cards</div>
                <div><code className="text-blue-400">s:mkm</code> From set (3-letter code)</div>
                <div><code className="text-blue-400">e:mkm</code> From expansion/set</div>
              </div>
            </div>

            {/* Text & Stats */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Text & Stats</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-blue-400">o:draw</code> Rules text contains "draw"</div>
                <div><code className="text-blue-400">o:"enters the"</code> Exact phrase in text</div>
                <div><code className="text-blue-400">cmc=3</code> Costs exactly 3 mana</div>
                <div><code className="text-blue-400">cmc&lt;=3</code> Costs 3 or less mana</div>
                <div><code className="text-blue-400">mv&gt;5</code> Costs more than 5 mana</div>
                <div><code className="text-blue-400">pow&gt;=4</code> Power is 4 or greater</div>
                <div><code className="text-blue-400">tou&lt;=2</code> Toughness is 2 or less</div>
              </div>
            </div>

            {/* Mana & Costs */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Mana & Costs</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-blue-400">m:GG</code> Requires 2 green mana</div>
                <div><code className="text-blue-400">m:2WW</code> Requires 2 colorless + 2 white</div>
                <div><code className="text-blue-400">m:{'{X}'}</code> Has X in mana cost</div>
                <div><code className="text-blue-400">m:{'{W/U}'}</code> Has white/blue hybrid</div>
                <div><code className="text-blue-400">m:{'{2/W}'}</code> Has 2-or-white hybrid</div>
                <div><code className="text-blue-400">m:{'{W/P}'}</code> Has Phyrexian white (pay 2 life)</div>
                <div><code className="text-blue-400">devotion:www</code> 3+ white pips in cost</div>
              </div>
            </div>

            {/* Oracle Tags */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Oracle Tags (otag:)</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-blue-400">otag:ramp</code> Produces extra mana</div>
                <div><code className="text-blue-400">otag:removal</code> Destroys/exiles permanents</div>
                <div><code className="text-blue-400">otag:draw</code> Draws extra cards</div>
                <div><code className="text-blue-400">otag:board-wipe</code> Destroys all creatures</div>
                <div><code className="text-blue-400">otag:tutor</code> Searches library for cards</div>
                <div><code className="text-blue-400">otag:counterspell</code> Counters spells</div>
                <div><code className="text-blue-400">otag:token-producer</code> Creates token creatures</div>
                <div><code className="text-blue-400">otag:sacrifice-outlet</code> Lets you sacrifice</div>
                <div><code className="text-blue-400">otag:life-gain</code> Gains life</div>
                <div><code className="text-blue-400">otag:graveyard-hate</code> Exiles graveyards</div>
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <h4 className="text-red-400 font-semibold mb-2 text-sm">Exclusions (- prefix)</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-red-400">-t:creature</code> Exclude all creatures</div>
                <div><code className="text-red-400">-t:legendary</code> Exclude legendary cards</div>
                <div><code className="text-red-400">-c:green</code> Exclude cards with green</div>
                <div><code className="text-red-400">-c:g</code> Same as above (shorthand)</div>
                <div><code className="text-red-400">-r:common</code> Exclude common rarity</div>
                <div><code className="text-red-400">-r:uncommon</code> Exclude uncommons</div>
                <div><code className="text-red-400">-o:flying</code> No "flying" in rules text</div>
                <div><code className="text-red-400">-s:mkm</code> Exclude Karlov Manor set</div>
              </div>
            </div>

            {/* Color Identity */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Color Identity (EDH)</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-blue-400">id:bg</code> Black+green (Golgari) identity</div>
                <div><code className="text-blue-400">id:wubrg</code> All 5 colors identity</div>
                <div><code className="text-blue-400">id&lt;=ub</code> Playable in blue+black deck</div>
                <div><code className="text-blue-400">id:c</code> Colorless only (no colors)</div>
                <div><code className="text-blue-400">id=rg</code> Exactly red+green only</div>
                <div><code className="text-blue-400">is:commander</code> Legal as commander</div>
                <div><code className="text-blue-400">is:partner</code> Has partner keyword</div>
              </div>
            </div>

            {/* Price & Format */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Price & Format</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-blue-400">usd&lt;5</code> Price under $5</div>
                <div><code className="text-blue-400">usd&gt;10</code> Price over $10</div>
                <div><code className="text-blue-400">usd&lt;=1</code> Budget cards ($1 or less)</div>
                <div><code className="text-blue-400">f:commander</code> Legal in Commander/EDH</div>
                <div><code className="text-blue-400">f:modern</code> Legal in Modern format</div>
                <div><code className="text-blue-400">f:standard</code> Legal in Standard</div>
                <div><code className="text-blue-400">f:pioneer</code> Legal in Pioneer</div>
                <div><code className="text-blue-400">f:pauper</code> Legal in Pauper (commons)</div>
              </div>
            </div>

            {/* Special Filters */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm">Special Filters</h4>
              <div className={`${theme.textSecondary} text-xs space-y-1`}>
                <div><code className="text-blue-400">is:reserved</code> On Reserved List (no reprints)</div>
                <div><code className="text-blue-400">is:reprint</code> Reprinted versions only</div>
                <div><code className="text-blue-400">is:firstprint</code> Original printing only</div>
                <div><code className="text-blue-400">is:full</code> Full art cards</div>
                <div><code className="text-blue-400">is:extended</code> Extended art treatment</div>
                <div><code className="text-blue-400">is:foil</code> Available in foil</div>
                <div><code className="text-blue-400">is:modal</code> Choose-a-side double-faced</div>
                <div><code className="text-blue-400">is:split</code> Split cards (Fire // Ice)</div>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className={`mt-4 pt-3 border-t ${theme.border}`}>
            <span className="text-yellow-400 text-sm font-semibold">Try Examples: </span>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => runExample('t:creature c:g cmc<=3 f:commander')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Green creatures CMC 3 or less
              </button>
              <button
                onClick={() => runExample('otag:removal -t:creature usd<2')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Budget non-creature removal
              </button>
              <button
                onClick={() => runExample('t:legendary t:creature id:ub')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Dimir commanders
              </button>
              <button
                onClick={() => runExample('otag:ramp c:g -t:creature')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Green non-creature ramp
              </button>
              <button
                onClick={() => runExample('t:creature pow>=7 cmc<=4')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Big creatures, low cost
              </button>
              <button
                onClick={() => runExample('o:"draw a card" t:instant c:u')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Blue instants with draw
              </button>
              <button
                onClick={() => runExample('is:reserved usd>50')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Expensive Reserved List
              </button>
              <button
                onClick={() => runExample('otag:board-wipe c:w -c:multicolor')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Mono-white board wipes
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className={`mt-3 pt-3 border-t ${theme.border} text-xs ${theme.textSecondary}`}>
            <span className="text-purple-400 font-semibold">Tips: </span>
            Combine filters with spaces. Use <code className="text-purple-400">otag:</code> for functional searches (requires Scryfall API).
            Prefix with <code className="text-red-400">-</code> to exclude. Enable "Use Scryfall API" for full syntax support including oracle tags.
          </div>
        </div>
      )}
    </div>
  )
}

export default SyntaxHelp
