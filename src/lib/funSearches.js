// Curated "searches worth knowing" — the queries that show off what the
// search box can do, for the times you don't know what to type.
//
// `offline: true` means every filter used is one the local database can run,
// so the search works with no connection. The rest need Scryfall (regex, ~ as
// a name placeholder, is:vanilla and friends) and are skipped in offline mode.

export const FUN_SEARCHES = [
  // ---------------------------------------------------------- deck staples
  {
    category: 'Deck staples',
    label: 'Budget board wipes',
    query: 'o:"destroy all creatures" usd<=5',
    blurb: 'Everybody dies, and it cost you less than a sandwich.',
    offline: true,
  },
  {
    category: 'Deck staples',
    label: 'Cheap mana rocks',
    query: 't:artifact o:"{T}: Add" cmc<=2',
    blurb: 'Two mana or less, taps for more. The engine room of every deck.',
    offline: true,
  },
  {
    category: 'Deck staples',
    label: 'Unconditional removal',
    query: 'o:"destroy target creature" -o:"can\'t" cmc<=2',
    blurb: 'Kill spells with no fine print, for two mana or less.',
    offline: true,
  },
  {
    category: 'Deck staples',
    label: 'Draw two or more',
    query: 'o:"draw two cards" cmc<=3',
    blurb: 'Card advantage on the cheap.',
    offline: true,
  },
  {
    category: 'Deck staples',
    label: 'Tutors',
    query: 'o:"search your library for a" cmc<=3',
    blurb: 'Find exactly the card you need. Consistency in a bottle.',
    offline: true,
  },

  // ------------------------------------------------------------- payoffs
  {
    category: 'Build-arounds',
    label: 'Lifegain payoffs',
    query: 'o:"whenever you gain life"',
    blurb: 'Cards that turn gaining life into an actual win condition.',
    offline: true,
  },
  {
    category: 'Build-arounds',
    label: 'Treasure makers',
    query: 'o:"create a treasure token"',
    blurb: 'Free money. Ramp, fixing and artifact fodder in one.',
    offline: true,
  },
  {
    category: 'Build-arounds',
    label: 'Graveyard value',
    query: 'o:"from your graveyard" -t:land',
    blurb: 'Your graveyard is a second hand if you build for it.',
    offline: true,
  },
  {
    category: 'Build-arounds',
    label: 'Sacrifice outlets',
    query: 'o:"sacrifice a creature:" ',
    blurb: 'Free sac outlets — the missing piece in most combo decks.',
    offline: true,
  },
  {
    category: 'Build-arounds',
    label: 'Punish the draw',
    query: 'o:"whenever an opponent draws"',
    blurb: 'Make their card advantage hurt them. Deeply annoying.',
    offline: true,
  },
  {
    category: 'Build-arounds',
    label: 'Extra turns',
    query: 'o:"take an extra turn"',
    blurb: 'The most obnoxious effect in Magic, all in one list.',
    offline: true,
  },

  // ----------------------------------------------------------- big swings
  {
    category: 'Big swings',
    label: 'Just win the game',
    query: 'o:"you win the game"',
    blurb: 'Cards that skip the maths and say it outright.',
    offline: true,
  },
  {
    category: 'Big swings',
    label: 'Free spells',
    query: 'o:"without paying its mana cost"',
    blurb: 'Mana is a suggestion. These are the cards that break formats.',
    offline: true,
  },
  {
    category: 'Big swings',
    label: 'Absurd mana costs',
    query: 'cmc>=10 -t:land',
    blurb: 'Ten mana or more. You will never cast these. Look anyway.',
    offline: true,
  },
  {
    category: 'Big swings',
    label: 'Beef under four mana',
    query: 't:creature pow>=6 cmc<=4',
    blurb: 'Enormous bodies at a suspiciously low price. Check the drawback.',
    offline: true,
  },
  {
    category: 'Big swings',
    label: 'Steal their stuff',
    query: 'o:"gain control of target"',
    blurb: 'Why build a board when your opponent already did?',
    offline: true,
  },

  // ---------------------------------------------------------- oddities
  {
    category: 'Oddities',
    label: 'Zero mana cards',
    query: 'cmc=0 -t:land',
    blurb: 'Cards that cost literally nothing. Historically a bad idea.',
    offline: true,
  },
  {
    category: 'Oddities',
    label: 'Cards with no power',
    query: 't:creature pow=*',
    blurb: 'Creatures whose size is a maths problem.',
    offline: true,
  },
  {
    category: 'Oddities',
    label: 'Reserved list, pricey',
    query: 'is:reserved usd>=50',
    blurb: 'Cards that will never be reprinted, and price accordingly.',
    offline: true,
  },
  {
    category: 'Oddities',
    label: 'Two cards in one',
    query: 'is:dfc',
    blurb: 'Double-faced cards — transform, modal, and the weird ones.',
    offline: true,
  },
  {
    category: 'Oddities',
    label: 'Everyone draws',
    query: 'o:"each player draws"',
    blurb: 'Group hug: help the table, hope they remember it.',
    offline: true,
  },
  {
    category: 'Oddities',
    label: 'Squirrels',
    query: 't:squirrel',
    blurb: 'A shockingly deep tribe. No notes.',
    offline: true,
  },

  // ------------------------------------------------------- commander-ish
  {
    category: 'Commander',
    label: 'Budget commanders',
    query: 'is:commander usd<=2 edhrec<=2000',
    blurb: 'Popular legends that cost about as much as a coffee.',
    offline: true,
  },
  {
    category: 'Commander',
    label: 'Hidden gems',
    query: 'edhrec<=5000 usd<=1 -t:land',
    blurb: 'Played a lot, costs nearly nothing. The sweet spot.',
    offline: true,
  },
  {
    category: 'Commander',
    label: 'Mono-black legends',
    query: 'is:commander id:b',
    blurb: 'Every commander you can build in mono-black.',
    offline: true,
  },
  {
    category: 'Commander',
    label: 'Pillow fort',
    query: 'o:"can\'t attack you"',
    blurb: 'Make yourself a boring target and win at your leisure.',
    offline: true,
  },

  // ------------------------------------------------- needs the internet
  {
    category: 'Deep cuts',
    label: 'Attack triggers',
    query: 'o:"whenever ~ attacks"',
    blurb: 'The ~ stands in for the card\'s own name — a Scryfall trick.',
    offline: false,
  },
  {
    category: 'Deep cuts',
    label: 'Vanilla creatures',
    query: 'is:vanilla',
    blurb: 'No abilities whatsoever. Pure stats, pure nostalgia.',
    offline: false,
  },
  {
    category: 'Deep cuts',
    label: 'Activated abilities',
    query: 't:creature o:/:/',
    blurb: 'Searching for a colon finds every creature with an activated ability.',
    offline: false,
  },
  {
    category: 'Deep cuts',
    label: 'Removal, loosely',
    query: 'o:/destroy.*creature/',
    blurb: 'A regex that catches every wording of "destroy... creature".',
    offline: false,
  },
]

export const FUN_CATEGORIES = [...new Set(FUN_SEARCHES.map(s => s.category))]

/** A random search, optionally limited to ones the local database can run. */
export function randomFunSearch(offlineOnly = false, excludeQuery = null) {
  let pool = offlineOnly ? FUN_SEARCHES.filter(s => s.offline) : FUN_SEARCHES
  if (excludeQuery && pool.length > 1) {
    pool = pool.filter(s => s.query !== excludeQuery)
  }
  return pool[Math.floor(Math.random() * pool.length)]
}
