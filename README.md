# Calorie Tracker

A full-stack Next.js application for tracking daily food intake and macronutrients (calories, protein, carbs, and fat).

## Open Food Facts Integration

This project uses [Open Food Facts](https://world.openfoodfacts.org/), an open collaborative food database. When you scan a barcode, the app queries Open Food Facts to auto-fill nutrition data. If not found locally, it attempts a remote lookup before prompting for manual entry.

See [Open Food Facts Terms of Use](https://world.openfoodfacts.org/terms-of-use) for details.

## Features

- 📊 **Daily Food Diary** — Track meals across Breakfast, Lunch, Dinner, and Snacks
- 🔢 **Macro Tracking** — Monitor calories, protein, carbs, and fat
- 📈 **Dashboard** — Daily, weekly, and monthly nutrition summaries with progress bars
- 📅 **Daily Summary** — Accordion showing nutrition totals vs goals
- ⚙️ **Customizable Settings** — Set nutrition goals and measurement units
- 💳 **Premium Subscription** — Ad-free upgrade for £2.50/month with automated sync
- 🔄 **Unit Conversions** — Support for kcal/cal/Cal, g/mg/oz, g/kg/lbs, ml/cup/tbsp/tsp/L
- 🍔 **Food Management** — Create, edit, delete custom foods
- 🌐 **Progressive Web App** — Install on any device, offline support, full-screen
- 📲 **Mobile Apps** — Native builds via Capacitor (iOS/Android)
- 🔐 **Authentication** — Google OAuth and email/password with verification
- 🛡️ **Admin Panel** — User and food database management
- 💾 **PostgreSQL** — Persistent storage with Prisma ORM
- ⚡ **Server Components** — Fast initial loads with Next.js App Router
- 🎨 **Modern UI** — Tailwind CSS with dark mode
- 🧪 **Testing** — Jest (unit) and Playwright (end-to-end)

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL with pg adapter
- **ORM:** Prisma 7.3.0
- **Authentication:** NextAuth v5 (beta) with Google OAuth & Credentials
- **Styling:** Tailwind CSS 4
- **Runtime:** React 19
- **PWA:** Service Workers, Web Manifest, offline support
- **Mobile:** Capacitor for iOS/Android native apps
- **Unit Testing:** Jest + React Testing Library
- **E2E Testing:** Playwright
- **Email:** SMTP (for email verification)

## Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted)
- Google OAuth credentials
- SMTP server (for email verification)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/YellowSmiley/Calorie-Tracker
   cd Calorie-Tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Required variables:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/calorie_tracker"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   AUTH_SECRET="your-generated-secret"
   AUTH_URL="http://localhost:3000"
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-smtp-user"
   SMTP_PASSWORD="your-smtp-password"
   SMTP_FROM="noreply@example.com"
   REDIS_URL="redis://localhost:6379"
   NEXT_PUBLIC_ADSENSE_HEADER_SLOT_ID="1234567890"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PREMIUM_PRICE_ID="price_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

   **Environment file conventions:**
   - `.env` — local development values (do not commit secrets)
   - `.env.production` — production values used when `NODE_ENV=production` (e.g. a production build run locally or in CI)

   Next.js merges these in priority order: `.env.production.local` > `.env.local` > `.env.production` > `.env`. For day-to-day local dev, `.env` is sufficient. For production deployments via Docker or a managed host, set env vars directly in the platform (Docker `.env` file, Vercel dashboard, Railway variables, etc.) rather than committing a `.env.production` file.

   The server validates these required runtime variables once during startup and fails fast if any are missing or malformed.

   `REDIS_URL` is optional in local development. If set, rate limiting uses shared Redis storage for multi-instance deployments. If omitted, the app falls back to in-memory limiting.

   Generate `AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

   Validation rules:
   - `AUTH_SECRET` must be at least 32 characters long
   - `AUTH_URL` must be a valid `http(s)` URL and should be `https` in production
   - `SMTP_PORT` must be a numeric port and `SMTP_FROM` must be a valid email address

   Stripe variables are optional unless you enable premium billing. When configured, set your Stripe webhook endpoint to:
   - `POST /api/billing/webhook`
   - Listen for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
   - Premium access is derived from the active Stripe subscription state and updates automatically via webhook events.

   AdSense note:
   - `NEXT_PUBLIC_ADSENSE_HEADER_SLOT_ID` must be set to a real AdSense ad unit slot ID for production ads to render.
   - If it is missing, the app intentionally does not render the header ad slot in production.

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) and create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Secret to `.env` as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

5. **Run database migrations**

   ```bash
   npx prisma migrate dev
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Billing Testing Guide (Stripe Sandbox)

Use this guide for local and staging validation of premium subscriptions.

### Stripe Prerequisites

- Stripe account in test mode
- App environment variables configured:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PREMIUM_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`
- Webhook endpoint created for:
  - `POST /api/billing/webhook`
- Subscribed webhook events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### Test Card Details

Never use real card data in sandbox.

#### Successful payment

- Card number: `4242 4242 4242 4242`
- Expiry: any future date (example `12/34`)
- CVC: any 3 digits (example `123`)
- Name/address/postcode: any valid-looking values

#### Failure scenarios

- Generic decline: `4000 0000 0000 0002`
- 3D Secure required: `4000 0025 0000 3155`
- Insufficient funds: `4000 0000 0000 9995`

## Project Structure

```text
├── app/
│   ├── api/
│   │   ├── auth/                 # NextAuth route handlers & email verification
│   │   ├── admin/                # Admin API (users & foods management)
│   │   ├── dashboard/            # Dashboard data aggregation endpoint
│   │   ├── foods/                # Food CRUD endpoints
│   │   ├── meals/                # Meal entry CRUD endpoints
│   │   │   └── [id]/             # Individual meal entry operations
│   │   └── settings/             # User settings endpoints
│   ├── admin/
│   │   ├── page.tsx              # Admin page (server component)
│   │   ├── AdminClient.tsx       # Admin tabs (Users / Foods)
│   │   ├── UserManagement.tsx    # User CRUD interface
│   │   └── FoodDatabase.tsx      # Global food database management
│   ├── components/
│   │   ├── CreateFoodSidebar.tsx  # Create/edit food sliding panel
│   │   ├── DailySummaryAccordion.tsx # Nutrition totals vs goals
│   │   ├── DeleteFoodModal.tsx    # Confirmation modal for food removal
│   │   ├── EditFoodSidebar.tsx    # Edit serving size sliding panel
│   │   ├── FoodListSidebar.tsx    # Food selection sliding panel
│   │   ├── FoodTable.tsx          # Reusable food CRUD table
│   │   ├── MyFoodsSidebar.tsx     # User's custom foods panel
│   │   ├── Navigation.tsx         # Bottom navigation bar
│   │   └── PWAInstallPrompt.tsx   # Optional PWA install banner
│   ├── diary/
│   │   ├── page.tsx              # Diary server component (data loading)
│   │   ├── DiaryClient.tsx       # Diary client component (UI logic)
│   │   └── types.ts              # Shared type definitions (FoodItem, Meal)
│   ├── foods/
│   │   ├── page.tsx              # My Foods page (server component)
│   │   └── UserFoodsClient.tsx   # My Foods client component
│   ├── login/
│   │   ├── page.tsx              # Login page (Google + credentials)
│   │   └── page.test.tsx         # Login page unit tests
│   ├── settings/
│   │   ├── page.tsx              # Settings server component
│   │   └── SettingsClient.tsx    # Goals, units, and actions
│   ├── DashboardClient.tsx       # Dashboard with time range selector
│   ├── layout.tsx                # Root layout with providers & PWA setup
│   ├── page.tsx                  # Home/Dashboard server component
│   └── providers.tsx             # Session provider wrapper
├── e2e/                          # Playwright end-to-end tests
├── lib/
│   ├── prisma.ts                 # Prisma client with pg adapter
│   └── unitConversions.ts        # Unit conversion & formatting utilities
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker for offline support
│   ├── icon-192.png              # PWA app icon (192x192)
│   └── icon-512.png              # PWA app icon (512x512)
├── types/
│   └── next-auth.d.ts            # Extended NextAuth types
├── auth.ts                       # NextAuth v5 configuration
├── proxy.ts                      # Route protection proxy (auth guard)
├── capacitor.config.ts           # Capacitor native app configuration
├── prisma.config.ts              # Prisma configuration
├── jest.config.ts                # Jest configuration
├── jest.setup.ts                 # Jest setup (testing-library/jest-dom)
├── playwright.config.ts          # Playwright configuration
```

## Database Schema

- **User** - User accounts with OAuth data, nutritional goals, measurement preferences, and admin role
- **Account** - OAuth provider connections
- **Session** - Database sessions
- **Food** - Food catalog with nutrition info (calories, protein, carbs, fat) and creator tracking
- **MealEntry** - User-specific meal entries with serving sizes, meal type (Breakfast/Lunch/Dinner/Snack), and computed nutrition

## API Routes

### Authentication

- `POST /api/auth/check-verified` - Check if email is verified (for login error handling)
- `GET|POST /api/auth/[...nextauth]` - NextAuth route handlers

### Dashboard

- `GET /api/dashboard?date=YYYY-MM-DD&range=day|week|month` - Get aggregated nutrition totals

### Foods

- `GET /api/foods` - List all available foods
- `POST /api/foods` - Create new food item
- `PUT /api/foods` - Update existing food item
- `DELETE /api/foods` - Delete food item

### Meals

- `GET /api/meals?date=YYYY-MM-DD` - Get diary entries for specific date
- `POST /api/meals` - Add food to meal
- `PATCH /api/meals/[id]` - Update serving size
- `DELETE /api/meals/[id]` - Remove meal entry

### Settings

- `GET /api/settings` - Get user settings (goals & units)
- `PUT /api/settings` - Update user settings

### Admin

- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/[id]` - Delete user
- `PATCH /api/admin/users/[id]` - Update user (e.g., admin role)
- `GET /api/admin/foods` - List all foods with creator info
- `DELETE /api/admin/foods/[id]` - Delete any food

## Scripts

```bash
npm run dev              # Start development server (Turbopack)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test             # Run Jest unit tests (watch mode)
npm run test:ci          # Run Jest unit tests (CI mode)
npm run test:e2e         # Run Playwright end-to-end tests
npm run test:e2e:ui      # Run Playwright tests with UI
npm run test:e2e:debug   # Run Playwright tests in debug mode
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Run database migrations

# Mobile App (Capacitor)
npm run cap:add:android       # Add Android platform
npm run cap:add:ios           # Add iOS platform (macOS only)
npm run cap:sync              # Sync (no server URL — uses bundled files)
npm run cap:sync:dev:android  # Sync for Android emulator (local dev)
npm run cap:sync:prod:android # Sync for Android pointing at .env.production URL
npm run cap:sync:prod:ios     # Sync for iOS pointing at .env.production URL (macOS only)
npm run cap:open:android      # Open Android Studio
npm run cap:open:ios          # Open Xcode
npm run cap:run:android       # Build and run on Android device/emulator
npm run cap:run:ios           # Build and run on iOS device/simulator

# Mobile App (React Native / Expo pilot)
npm run mobile:install         # Install mobile workspace dependencies
npm run mobile:start           # Start Expo development server
npm run mobile:android         # Build/run Android app from Expo workspace
npm run mobile:ios             # Build/run iOS app from Expo workspace
```

## Mobile App & PWA

### Progressive Web App (PWA)

The app is a fully functional PWA that can be installed directly from the browser:

**Installation:**

- **Android (Chrome):** Menu (⋮) → "Install app" or "Add to Home screen"
- **iOS (Safari):** Share button → "Add to Home Screen"
- **Desktop (Chrome/Edge):** Install icon in address bar

**Features:**

- ✅ Offline support with service worker caching
- ✅ Full-screen standalone mode (no browser UI)
- ✅ App icon on home screen
- ✅ Fast loading with caching strategies
- ✅ Works on localhost and HTTPS

**Testing PWA:**

```bash
npm run build
npm start
# Open http://localhost:3000 and install from browser
```

### Native Mobile Apps (iOS/Android)

Use Capacitor to build native apps for app store distribution:

```bash
npm run cap:add:android     # Add Android platform
npm run cap:add:ios         # Add iOS (macOS only)
npm run cap:sync            # Build and sync
npm run cap:open:android    # Open in Android Studio
npm run cap:open:ios        # Open in Xcode (macOS only)
```

### React Native Mobile App (Expo Pilot)

This repository now includes an initial React Native app at `mobile/` to begin
native-first migration while reusing the existing backend APIs.

**Current pilot scope:**

- Credentials sign-in against existing NextAuth endpoints (`/api/auth/*`)
- Minimal signed-in home screen shell for iterative feature porting

**Run locally:**

```bash
npm run mobile:install
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000 npm run mobile:start
```

Use your machine LAN IP instead of `10.0.2.2` when running on a physical
device (for example `http://192.168.0.83:3000`).

**Build Options:**

1. **Static Export** — Set `output: "export"` in `next.config.ts` for 100% offline (no API routes)
2. **Connected App** — Deploy to Vercel/AWS, point Capacitor to hosted URL (requires internet)

**Pointing Capacitor at a server:**

`capacitor.config.ts` reads `CAP_SERVER_URL` at sync time. The recommended approach is to set it in your `.env.production` file and use the dedicated sync scripts, which load it automatically via `dotenv`:

```bash
# Production (reads CAP_SERVER_URL from .env.production)
npm run cap:sync:prod:android
npm run cap:sync:prod:ios        # macOS only

# Local dev — Android emulator (uses hardcoded 10.0.2.2 loopback)
npm run cap:sync:dev:android

# Local dev — physical device (set your machine's LAN IP)
# Find with: ipconfig (Windows) or ifconfig (Mac/Linux)
CAP_SERVER_URL=http://192.168.1.100:3000 npx cap sync

# Revert to bundled static files
npm run cap:sync   # (no CAP_SERVER_URL set)
```

> **Note:** `CAP_SERVER_URL` in `.env.production` is **not** loaded automatically by `cap sync` — only by Next.js during `npm run build`. The `cap:sync:prod:*` scripts explicitly load `.env.production` before running sync.

**Deploying to Android (Google Play):**

1. Build and sync: `npm run build ; npm run cap:sync:prod:android`
2. Open Android Studio: `npm run cap:open:android`
3. Update `versionCode` and `versionName` in `android/app/build.gradle`
4. **Build > Generate Signed Bundle / APK** → choose **Android App Bundle (.aab)**
5. Create or select a keystore when prompted — keep the keystore file safe
6. Upload the `.aab` to [Google Play Console](https://play.google.com/console) under your app's release track

**Testing on a physical Android device (debug APK):**

The quickest way to test on a real phone without going through the Play Store:

1. Build and sync:

   ```bash
   npm run build
   npm run cap:sync:prod:android   # or cap:sync:dev:android for local dev
   ```

2. Open Android Studio: `npm run cap:open:android`
3. Enable **USB debugging** on your phone: Settings → About Phone → tap Build Number 7 times → Developer Options → USB Debugging
4. Connect your phone via USB and accept the prompt on the device
5. Select your device from the target dropdown in Android Studio and click **Run ▶**

   Android Studio will build a debug APK, install it, and launch the app automatically.

   **Or generate a standalone APK to sideload:**
   - **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - Find the APK at `android/app/build/outputs/apk/debug/app-debug.apk`
   - Transfer to your phone (USB, email, cloud) and open it to install (requires allowing installs from unknown sources)

**Inspecting the app WebView from desktop Chrome (Android):**

Use this when debugging login/network issues on a real device.

1. On your phone, enable **Developer options** and **USB debugging**
2. Connect the phone by USB and accept the trust/debug prompt
3. Build/run a **debug** variant from Android Studio (not a release APK)
4. On desktop Chrome, open `chrome://inspect/#devices`
5. Enable **Discover USB devices**
6. Under your device, find `com.calorietracker.app` and click **Inspect**
7. Use **Console** and **Network** tabs to inspect requests like `/api/auth/callback/credentials`

If the app does not appear in inspect:

- Replug USB and re-accept the device trust prompt
- Ensure USB debugging is still enabled
- Re-run the app from Android Studio using the Run button
- Refresh `chrome://inspect/#devices`

**Deploying to iOS (Apple App Store — macOS only):**

1. Build and sync: `npm run build ; npm run cap:sync:prod:ios`
2. Open Xcode: `npm run cap:open:ios`
3. Select your Team under **Signing & Capabilities** and set a unique Bundle Identifier
4. Bump the **Version** and **Build** numbers in the project target
5. Select **Any iOS Device (arm64)** as the build target
6. **Product > Archive**, then in the Organizer click **Distribute App > App Store Connect**
7. Submit for review via [App Store Connect](https://appstoreconnect.apple.com)

**App Store Publishing:** Google Play ($25 one-time) or Apple App Store ($99/year)

See `MOBILE_APP_SETUP.md` for full setup instructions.

## Deployment

### Docker Compose (Recommended)

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+

1. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Set at minimum:

   | Variable                                | Purpose                                                   |
   | --------------------------------------- | --------------------------------------------------------- |
   | `POSTGRES_PASSWORD`                     | Password for the PostgreSQL container                     |
   | `AUTH_SECRET`                           | Random secret — `openssl rand -base64 32`                 |
   | `AUTH_URL`                              | Public URL (e.g. `https://calorietracker.yourdomain.com`) |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials                                  |
   | `SMTP_*`                                | SMTP server for email verification & password reset       |
   | `REDIS_URL`                             | Optional Redis endpoint for distributed rate limiting     |

2. **Build and start**

   ```bash
   docker compose up -d --build
   ```

   This builds the app (node:22-alpine), starts PostgreSQL 17, runs migrations, and starts the server on port 3000.

3. **Verify**

   ```bash
   docker compose ps        # Both services should be "running"
   docker compose logs app  # Check for migrations completion
   ```

**Useful commands:**

```bash
docker compose down        # Stop services
docker compose down -v     # Stop and delete data
docker compose logs -f app # Tail logs
```

### Without Docker

Ensure PostgreSQL is running and all required env vars are set, then:

```bash
npm run build
npm start
```

Or for a managed host (Vercel, Railway, etc.), connect your repository and set the env vars in the platform dashboard. Run `npx prisma migrate deploy` as a build/release step.

### Cloudflare Tunnel

Expose the app via [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (no port forwarding needed).

**Prerequisites:** Cloudflare-managed domain, `cloudflared` installed

**Setup:**

```bash
cloudflared tunnel login
cloudflared tunnel create calorietracker
cloudflared tunnel route dns calorietracker calorietracker.yourdomain.com
```

Update `.env`:

```env
AUTH_URL="https://calorietracker.yourdomain.com"
```

Update [Google OAuth credentials](https://console.cloud.google.com/apis/credentials):

- Authorized JavaScript origin: `https://calorietracker.yourdomain.com`
- Redirect URI: `https://calorietracker.yourdomain.com/api/auth/callback/google`

**Running:**

```bash
# Terminal 1: Docker
docker compose up -d --build

# Terminal 2: Tunnel
cloudflared tunnel run --url http://localhost:3000 calorietracker
```

Site is live at `https://calorietracker.yourdomain.com`.

### LAN Access (Without Tunnel)

```bash
npx next dev --hostname 0.0.0.0
```

Visit `http://<your-local-ip>:3000` from other devices.

> **Note:** Google OAuth requires HTTPS. Use Cloudflare Tunnel for full functionality.

## Architecture

- **Validation:** API input is validated at route boundaries using shared Zod schemas in `lib/apiSchemas.ts`. All new routes should use these schemas rather than ad-hoc parsing.
- **Service layer:** Business logic lives in `lib/` service modules (`mealService`, `foodModerationService`, `accountService`, `adminUserService`). Route handlers are kept thin — focused on auth, validation, and response mapping only.
- **Audit logging:** All mutations are logged via `logAdminAction()` from `lib/auditService.ts`. See [Audit Logging](#audit-logging) for the full pattern.
- **Caching:** Environment-aware TTL strategy configured in `lib/cacheKeys.ts`. See [Caching and Data-Fetch Strategy](#caching-and-data-fetch-strategy) for details.

## Security

### Authentication & Authorization

- **Password hashing** — bcrypt with salting
- **JWT session strategy** — short-lived tokens; admin role re-verified from the database on every JWT refresh
- **Google OAuth** — PKCE flow via NextAuth v5
- **Email verification** — required before login; hashed tokens stored in database
- **Password reset** — time-limited tokens, hashed, atomic token consumption
- **Account lockout** — Failed logins trigger account blocks (per email)
- **No user enumeration** — Login, password reset, and registration endpoints return generic responses regardless of account existence
- **Rate limiting** — Per-user request throttling on auth and mutation flows
- **Input validation** — All inputs validated via shared Zod schemas with clear error responses
- **HTTP security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` enforced via proxy

### Additional Measures

- **CSRF protection** — Origin/referer checking via `proxy.ts`
- **Ownership checks** — Meal and food mutations verify user ownership
- **Last-admin protection** — Cannot delete last admin
- **Admin re-verification** — `isAdmin` fetched from DB on every JWT callback
- **Query safety cap** — Dashboard queries limited to 10,000 rows
- **Production logging** — Structured `logError()` omits stack traces in prod
- **Non-root container** — Runs as `nextjs` (uid 1001)

## Audit Logging

All sensitive operations (admin actions, data modifications, authentication events) are logged to the `auditLog` table for compliance, debugging, and security monitoring:

**What gets logged:**

- Admin actions on users (marks added/removed, activation, deactivation, profile updates, deletion)
- Food moderation actions (approve/unapprove, creator punishments, report resolutions)
- User account changes (registration, email verification, password resets, account deletion)
- Data mutations (meals, foods, favorites, body weight, settings)

**Log entry structure** (stored in DB and streamed as JSON to stdout):

- `actorId`: User performing the action
- `actorRole`: `admin` or `user`
- `targetType`: `user` or `food`
- `targetId`: ID of the affected resource
- `action`: Enum (e.g., `USER_MARK_ADDED`, `FOOD_APPROVED`)
- `reason`: Optional explanation (e.g., for admin actions)
- `metadata`: Contextual data (e.g., which fields changed, punishment counts)
- `requestId`: Vercel request correlation ID for tracing across logs
- `occurredAt`: ISO timestamp

**Usage in routes:**
Use `logAdminAction()` from `lib/auditService.ts` after state-changing operations:

```typescript
await logAdminAction(prisma, {
  actorId: user.id,
  targetType: "user",
  targetId: userId,
  action: "USER_MARK_ADDED",
  reason: body.reason,
  requestId: getRequestId(request),
  metadata: { blackMarks: updatedUser.blackMarks },
});
```

**Log retention and cleanup:**

- Logs are retained indefinitely by default for compliance.
- For production, implement periodic cleanup (e.g., archive/delete logs > 90 days old) using a scheduled task (AWS Lambda, Cloud Tasks, etc.) with admin-authenticated endpoints.
- Preserve logs for ongoing investigations; only archive after compliance windows expire.
- Example cleanup endpoint:

  ```typescript
  // app/api/admin/audit/cleanup.ts
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await prisma.auditLog.deleteMany({
    where: { occurredAt: { lt: ninetyDaysAgo } },
  });
  ```

## Caching and Data-Fetch Strategy

**Development (Lax):** In dev, caching defaults to `revalidate: 0` to reduce stale-data confusion.

**Sensitive Routes (No Cache):** Auth, account ops, admin mutations use `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`.

**Read-Heavy Routes (Controlled TTL):** User data (1–5 min), global reads (10–30 min) use `Cache-Control: private, max-age=<seconds>` in production.

**Server Components:** Use `unstable_cache()` with revalidation tags to prevent redundant fetches across pages:

```typescript
const data = await unstable_cache(
  async () => fetch("/api/resource"),
  ["resource:userId"],
  { revalidate: 300, tags: ["resource:userId"] },
)();
```

**Tag Format:** `{resource}:{userId}` for user-scoped, `{resource}` for global data (defined in `lib/cacheKeys.ts`).

## License & Copyright

Copyright © 2026 Michael Smith. All Rights Reserved.

This is proprietary and confidential software. Unauthorized copying, distribution, modification, or use of this software is strictly prohibited. See the [LICENSE](LICENSE) file for details.
