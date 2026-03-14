# MTG Card Search - Project Context

## Quick Start
Run `cd C:\Users\BiggityBrolo\Desktop\mtg-card-search` to work on this project.

## Related Projects (Same Firebase Account)
- **mtg-card-search**: `C:\Users\BiggityBrolo\Desktop\mtg-card-search`
- **mtgpricetracker**: https://github.com/SteezyBroDeezy/mtgpricetracker
- **mtgdecklist**: https://github.com/SteezyBroDeezy/mtgdecklist

All three share Firebase project: `mtg-card-search-e0ed3`

## Recent Work (March 2025)

### Firebase Quota Optimization - COMPLETED
All 3 apps were hitting Firebase's 50K reads/day limit. Fixed with:

1. **Offline-first caching** - Data saved to localStorage/IndexedDB first
2. **1-hour cache TTL** - Only fetch from Firebase when cache expired
3. **Manual sync only** - No auto-sync, user clicks Sync button
4. **Graceful quota handling** - Apps work offline if quota exceeded

### Key Files Modified
- `src/lib/priceOracleCache.js` - NEW: Caches Price Oracle data locally
- `src/lib/listSync.js` - Fixed image format for Scryfall API cards
- `src/App.jsx` - Combined sync for lists + price oracle
- `src/components/QuickCardView.jsx` - Uses cached watchlist check
- `src/components/CardDetail.jsx` - Uses cached watchlist, fixed images
- `src/components/PriceOracle.jsx` - Uses cached data

### How Sync Works Now
- Changes save to localStorage immediately (instant)
- Firebase sync only happens when user clicks Sync button
- Sync button shows yellow "Sync Now" when changes pending
- Sync button shows green "Synced" when up-to-date

## If Firebase Quota Issues Return
Options discussed:
1. **Stay on free tier** - Current aggressive caching should help (IMPLEMENTED)
2. **Upgrade to Blaze** - Pay ~$1-5/mo for unlimited reads
3. **Split into 3 Firebase projects** - Each gets 50K reads, but users need separate accounts

## Tech Stack
- React 18 + Vite
- IndexedDB (Dexie) for local card database
- Firebase Auth + Firestore
- Scryfall API for card data
- PWA with service worker

## Build & Deploy
```bash
npm run build      # Build to dist/
git push           # Auto-deploys to GitHub Pages
```

Live site: https://steezybrodeezy.github.io/mtg-card-search/
