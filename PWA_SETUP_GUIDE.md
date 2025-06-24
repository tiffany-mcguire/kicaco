# 🚀 Kicaco PWA Setup & Testing Guide

## 📋 Prerequisites
- Node.js installed
- HTTPS connection (required for PWA features)
- Mobile device or Chrome DevTools for testing

## 🛠 Step 1: Install Dependencies
Dependencies are already configured. If you need to reinstall:
```bash
npm install
```

## 🔧 Step 2: Development with HTTPS

### Option A: Local HTTPS Development
```bash
npm run dev:https
```
This starts Vite with HTTPS on `https://localhost:5173`

### Option B: Network Access (for mobile testing)
```bash
npm run dev:https
```
Then access via your local IP: `https://[YOUR_IP]:5173`

### Option C: Production Build + Preview
```bash
npm run build
npm run preview:https
```

## 📱 Step 3: Test PWA Installation

### On Desktop (Chrome):
1. Open `https://localhost:5173` in Chrome
2. Look for install icon in address bar
3. Click to install as PWA

### On Mobile:
1. Open URL in mobile browser (Safari/Chrome)
2. Look for "Add to Home Screen" option
3. Install and open from home screen

## 🔗 Step 4: Test Share Target

### Setup Required:
1. **Must be accessed via HTTPS**
2. **Must be installed as PWA**
3. **Share target only works on installed PWA**

### Testing Share Functionality:

#### From Messages App:
1. Open Messages app
2. Find a text with event info like: "Soccer practice tomorrow at 4pm"
3. Long press the message
4. Tap Share → Kicaco
5. Should open Kicaco share processor

#### From Safari:
1. Open any webpage
2. Tap Share button
3. Look for Kicaco in share options
4. Share webpage to Kicaco

#### From Photos:
1. Open Photos app
2. Select a screenshot of a schedule/flyer
3. Tap Share → Kicaco
4. Should process the image automatically

## 🧪 Step 5: Test Smart Paste

1. Copy some event text: "Emma's ballet recital Friday 7pm at Lincoln Center"
2. Open Kicaco
3. Tap the paste button in footer
4. Should analyze and create event

## 🔍 Troubleshooting

### PWA Not Installing:
- ✅ Ensure you're using HTTPS
- ✅ Check browser console for manifest errors
- ✅ Verify service worker registration

### Share Target Not Appearing:
- ✅ Must be installed as PWA first
- ✅ Only works on HTTPS
- ✅ May take a few seconds to register after install

### Chrome DevTools Testing:
1. F12 → Application tab
2. Check "Service Workers" section
3. Check "Manifest" section
4. Use "Storage" to clear if needed

## 📊 Verification Checklist

- [ ] PWA installs successfully
- [ ] App works offline (basic caching)
- [ ] Share target appears in other apps
- [ ] Shared content processes correctly
- [ ] Smart paste button works
- [ ] App icon appears on home screen

## 🚨 Common Issues

### 1. "Share target not found"
**Solution:** Reinstall PWA after clearing browser data

### 2. "HTTPS required"
**Solution:** Use `npm run dev:https` or deploy to HTTPS server

### 3. "Service worker not registering"
**Solution:** Check browser console, may need to clear cache

### 4. "Icons not loading"
**Solution:** Add proper PNG icons to `/public/` directory

## 🎯 Next Steps

Once PWA is working:
1. Replace vite.svg with proper app icons (192x192, 512x512)
2. Test on actual mobile devices
3. Configure push notifications (future enhancement)
4. Add more sophisticated caching strategies

## 📞 Testing Commands Quick Reference

```bash
# Start HTTPS development server
npm run dev:https

# Build and preview with HTTPS
npm run build && npm run preview:https

# Check if service worker is registered
# (Open browser console and check for SW logs)
```

## 🔧 Environment Variables

Make sure these are set for full functionality:
```
VITE_OPENAI_API_KEY=your_key_here
VITE_ASSISTANT_ID=your_assistant_id
VITE_USE_BACKEND_PROXY=true  # for production
``` 