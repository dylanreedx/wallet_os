# Phase 9: PWA & Mobile Optimization

## Objective
Make the app fully functional as a Progressive Web App with offline support and native-like experience on iPhone.

## Tasks

### 9.1 Service Worker
- [ ] Register service worker
- [ ] Cache static assets
- [ ] Cache API responses
- [ ] Offline fallback pages
- [ ] Update strategy
- [ ] Background sync

**Files to create:**
- `public/sw.js` (or use vite-plugin-pwa generated)
- `src/client/lib/sw-register.ts`

### 9.2 App Icons
- [ ] Create pwa-192x192.png
- [ ] Create pwa-512x512.png
- [ ] Create apple-touch-icon.png (180x180)
- [ ] Create favicon.ico
- [ ] Add to manifest.json
- [ ] Test on devices

**Files to modify:**
- `public/manifest.json`
- `index.html`

### 9.3 iOS Optimizations
- [ ] Apple touch icon meta tag (already in index.html)
- [ ] Apple mobile web app capable (already set)
- [ ] Status bar style
- [ ] Splash screen configuration
- [ ] Safe area insets
- [ ] Viewport configuration (already set)

**Files to modify:**
- `index.html`
- `src/client/styles/app.css`

### 9.4 Gesture Handlers
- [ ] Swipe gestures for cards
- [ ] Pull-to-refresh
- [ ] Swipe to delete
- [ ] Long press actions
- [ ] Touch feedback

**Files to create:**
- `src/client/lib/gestures.ts`
- `src/client/components/ui/SwipeableCard.tsx`
- `src/client/components/ui/PullToRefresh.tsx`

### 9.5 Smooth Animations
- [ ] Page transitions
- [ ] List item animations
- [ ] Modal animations
- [ ] Progress bar animations
- [ ] Loading animations
- [ ] Success/error animations

**Files to modify:**
- `src/client/styles/app.css`
- Various component files

### 9.6 Performance Optimization
- [ ] Code splitting
- [ ] Lazy loading routes
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Memory leak prevention
- [ ] Render optimization

**Files to modify:**
- `vite.config.ts`
- Route files

### 9.7 Testing on iPhone
- [ ] Test on Safari iOS
- [ ] Test install flow
- [ ] Test offline mode
- [ ] Test gestures
- [ ] Test performance
- [ ] Fix any iOS-specific issues

## Success Criteria

- [ ] App installs on iPhone
- [ ] Works offline
- [ ] Smooth animations
- [ ] Gestures work correctly
- [ ] Fast load times
- [ ] No memory leaks
- [ ] Passes Lighthouse PWA audit

## Estimated Time

- 9.1 Service Worker: 6 hours
- 9.2 App Icons: 2 hours
- 9.3 iOS Optimizations: 3 hours
- 9.4 Gesture Handlers: 6 hours
- 9.5 Smooth Animations: 4 hours
- 9.6 Performance Optimization: 4 hours
- 9.7 Testing on iPhone: 3 hours

**Total**: ~28 hours
