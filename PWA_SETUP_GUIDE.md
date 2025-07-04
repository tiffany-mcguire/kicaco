# 🚀 Kicaco PWA Setup & Testing Guide

## 📋 Prerequisites
- Node.js installed
- HTTPS certificates (see Certificate Setup below)
- Mobile device or Chrome DevTools for testing

## 🔐 Certificate Setup (Required for HTTPS)

The PWA requires HTTPS to work properly. You'll need to set up certificates in the `certs/` directory:

### Option A: Using mkcert (Recommended)
```bash
# Install mkcert (macOS)
brew install mkcert

# Create certificates
mkcert -install
mkcert localhost 127.0.0.1 ::1 [YOUR_LOCAL_IP]

# Move certificates to certs directory
mkdir -p certs
mv localhost+4.pem certs/
mv localhost+4-key.pem certs/
```

### Option B: Self-signed certificates
```bash
# Create certs directory
mkdir -p certs

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/localhost+4-key.pem -out certs/localhost+4.pem -days 365 -nodes -subj "/CN=localhost"
```

## 🛠 Step 1: Install Dependencies
```bash
npm install
```

## 🔧 Step 2: Development with HTTPS

### Start Development Server
```bash
npm run dev:https
```
This starts Vite with HTTPS on `https://localhost:5173`

### For Mobile Testing
```bash
npm run dev:https
```
Then access via your local IP: `https://[YOUR_IP]:5173`

### Production Build + Preview
```bash
npm run build
npm run preview:https
```

## 📱 Step 3: Test PWA Installation

### On Desktop (Chrome):
1. Open `https://localhost:5173` in Chrome
2. Look for install icon in address bar
3. Click to install as PWA
4. Verify app opens in standalone window

### On Mobile:
1. Open URL in mobile browser (Safari/Chrome)
2. Look for "Add to Home Screen" option
3. Install and open from home screen
4. Verify standalone app experience

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
5. Should open Kicaco share processor at `/share` route

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
- ✅ Check that certificates are properly configured
- ✅ Check browser console for manifest errors
- ✅ Verify service worker registration

### Share Target Not Appearing:
- ✅ Must be installed as PWA first
- ✅ Only works on HTTPS
- ✅ May take a few seconds to register after install
- ✅ Try reinstalling the PWA

### Certificate Issues:
- ✅ Ensure certificates exist in `certs/` directory
- ✅ Certificate files must be named exactly: `localhost+4.pem` and `localhost+4-key.pem`
- ✅ Try regenerating certificates with mkcert

### Chrome DevTools Testing:
1. F12 → Application tab
2. Check "Service Workers" section
3. Check "Manifest" section
4. Use "Storage" to clear if needed

## 📊 Verification Checklist

- [ ] HTTPS certificates are configured
- [ ] PWA installs successfully
- [ ] App works offline (basic caching)
- [ ] Share target appears in other apps
- [ ] Shared content processes correctly
- [ ] Smart paste button works
- [ ] App icon appears on home screen
- [ ] Standalone app experience works

## 🚨 Common Issues

### 1. "Share target not found"
**Solution:** Reinstall PWA after clearing browser data

### 2. "HTTPS required" or certificate errors
**Solution:** 
- Ensure certificates exist in `certs/` directory
- Use `npm run dev:https` (not `npm run dev`)
- Regenerate certificates if needed

### 3. "Service worker not registering"
**Solution:** 
- Check browser console for errors
- Clear browser cache and storage
- Verify PWA plugin configuration

### 4. "Icons not loading"
**Solution:** 
- Currently using vite.svg as placeholder
- Replace with proper app icons (192x192, 512x512) in `/public/`

## 🎯 Current PWA Configuration

### Manifest Settings:
- **Name**: Kicaco - Family Assistant
- **Theme Color**: #217e8f (Kicaco brand color)
- **Display**: Standalone
- **Share Target**: Enabled for text, URLs, and images
- **Caching**: OpenAI API and event images cached

### Available Scripts:
- `npm run dev` - Development without HTTPS
- `npm run dev:https` - Development with HTTPS (required for PWA)
- `npm run build` - Production build
- `npm run preview:https` - Preview production build with HTTPS

## 📞 Testing Commands Quick Reference

```bash
# Start HTTPS development server (required for PWA)
npm run dev:https

# Build and preview with HTTPS
npm run build
npm run preview:https

# Check service worker registration
# (Open browser console and look for SW logs)
```

## 🔧 Environment Variables

Make sure these are set for full functionality:
```
VITE_OPENAI_API_KEY=your_key_here
VITE_ASSISTANT_ID=your_assistant_id
VITE_USE_BACKEND_PROXY=true  # for production
```

## 🚀 Next Steps

Once PWA is working:
1. Replace vite.svg with proper app icons (192x192, 512x512)
2. Test on actual mobile devices
3. Configure push notifications (future enhancement)
4. Add more sophisticated caching strategies
5. Test offline functionality thoroughly 