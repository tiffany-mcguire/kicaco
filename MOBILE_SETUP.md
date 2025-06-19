# Mobile Setup Guide for Kicaco

## Common Issues on Mobile

The Kicaco app uses the OpenAI API directly from the browser, which can cause issues on mobile devices due to:

1. **Missing Environment Variables**: Mobile browsers don't have access to `.env` files
2. **CORS Restrictions**: Mobile browsers are stricter about cross-origin requests
3. **Security Policies**: Some mobile browsers block direct API calls for security

## Solutions

### Option 1: Use a Backend Proxy (Recommended for Production)

Instead of calling OpenAI directly from the browser, set up a backend server that:
- Stores the API keys securely
- Proxies requests to OpenAI
- Handles authentication
- Works around CORS issues

### Option 2: Build with Environment Variables

1. Create a `.env` file in the project root:
```bash
VITE_OPENAI_API_KEY=your_api_key_here
VITE_ASSISTANT_ID=your_assistant_id_here
VITE_OPENAI_PROJECT_ID=your_project_id_here
```

2. Build the app with these variables:
```bash
npm run build
```

3. Deploy the built files to a hosting service

### Option 3: Use a Different Approach for Mobile

Consider using:
- Progressive Web App (PWA) with service workers
- Native mobile app wrapper (React Native, Capacitor)
- Server-side rendering (SSR) with Next.js

## Debugging on Mobile

1. **Check the Debug Panel**: A red "Debug" button appears on mobile devices showing:
   - Environment variable status
   - Recent errors
   - Device information

2. **Use Remote Debugging**:
   - iOS: Safari Developer Tools
   - Android: Chrome DevTools Remote Debugging

3. **Common Error Messages**:
   - "API key is not configured": Environment variables are missing
   - "Network error": Check internet connection
   - "CORS error": Browser is blocking the API call

## Temporary Workaround

For testing purposes only, you can:

1. Use a desktop browser
2. Use a mobile browser in desktop mode
3. Disable mobile browser security (not recommended)

## Security Warning

The current implementation uses `dangerouslyAllowBrowser: true` which exposes your API key in the browser. This is not secure for production use. Always use a backend proxy for production deployments. 