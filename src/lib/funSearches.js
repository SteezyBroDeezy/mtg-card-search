// Curated "searches worth knowing" — the queries that show off what the
// search box can do, for the times you don't know what to type.
//
// Every query here was validated against the live Scryfall API: each returns
// real cards, and the phrasings match current Oracle templating. That check
// matters — the 2024 wording change means o:"whenever a land you control
// enters" finds ~198 cards while the older "whenever a land enters the
// battlefield under your control" finds zero.
//
// `offline: true` means every filter used is one the local database can run,
// so the search works with no connection. The rest need Scryfall (regex, ~ as
// a name placeholder, is:vanilla) and are hidden in offline mode.

export const FUN_SEARCHES = [

  // ---- Deck staples
  {
    category: "Deck staples",
    label: "Budget board wipes",
    query: "o:\"destroy all creatures\" usd<=5",
    blurb: "Everybody dies, and it cost you less than a sandwich.",
    offline: true,
  },
  {
    category: "Deck staples",
    label: "Cheap mana rocks",
    query: "t:artifact o:\"{T}: Add\" cmc<=2",
    blurb: "Two mana or less, taps for more. The engine room of every deck.",
    offline: true,
  },
  {
    category: "Deck staples",
    label: "Unconditional removal",
    query: "o:\"destroy target creature\" -o:\"can't\" cmc<=2",
    blurb: "Kill spells with no fine print, for two mana or less.",
    offline: true,
  },
  {
    category: "Deck staples",
    label: "Draw two or more",
    query: "o:\"draw two cards\" cmc<=3",
    blurb: "Card advantage on the cheap.",
    offline: true,
  },
  {
    category: "Deck staples",
    label: "Tutors",
    query: "o:\"search your library for a\" cmc<=3",
    blurb: "Find exactly the card you need. Consistency in a bottle.",
    offline: true,
  },

  // ---- Build-arounds
  {
    category: "Build-arounds",
    label: "Lifegain payoffs",
    query: "o:\"whenever you gain life\"",
    blurb: "Cards that turn gaining life into an actual win condition.",
    offline: true,
  },
  {
    category: "Build-arounds",
    label: "Treasure makers",
    query: "o:\"create a treasure token\"",
    blurb: "Free money. Ramp, fixing and artifact fodder in one.",
    offline: true,
  },
  {
    category: "Build-arounds",
    label: "Graveyard value",
    query: "o:\"from your graveyard\" -t:land",
    blurb: "Your graveyard is a second hand if you build for it.",
    offline: true,
  },
  {
    category: "Build-arounds",
    label: "Sacrifice outlets",
    query: "o:\"sacrifice a creature:\" ",
    blurb: "Free sac outlets \u2014 the missing piece in most combo decks.",
    offline: true,
  },
  {
    category: "Build-arounds",
    label: "Punish the draw",
    query: "o:\"whenever an opponent draws\"",
    blurb: "Make their card advantage hurt them. Deeply annoying.",
    offline: true,
  },
  {
    category: "Build-arounds",
    label: "Extra turns",
    query: "o:\"take an extra turn\"",
    blurb: "The most obnoxious effect in Magic, all in one list.",
    offline: true,
  },

  // ---- Big swings
  {
    category: "Big swings",
    label: "Just win the game",
    query: "o:\"you win the game\"",
    blurb: "Cards that skip the maths and say it outright.",
    offline: true,
  },
  {
    category: "Big swings",
    label: "Free spells",
    query: "o:\"without paying its mana cost\"",
    blurb: "Mana is a suggestion. These are the cards that break formats.",
    offline: true,
  },
  {
    category: "Big swings",
    label: "Absurd mana costs",
    query: "cmc>=10 -t:land",
    blurb: "Ten mana or more. You will never cast these. Look anyway.",
    offline: true,
  },
  {
    category: "Big swings",
    label: "Beef under four mana",
    query: "t:creature pow>=6 cmc<=4",
    blurb: "Enormous bodies at a suspiciously low price. Check the drawback.",
    offline: true,
  },
  {
    category: "Big swings",
    label: "Steal their stuff",
    query: "o:\"gain control of target\"",
    blurb: "Why build a board when your opponent already did?",
    offline: true,
  },

  // ---- Oddities
  {
    category: "Oddities",
    label: "Zero mana cards",
    query: "cmc=0 -t:land",
    blurb: "Cards that cost literally nothing. Historically a bad idea.",
    offline: true,
  },
  {
    category: "Oddities",
    label: "Cards with no power",
    query: "t:creature pow=*",
    blurb: "Creatures whose size is a maths problem.",
    offline: true,
  },
  {
    category: "Oddities",
    label: "Reserved list, pricey",
    query: "is:reserved usd>=50",
    blurb: "Cards that will never be reprinted, and price accordingly.",
    offline: true,
  },
  {
    category: "Oddities",
    label: "Two cards in one",
    query: "is:dfc",
    blurb: "Double-faced cards \u2014 transform, modal, and the weird ones.",
    offline: true,
  },
  {
    category: "Oddities",
    label: "Everyone draws",
    query: "o:\"each player draws\"",
    blurb: "Group hug: help the table, hope they remember it.",
    offline: true,
  },
  {
    category: "Oddities",
    label: "Squirrels",
    query: "t:squirrel",
    blurb: "A shockingly deep tribe. No notes.",
    offline: true,
  },

  // ---- Commander
  {
    category: "Commander",
    label: "Budget commanders",
    query: "is:commander usd<=2 edhrec<=2000",
    blurb: "Popular legends that cost about as much as a coffee.",
    offline: true,
  },
  {
    category: "Commander",
    label: "Hidden gems",
    query: "edhrec<=5000 usd<=1 -t:land",
    blurb: "Played a lot, costs nearly nothing. The sweet spot.",
    offline: true,
  },
  {
    category: "Commander",
    label: "Mono-black legends",
    query: "is:commander id:b",
    blurb: "Every commander you can build in mono-black.",
    offline: true,
  },
  {
    category: "Commander",
    label: "Pillow fort",
    query: "o:\"can't attack you\"",
    blurb: "Make yourself a boring target and win at your leisure.",
    offline: true,
  },

  // ---- Deep cuts
  {
    category: "Deep cuts",
    label: "Attack triggers",
    query: "o:\"whenever ~ attacks\"",
    blurb: "The ~ stands in for the card's own name \u2014 a Scryfall trick.",
    offline: false,
  },
  {
    category: "Deep cuts",
    label: "Vanilla creatures",
    query: "is:vanilla",
    blurb: "No abilities whatsoever. Pure stats, pure nostalgia.",
    offline: false,
  },
  {
    category: "Deep cuts",
    label: "Activated abilities",
    query: "t:creature o:/:/",
    blurb: "Searching for a colon finds every creature with an activated ability.",
    offline: false,
  },
  {
    category: "Deep cuts",
    label: "Removal, loosely",
    query: "o:/destroy.*creature/",
    blurb: "A regex that catches every wording of \"destroy... creature\".",
    offline: false,
  },

  // ---- Ramp & mana
  {
    category: "Ramp & mana",
    label: "Mana rocks",
    query: "t:artifact o:\"{T}: Add\"",
    blurb: "Artifacts that tap for mana. The backbone of any ramp package.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Mana dorks",
    query: "t:creature o:\"{T}: Add\" cmc<=2",
    blurb: "Cheap creatures that tap for mana. Turn-one acceleration.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Any color of mana",
    query: "o:\"add one mana of any color\"",
    blurb: "Perfect fixing for greedy multicolor decks.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Land tutors",
    query: "o:\"search your library for a basic land\"",
    blurb: "Fetch a land, fix your colors, hit your drops.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Big land ramp",
    query: "o:\"search your library for a land card\"",
    blurb: "Non-basic land fetching. Usually means value lands.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Extra land drops",
    query: "o:\"play an additional land\"",
    blurb: "Play more lands per turn. Landfall decks live here.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Cost reducers",
    query: "o:\"cost {1} less to cast\"",
    blurb: "Make your whole deck cheaper. Quietly one of the best effects.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Rituals",
    query: "o:\"add\" t:instant cmc<=2",
    blurb: "Burst mana for one big turn.",
    offline: true,
  },
  {
    category: "Ramp & mana",
    label: "Untap lands",
    query: "o:\"untap target land\"",
    blurb: "Free mana loops hide in here.",
    offline: true,
  },

  // ---- Card draw
  {
    category: "Card draw",
    label: "Cantrips",
    query: "o:\"draw a card\" cmc<=1",
    blurb: "One mana, replaces itself. Deck consistency in a card.",
    offline: true,
  },
  {
    category: "Card draw",
    label: "Draw three",
    query: "o:\"draw three cards\"",
    blurb: "The big refills.",
    offline: true,
  },
  {
    category: "Card draw",
    label: "Repeatable draw",
    query: "o:\"draw a card\" t:enchantment",
    blurb: "Enchantments that keep drawing turn after turn.",
    offline: true,
  },
  {
    category: "Card draw",
    label: "Draw triggers",
    query: "o:\"whenever you draw\"",
    blurb: "Payoffs for drawing extra cards.",
    offline: true,
  },
  {
    category: "Card draw",
    label: "Wheels",
    query: "o:\"discards their hand\"",
    blurb: "Everyone dumps and redraws. Chaos with upside.",
    offline: true,
  },
  {
    category: "Card draw",
    label: "Impulse draw",
    query: "o:\"exile the top card of your library\"",
    blurb: "Play it this turn or lose it. Red pseudo-draw.",
    offline: true,
  },
  {
    category: "Card draw",
    label: "Dig deep",
    query: "o:\"look at the top four cards\"",
    blurb: "Deep digs to find the piece you need.",
    offline: true,
  },
  {
    category: "Card draw",
    label: "Loot & rummage",
    query: "o:\"draw a card\" o:\"discard a card\"",
    blurb: "Filter your hand. Great with graveyard payoffs.",
    offline: true,
  },

  // ---- Removal
  {
    category: "Removal",
    label: "Kill target creature",
    query: "o:\"destroy target creature\"",
    blurb: "The most fundamental effect in Magic.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Exile removal",
    query: "o:\"exile target creature\"",
    blurb: "No death triggers, no regeneration, no coming back.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Destroy any permanent",
    query: "o:\"destroy target permanent\"",
    blurb: "Answers absolutely anything.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Artifact removal",
    query: "o:\"destroy target artifact\"",
    blurb: "For when the table goes wide on rocks.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Enchantment removal",
    query: "o:\"destroy target enchantment\"",
    blurb: "The effect nobody remembers to pack.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Planeswalker removal",
    query: "o:\"destroy target\" o:\"planeswalker\"",
    blurb: "Rarer than you would think.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Burn removal",
    query: "o:\"deals\" o:\"damage to target creature\"",
    blurb: "Damage-based answers, often at instant speed.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Shrink effects",
    query: "o:\"gets -\" o:\"until end of turn\"",
    blurb: "Kill it with math instead of destruction.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Fight effects",
    query: "o:\"fights target creature\"",
    blurb: "Green removal: let your big thing eat their thing.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Bounce",
    query: "o:\"return target creature to its owner's hand\"",
    blurb: "Temporary, but it dodges indestructible.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Edicts",
    query: "o:\"sacrifices a creature\"",
    blurb: "Gets around hexproof and protection entirely.",
    offline: true,
  },
  {
    category: "Removal",
    label: "Tuck effects",
    query: "o:\"on top of its owner's library\"",
    blurb: "Removal that dodges graveyard recursion.",
    offline: true,
  },

  // ---- Board wipes
  {
    category: "Board wipes",
    label: "Destroy all creatures",
    query: "o:\"destroy all creatures\"",
    blurb: "The reset button.",
    offline: true,
  },
  {
    category: "Board wipes",
    label: "Exile all creatures",
    query: "o:\"exile all creatures\"",
    blurb: "A reset nobody rebuilds from.",
    offline: true,
  },
  {
    category: "Board wipes",
    label: "Nonland sweepers",
    query: "o:\"destroy all nonland permanents\"",
    blurb: "Scorched earth. Everyone starts over.",
    offline: true,
  },
  {
    category: "Board wipes",
    label: "Damage sweepers",
    query: "o:\"damage to each creature\"",
    blurb: "Scaled wipes that spare your bigger stuff.",
    offline: true,
  },
  {
    category: "Board wipes",
    label: "Mass -X/-X",
    query: "o:\"all creatures get -\"",
    blurb: "Wipes that dodge indestructible.",
    offline: true,
  },
  {
    category: "Board wipes",
    label: "Group sacrifice",
    query: "o:\"each player sacrifices\"",
    blurb: "Edicts for the whole table.",
    offline: true,
  },
  {
    category: "Board wipes",
    label: "Artifact wipes",
    query: "o:\"destroy all artifacts\"",
    blurb: "For the affinity player.",
    offline: true,
  },
  {
    category: "Board wipes",
    label: "Enchantment wipes",
    query: "o:\"destroy all enchantments\"",
    blurb: "Rarely needed, devastating when it is.",
    offline: true,
  },

  // ---- Counterspells
  {
    category: "Counterspells",
    label: "Counter any spell",
    query: "o:\"counter target spell\"",
    blurb: "The blue tax.",
    offline: true,
  },
  {
    category: "Counterspells",
    label: "Counter creatures",
    query: "o:\"counter target creature spell\"",
    blurb: "Narrow, cheap, brutal in the right meta.",
    offline: true,
  },
  {
    category: "Counterspells",
    label: "Counter noncreature",
    query: "o:\"counter target noncreature spell\"",
    blurb: "Hits the removal and the combo pieces.",
    offline: true,
  },
  {
    category: "Counterspells",
    label: "Stifle effects",
    query: "o:\"counter target activated or triggered ability\"",
    blurb: "Counter the trigger, not the spell.",
    offline: true,
  },
  {
    category: "Counterspells",
    label: "Soft counters",
    query: "o:\"unless its controller pays\"",
    blurb: "Tax counters. Always relevant early.",
    offline: true,
  },
  {
    category: "Counterspells",
    label: "Uncounterable",
    query: "o:\"can't be countered\"",
    blurb: "Beat the blue player at their own game.",
    offline: true,
  },

  // ---- Protection
  {
    category: "Protection",
    label: "Hexproof granters",
    query: "o:\"gains hexproof\"",
    blurb: "Save your commander mid-removal.",
    offline: true,
  },
  {
    category: "Protection",
    label: "Indestructible",
    query: "o:\"gain indestructible\"",
    blurb: "Blank a board wipe.",
    offline: true,
  },
  {
    category: "Protection",
    label: "Protection from",
    query: "o:\"protection from\"",
    blurb: "The old-school catch-all.",
    offline: true,
  },
  {
    category: "Protection",
    label: "Phasing out",
    query: "o:\"phases out\"",
    blurb: "Dodges everything, keeps auras attached.",
    offline: true,
  },
  {
    category: "Protection",
    label: "Ward creatures",
    query: "kw:ward",
    blurb: "Makes your things annoying to target.",
    offline: true,
  },
  {
    category: "Protection",
    label: "Regenerate",
    query: "o:\"regenerate\"",
    blurb: "Retro protection, still works on wipes.",
    offline: true,
  },

  // ---- Recursion
  {
    category: "Recursion",
    label: "Creature reanimation",
    query: "o:\"return target creature card from your graveyard to the battlefield\"",
    blurb: "Cheat the big thing into play.",
    offline: true,
  },
  {
    category: "Recursion",
    label: "Raise Dead effects",
    query: "o:\"return target creature card from your graveyard to your hand\"",
    blurb: "Slower, safer recursion.",
    offline: true,
  },
  {
    category: "Recursion",
    label: "Mass reanimation",
    query: "o:\"all creature cards from your graveyard\"",
    blurb: "One card, entire graveyard, chaos.",
    offline: true,
  },
  {
    category: "Recursion",
    label: "Any card back",
    query: "o:\"return target card from your graveyard to your hand\"",
    blurb: "Rebuy anything, not just creatures.",
    offline: true,
  },
  {
    category: "Recursion",
    label: "Cast from graveyard",
    query: "o:\"you may cast\" o:\"from your graveyard\"",
    blurb: "Recursion built into the card itself.",
    offline: true,
  },
  {
    category: "Recursion",
    label: "Self-returning",
    query: "o:\"return it to the battlefield\"",
    blurb: "Creatures that refuse to stay dead.",
    offline: true,
  },

  // ---- Tutors
  {
    category: "Tutors",
    label: "Creature tutors",
    query: "o:\"search your library for a creature card\"",
    blurb: "Find your combo piece or your beater.",
    offline: true,
  },
  {
    category: "Tutors",
    label: "Artifact tutors",
    query: "o:\"search your library for an artifact card\"",
    blurb: "Consistency for artifact decks.",
    offline: true,
  },
  {
    category: "Tutors",
    label: "Spell tutors",
    query: "o:\"search your library for an instant or sorcery card\"",
    blurb: "Find the answer you need.",
    offline: true,
  },
  {
    category: "Tutors",
    label: "Any card tutors",
    query: "o:\"search your library for a card\"",
    blurb: "The unconditional ones. Usually expensive.",
    offline: true,
  },
  {
    category: "Tutors",
    label: "Budget tutors",
    query: "o:\"search your library for a\" usd<=2",
    blurb: "Consistency without the price tag.",
    offline: true,
  },

  // ---- Tokens
  {
    category: "Tokens",
    label: "1/1 makers",
    query: "o:\"create a 1/1\"",
    blurb: "Go wide, chump block, or fuel a sacrifice engine.",
    offline: true,
  },
  {
    category: "Tokens",
    label: "Big tokens",
    query: "o:\"create a 4/4\"",
    blurb: "Fewer bodies, more beef.",
    offline: true,
  },
  {
    category: "Tokens",
    label: "Token copies",
    query: "o:\"that's a copy of target creature\"",
    blurb: "Copy the best thing on the board.",
    offline: true,
  },
  {
    category: "Tokens",
    label: "Treasure & food",
    query: "o:\"create a food token\"",
    blurb: "Value tokens for artifact synergies.",
    offline: true,
  },
  {
    category: "Tokens",
    label: "Clue tokens",
    query: "o:\"create a clue token\"",
    blurb: "Draw stapled to an artifact.",
    offline: true,
  },
  {
    category: "Tokens",
    label: "Token payoffs",
    query: "o:\"creature tokens you control\"",
    blurb: "Cards that reward going wide.",
    offline: true,
  },

  // ---- +1/+1 counters
  {
    category: "+1/+1 counters",
    label: "Counter placement",
    query: "o:\"+1/+1 counter\"",
    blurb: "The most common counter in the game.",
    offline: true,
  },
  {
    category: "+1/+1 counters",
    label: "Proliferate",
    query: "kw:proliferate",
    blurb: "Add one more of every counter, everywhere.",
    offline: true,
  },
  {
    category: "+1/+1 counters",
    label: "Counter doublers",
    query: "o:\"twice that many +1/+1 counters\"",
    blurb: "Double your counters. Build around it.",
    offline: true,
  },
  {
    category: "+1/+1 counters",
    label: "Counter payoffs",
    query: "o:\"whenever one or more +1/+1 counters\"",
    blurb: "Triggers that reward the counters theme.",
    offline: true,
  },
  {
    category: "+1/+1 counters",
    label: "Move counters",
    query: "o:\"move a +1/+1 counter\"",
    blurb: "Shuffle counters where they matter most.",
    offline: true,
  },

  // ---- Aristocrats
  {
    category: "Aristocrats",
    label: "Death triggers",
    query: "o:\"whenever a creature you control dies\"",
    blurb: "The core of any sacrifice deck.",
    offline: true,
  },
  {
    category: "Aristocrats",
    label: "Drain the table",
    query: "o:\"each opponent loses\" o:\"you gain\"",
    blurb: "Drain effects that close games.",
    offline: true,
  },
  {
    category: "Aristocrats",
    label: "Dies triggers",
    query: "o:\"when this creature dies\"",
    blurb: "Value baked into dying.",
    offline: true,
  },
  {
    category: "Aristocrats",
    label: "Sacrifice payoffs",
    query: "o:\"whenever you sacrifice\"",
    blurb: "Rewards for feeding the machine.",
    offline: true,
  },

  // ---- Lifegain
  {
    category: "Lifegain",
    label: "Lifelink",
    query: "kw:lifelink",
    blurb: "Damage that doubles as life.",
    offline: true,
  },
  {
    category: "Lifegain",
    label: "Life to resources",
    query: "o:\"pay\" o:\"life\"",
    blurb: "Life as a currency. Use it before you lose it.",
    offline: true,
  },
  {
    category: "Lifegain",
    label: "Life loss punishment",
    query: "o:\"whenever an opponent loses life\"",
    blurb: "Punish them for their own bad turns.",
    offline: true,
  },

  // ---- Combat
  {
    category: "Combat",
    label: "Extra combats",
    query: "o:\"additional combat phase\"",
    blurb: "Attack again. And again.",
    offline: true,
  },
  {
    category: "Combat",
    label: "Unblockable",
    query: "o:\"can't be blocked\"",
    blurb: "Damage that always connects.",
    offline: true,
  },
  {
    category: "Combat",
    label: "Mass evasion",
    query: "o:\"creatures you control have\"",
    blurb: "Team-wide keywords and anthems.",
    offline: true,
  },
  {
    category: "Combat",
    label: "Untap attackers",
    query: "o:\"untap all creatures you control\"",
    blurb: "Attack, untap, block. Or attack again.",
    offline: true,
  },
  {
    category: "Combat",
    label: "Goad",
    query: "kw:goad",
    blurb: "Force their creatures to attack someone else.",
    offline: true,
  },
  {
    category: "Combat",
    label: "Must be blocked",
    query: "o:\"must be blocked\"",
    blurb: "Force bad blocks, punish the table.",
    offline: true,
  },
  {
    category: "Combat",
    label: "Double damage",
    query: "o:\"deals double\"",
    blurb: "Damage doublers. Games end fast.",
    offline: true,
  },

  // ---- Blink & ETB
  {
    category: "Blink & ETB",
    label: "Enters triggers",
    query: "o:\"when this creature enters\"",
    blurb: "The value engine of every blink deck.",
    offline: true,
  },
  {
    category: "Blink & ETB",
    label: "Blink effects",
    query: "o:\"exile\" o:\"return\" o:\"to the battlefield under\"",
    blurb: "Flicker your creatures to reuse their triggers.",
    offline: true,
  },
  {
    category: "Blink & ETB",
    label: "Blink at end of turn",
    query: "o:\"at the beginning of the next end step, return\"",
    blurb: "Temporary exile, permanent value.",
    offline: true,
  },
  {
    category: "Blink & ETB",
    label: "Clone effects",
    query: "o:\"as a copy of any creature\"",
    blurb: "Be the best thing on the board.",
    offline: true,
  },

  // ---- Stax & taxes
  {
    category: "Stax & taxes",
    label: "Tax effects",
    query: "o:\"unless that player pays\"",
    blurb: "Make everything cost more. Slow the table down.",
    offline: true,
  },
  {
    category: "Stax & taxes",
    label: "Attack restrictions",
    query: "o:\"creatures can't attack\"",
    blurb: "Pillow fort. Be boring, win later.",
    offline: true,
  },
  {
    category: "Stax & taxes",
    label: "Skip steps",
    query: "o:\"skip your\"",
    blurb: "Symmetrical pain you have built around.",
    offline: true,
  },
  {
    category: "Stax & taxes",
    label: "Stay tapped",
    query: "o:\"don't untap\"",
    blurb: "Lock down their board.",
    offline: true,
  },
  {
    category: "Stax & taxes",
    label: "Can't search",
    query: "o:\"can't search\"",
    blurb: "Shut off tutors and fetchlands.",
    offline: true,
  },

  // ---- Spellslinger
  {
    category: "Spellslinger",
    label: "Cast triggers",
    query: "o:\"whenever you cast an instant or sorcery\"",
    blurb: "The core payoff of spells decks.",
    offline: true,
  },
  {
    category: "Spellslinger",
    label: "Copy spells",
    query: "o:\"copy target instant or sorcery spell\"",
    blurb: "One spell, two effects.",
    offline: true,
  },
  {
    category: "Spellslinger",
    label: "Storm",
    query: "kw:storm",
    blurb: "The most broken keyword ever printed.",
    offline: true,
  },
  {
    category: "Spellslinger",
    label: "Flashback",
    query: "kw:flashback",
    blurb: "Cast it twice.",
    offline: true,
  },
  {
    category: "Spellslinger",
    label: "Cast from exile",
    query: "o:\"you may cast it\" o:\"exile\"",
    blurb: "Free value from the top of your library.",
    offline: true,
  },

  // ---- Landfall & lands
  {
    category: "Landfall & lands",
    label: "Landfall",
    query: "o:\"whenever a land you control enters\"",
    blurb: "Every land drop becomes a trigger.",
    offline: true,
  },
  {
    category: "Landfall & lands",
    label: "Land destruction",
    query: "o:\"destroy target land\"",
    blurb: "Deeply unpopular. Extremely effective.",
    offline: true,
  },
  {
    category: "Landfall & lands",
    label: "Lands from graveyard",
    query: "o:\"land card from your graveyard\"",
    blurb: "Recur your fetches and value lands.",
    offline: true,
  },
  {
    category: "Landfall & lands",
    label: "Utility lands",
    query: "t:land o:\":\" -o:\"add\"",
    blurb: "Lands that do something other than make mana.",
    offline: true,
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

/** Free-text filter over label, blurb, category and the query itself. */
export function filterFunSearches(term, offlineOnly = false) {
  const pool = offlineOnly ? FUN_SEARCHES.filter(s => s.offline) : FUN_SEARCHES
  const t = (term || '').trim().toLowerCase()
  if (!t) return pool
  return pool.filter(s =>
    s.label.toLowerCase().includes(t) ||
    s.blurb.toLowerCase().includes(t) ||
    s.category.toLowerCase().includes(t) ||
    s.query.toLowerCase().includes(t)
  )
}
