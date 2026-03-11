# PWA & Capacitor Setup Guide

## ✅ PWA Setup Complete

Your app is now a Progressive Web App! Users can install it directly from their browser:

### Testing PWA Installation

1. **Development Mode:**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`

2. **Production Build:**

   ```bash
   npm run build
   npm start
   ```

3. **Install on Mobile:**
   - **Android Chrome:** Tap the menu (⋮) → "Add to Home screen"
   - **iOS Safari:** Tap Share (□↑) → "Add to Home Screen"
   - **Desktop:** Look for the install icon in the address bar

### PWA Features Added:

- ✅ Web manifest with app metadata
- ✅ App icons (192x192 and 512x512)
- ✅ Service Worker for offline support
- ✅ Standalone display mode (full-screen app experience)
- ✅ Theme color and viewport optimization
- ✅ Apple-specific meta tags for iOS

---

## 📱 Capacitor Native App Setup

To build native iOS and Android apps:

### Step 1: Install Capacitor Dependencies

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen
```

### Step 2: Build Your Web App for Production

This app uses live Next.js API routes and authentication, so do not use static export for Capacitor.
Capacitor should load the hosted web app instead.

```bash
# Example production sync with a deployed URL
$env:CAP_SERVER_URL="https://your-production-url.com"
npm run cap:sync
```

### Step 3: Initialize Capacitor Platforms

```bash
# Add Android
npx cap add android

# Add iOS (macOS only)
npx cap add ios
```

### Step 4: Sync Your Web Build

After any web changes:

```bash
# Production / hosted environment
$env:CAP_SERVER_URL="https://your-production-url.com"
npm run cap:sync

# Android emulator against local dev server
# Start the web app separately with: npm run dev
npm run cap:sync:dev:android
```

### Step 5: Open Native IDEs

**Android (Android Studio):**

```bash
npx cap open android
```

- Build → Generate Signed Bundle/APK
- Follow Android Studio prompts to create release builds

**iOS (Xcode - macOS only):**

```bash
npx cap open ios
```

- Select team and provisioning profile
- Product → Archive → Distribute App

---

## 🎨 Customizing Icons

Replace the placeholder icons in `/public/`:

- `icon-192.png` - 192x192px app icon
- `icon-512.png` - 512x512px app icon

For production, generate a full icon set:

1. Create a 1024x1024px PNG of your logo
2. Use a tool like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)

```bash
npx pwa-asset-generator logo.png ./public/icons --icon-only
```

---

## 📦 App Store Publishing

### Google Play Store (Android)

1. Create a Google Play Console account ($25 one-time fee)
2. Generate a signed APK/AAB in Android Studio
3. Upload to Play Console with:
   - App screenshots (phone, tablet)
   - Description (up to 4000 chars)
   - Privacy policy URL
   - Content rating questionnaire

### Apple App Store (iOS)

1. Enroll in Apple Developer Program ($99/year)
2. Create App Store Connect listing
3. Archive and upload via Xcode
4. Submit for review with:
   - App screenshots (all device sizes)
   - Description (up to 4000 chars)
   - Privacy policy URL
   - Keywords

---

## 🔧 Next.js + Capacitor Configuration

### Important Note on Next.js Export

Static export is not compatible with this app because it uses server-side routes under `/api/*` and authenticated server rendering.
Use Capacitor with a hosted server URL instead.

```typescript
const serverUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  webDir: "www",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
      }
    : undefined,
};
```

Notes:

- For Android emulator, use `http://10.0.2.2:3000` to reach your host machine.
- For a real device, use your machine's LAN IP such as `http://192.168.1.50:3000`.
- For production builds, use your deployed HTTPS URL.

### Hosted Server Workflow

1. Deploy your Next.js app to a server (Vercel, AWS, etc.)
2. Set `CAP_SERVER_URL` before syncing Capacitor
3. Open the native project and build from Android Studio or Xcode

---

## 🚀 Quick Commands Reference

```bash
# PWA Development
npm run dev

# Build for PWA
npm run build
npm start

# Capacitor: Add platforms
npx cap add android
npx cap add ios

# Capacitor: Sync after web changes
$env:CAP_SERVER_URL="https://your-production-url.com"
npm run cap:sync

# Android emulator using local dev server
npm run cap:sync:dev:android

# Capacitor: Open native IDE
npx cap open android
npx cap open ios

# Capacitor: Run on device/emulator
npx cap run android
npx cap run ios
```

---

## 📋 Checklist for App Store Submission

- [ ] Replace placeholder icons with branded icons
- [ ] Add privacy policy page (already exists at `/privacy`)
- [ ] Add terms of service (already exists at `/terms`)
- [ ] Create app screenshots for all device sizes
- [ ] Test install flow on real devices
- [ ] Set up app signing certificates
- [ ] Prepare store listings (description, keywords)
- [ ] Test offline functionality
- [ ] Configure deep linking (optional)
- [ ] Set up analytics/crash reporting (optional)

---

## 🆘 Troubleshooting

**Service Worker not registering:**

- Ensure you're on HTTPS or localhost
- Check browser console for errors
- Clear cache and reload

**Capacitor build fails:**

- Ensure `CAP_SERVER_URL` is set when you want the native app to load your hosted or local dev server
- For Android emulator local development, use `http://10.0.2.2:3000` instead of `http://localhost:3000`
- If Android Studio reports missing `capacitor.settings.gradle`, run `npm run cap:sync` first

**Icons not showing:**

- Verify icon files exist in `/public/`
- Check manifest.json paths match file names
- Clear browser cache

---

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Emulator Networking](https://developer.android.com/studio/run/emulator-networking)
- [Google Play Console](https://play.google.com/console/)
- [App Store Connect](https://appstoreconnect.apple.com/)
