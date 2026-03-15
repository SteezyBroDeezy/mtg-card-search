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

          {/* Quick Categories */}
          <div className={`mt-4 pt-3 border-t ${theme.border}`}>
            {/* EDH Staples */}
            <div className="mb-3">
              <span className="text-yellow-400 text-xs font-semibold uppercase">EDH Staples: </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button onClick={() => runExample('otag:ramp f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🌱 Ramp</button>
                <button onClick={() => runExample('otag:removal f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>💀 Removal</button>
                <button onClick={() => runExample('otag:draw f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🎴 Draw</button>
                <button onClick={() => runExample('otag:board-wipe f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>💥 Wipes</button>
                <button onClick={() => runExample('otag:tutor f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🔍 Tutors</button>
                <button onClick={() => runExample('otag:counterspell f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🛡️ Counters</button>
                <button onClick={() => runExample('otag:mana-rock f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>💎 Rocks</button>
                <button onClick={() => runExample('otag:land-ramp f:commander')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🏔️ Land Ramp</button>
              </div>
            </div>

            {/* Commanders by Color */}
            <div className="mb-3">
              <span className="text-yellow-400 text-xs font-semibold uppercase">👑 Commanders: </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button onClick={() => runExample('is:commander usd>0')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>All</button>
                <button onClick={() => runExample('is:commander id:w')} className="px-2 py-1 text-xs rounded hover:opacity-80" style={{background: 'linear-gradient(135deg,#f8f6d8,#e8e4c8)', color: '#333'}}>⚪ White</button>
                <button onClick={() => runExample('is:commander id:u')} className="px-2 py-1 text-xs rounded hover:opacity-80" style={{background: 'linear-gradient(135deg,#0e68ab,#1a8cd8)', color: '#fff'}}>🔵 Blue</button>
                <button onClick={() => runExample('is:commander id:b')} className="px-2 py-1 text-xs rounded hover:opacity-80" style={{background: 'linear-gradient(135deg,#2b2b2b,#4a4a4a)', color: '#fff'}}>⚫ Black</button>
                <button onClick={() => runExample('is:commander id:r')} className="px-2 py-1 text-xs rounded hover:opacity-80" style={{background: 'linear-gradient(135deg,#d32f2f,#f44336)', color: '#fff'}}>🔴 Red</button>
                <button onClick={() => runExample('is:commander id:g')} className="px-2 py-1 text-xs rounded hover:opacity-80" style={{background: 'linear-gradient(135deg,#2e7d32,#4caf50)', color: '#fff'}}>🟢 Green</button>
                <button onClick={() => runExample('is:commander id:c')} className="px-2 py-1 text-xs rounded hover:opacity-80" style={{background: 'linear-gradient(135deg,#9e9e9e,#bdbdbd)', color: '#333'}}>⬜ Colorless</button>
              </div>
            </div>

            {/* Guild Commanders */}
            <div className="mb-3">
              <span className="text-yellow-400 text-xs font-semibold uppercase">Guilds: </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button onClick={() => runExample('is:commander id=ub')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Dimir</button>
                <button onClick={() => runExample('is:commander id=bg')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Golgari</button>
                <button onClick={() => runExample('is:commander id=rg')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Gruul</button>
                <button onClick={() => runExample('is:commander id=uw')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Azorius</button>
                <button onClick={() => runExample('is:commander id=br')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Rakdos</button>
                <button onClick={() => runExample('is:commander id=wg')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Selesnya</button>
                <button onClick={() => runExample('is:commander id=ur')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Izzet</button>
                <button onClick={() => runExample('is:commander id=wb')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Orzhov</button>
                <button onClick={() => runExample('is:commander id=gu')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Simic</button>
                <button onClick={() => runExample('is:commander id=rw')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>Boros</button>
              </div>
            </div>

            {/* Commander Features */}
            <div className="mb-3">
              <span className="text-yellow-400 text-xs font-semibold uppercase">Features: </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button onClick={() => runExample('is:commander is:partner')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🤝 Partners</button>
                <button onClick={() => runExample('is:commander o:"background"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>📜 Backgrounds</button>
                <button onClick={() => runExample('is:commander cmc<=3')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>⚡ Low Cost (≤3)</button>
                <button onClick={() => runExample('is:commander usd<5')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>💰 Budget (&lt;$5)</button>
                <button onClick={() => runExample('is:commander usd>20')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>💎 Premium (&gt;$20)</button>
                <button onClick={() => runExample('is:commander pow>=5')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>💪 High Power (5+)</button>
                <button onClick={() => runExample('is:commander o:"when ~ deals combat damage"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>⚔️ Combat Damage</button>
                <button onClick={() => runExample('is:commander o:"whenever you cast"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🎯 Cast Triggers</button>
              </div>
            </div>

            {/* Archetypes */}
            <div className="mb-3">
              <span className="text-yellow-400 text-xs font-semibold uppercase">Archetypes: </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button onClick={() => runExample('is:commander o:"token"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🪙 Tokens</button>
                <button onClick={() => runExample('is:commander o:"+1/+1 counter"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>📈 +1/+1 Counters</button>
                <button onClick={() => runExample('is:commander o:"graveyard"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>⚰️ Graveyard</button>
                <button onClick={() => runExample('is:commander o:"sacrifice"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🩸 Sacrifice</button>
                <button onClick={() => runExample('is:commander o:"artifact"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>⚙️ Artifacts</button>
                <button onClick={() => runExample('is:commander o:"enchantment"')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>✨ Enchantments</button>
                <button onClick={() => runExample('is:commander t:dragon')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🐉 Dragons</button>
                <button onClick={() => runExample('is:commander t:elf')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🧝 Elves</button>
                <button onClick={() => runExample('is:commander t:zombie')} className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20`}>🧟 Zombies</button>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className={`mt-3 pt-3 border-t ${theme.border}`}>
            <span className="text-yellow-400 text-sm font-semibold">More Examples: </span>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => runExample('is:commander id<=bg cmc<=4')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Budget Golgari commanders
              </button>
              <button
                onClick={() => runExample('otag:removal -t:creature usd<2')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Budget non-creature removal
              </button>
              <button
                onClick={() => runExample('is:commander is:partner')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Partner commanders
              </button>
              <button
                onClick={() => runExample('otag:ramp c:g -t:creature')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Green non-creature ramp
              </button>
              <button
                onClick={() => runExample('is:commander o:"draw" id<=u')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Blue draw commanders
              </button>
              <button
                onClick={() => runExample('is:commander t:dragon')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Dragon commanders
              </button>
              <button
                onClick={() => runExample('is:commander pow>=6 cmc<=5')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Strong low-cost commanders
              </button>
              <button
                onClick={() => runExample('otag:board-wipe f:commander usd<3')}
                className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:bg-purple-500/20 transition-colors`}
              >
                Budget board wipes
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
