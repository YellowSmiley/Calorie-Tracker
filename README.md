# Calorie Tracker

A full-stack Next.js application for tracking daily food intake and macronutrients (calories, protein, carbs, and fat).

## Open Food Facts Integration

This project uses [Open Food Facts](https://world.openfoodfacts.org/) — an open, collaborative food products database made by everyone, for everyone:

> "Open Food Facts is a food products database made by everyone, for everyone. You can use it to make better food choices, and as it is open data, anyone can re-use it for any purpose."

**How it's used:**

- **Barcode Scanning:** When you scan a barcode in the app, it queries Open Food Facts to fetch nutrition data for food products. If a match is found, the food's details are auto-filled, making it easier to log foods quickly.
- **Fallback for Missing Foods:** If a barcode is not found in the local database, the app attempts to retrieve it from Open Food Facts before prompting for manual entry.

See [Open Food Facts Terms of Use](https://world.openfoodfacts.org/terms-of-use) for more information.

## Features

- 📊 **Daily Food Diary** - Track meals across Breakfast, Lunch, Dinner, and Snacks
- 🔢 **Macro Tracking** - Monitor calories, protein, carbohydrates, and fats
- 📈 **Dashboard** - View daily, weekly, and monthly nutrition summaries with progress bars
- 📅 **Daily Summary** - Collapsible accordion showing nutrition totals vs goals
- ⚙️ **Customizable Settings** - Set personal nutrition goals and preferred measurement units
- 🔄 **Unit Conversions** - Support for kcal/cal/Cal, g/mg/oz, g/kg/lbs, ml/cup/tbsp/tsp/L
- 🍔 **Food Management** - Create, edit, and delete custom foods with full CRUD support
- � **Progressive Web App** - Install on any device, works offline, full-screen experience
- 📲 **Mobile Ready** - Installable from browser, native app builds via Capacitor
- �🔐 **Authentication** - Google OAuth and email/password credentials with email verification
- 🛡️ **Admin Panel** - User management and global food database administration
- 💾 **PostgreSQL Database** - Persistent storage with Prisma ORM
- ⚡ **Server Components** - Fast initial page loads with Next.js App Router
- 🎨 **Modern UI** - Tailwind CSS with dark mode support
- 🧪 **Testing** - Unit tests with Jest and end-to-end tests with Playwright

## Recent Security and Architecture Improvements

The project has recently been hardened and refactored to improve security posture and maintainability.

### Security hardening

- Added API abuse protections with per-user rate limiting on sensitive authentication and data-modification flows.
- Added stricter JSON payload handling for mutation routes to return clean `400` responses on malformed bodies instead of bubbling parsing exceptions.
- Added global baseline response headers through the proxy layer: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` with restricted camera/microphone/geolocation.
- Added no-cache controls for sensitive account data export responses.

### Architecture improvements

- Introduced a shared schema validation layer in `lib/apiSchemas.ts` using Zod.
- Refactored high-churn routes to consume centralized schemas for params, query, and body validation, reducing duplicated manual guards and improving type inference.
- Added service-layer domain modules (for example `lib/mealService.ts`, `lib/foodModerationService.ts`, `lib/accountService.ts`) to centralize business logic and keep API route handlers thinner and more consistent.
- Added focused schema unit tests in `lib/apiSchemas.test.ts` to validate contracts for meals, body weight, reporting, settings, and meal favorites.

### Why this matters

- Less duplicated route validation logic and more consistent error behavior.
- Stronger default defenses against malformed requests and write-flood abuse.
- Faster iteration on API changes thanks to reusable schemas and contract tests.

See also: the codebase instructions in `.github/copilot-instructions.md` for testing and implementation expectations.

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

- Audit logs are retained indefinitely by default for compliance and forensic purposes.
- For production deployments with high activity, implement a periodic cleanup job to archive or delete logs older than your retention window (e.g., 90 days, 1 year).
- Cleanup should preserve logs for ongoing investigations (e.g., punishment histories, ban patterns) and only remove logs after the organization's compliance requirements are met.
- Consider storing archived logs in cold storage (e.g., S3, GCS) rather than deleting them entirely.
- Create a scheduled task or cron job (using a service like AWS Lambda, Cloud Tasks, or a dedicated cleanup service) that runs `deleteOldAuditLogs()` from a dedicated cleanup route with admin authentication.
- Example cleanup endpoint:

  ```typescript
  // app/api/admin/audit/cleanup.ts
  // Delete logs older than 90 days, runs via scheduled task
  const thirtyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await prisma.auditLog.deleteMany({
    where: { occurredAt: { lt: thirtyDaysAgo } },
  });
  ```

## Caching and Data-Fetch Strategy

The app uses a three-tier caching strategy to balance performance, freshness, and security:

**Development Behavior (Lax Caching):**

- In development (`NODE_ENV !== "production"`), caching defaults are intentionally relaxed to reduce stale data confusion during debugging.
- Server-component cache TTLs are set to `0` in dev through `lib/cacheKeys.ts`, and API responses can use no-store headers where needed.
- Production keeps the stricter TTL and cache-control policy.

**Sensitive Routes (No Cache):**

- Authentication, account operations (export, deletion), admin mutations, and rate-limited routes use `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` to prevent cache bypass attacks and ensure real-time authorization checks.
- Example: [app/api/account/export/route.ts](app/api/account/export/route.ts#L147)

**Read-Heavy Routes (Controlled Caching):**

- User-scoped data (settings, meals, weight entries, favorites) cached 1–30 minutes depending on update frequency.
- Global read-only data (food search, admin lists) cached 10–30 minutes.
- Uses `Cache-Control: private, max-age=<seconds>` in production with environment-aware TTLs.

**Server Component Optimization:**

- Use `unstable_cache()` with revalidation tags to prevent redundant API calls across multiple pages accessing the same user-specific data.
- Wrap user fetches with `{ revalidate: 300, tags: ['resource:userId'] }` to cache responses while ensuring mutations bust the cache.

**Cache Invalidation Pattern:**

- Define cache tags in `lib/cacheKeys.ts` following `{resource}:{userId}` format for user-scoped data and `{resource}` for global data.
- After state-changing operations, return fresh data and rely on environment-aware TTL revalidation; use explicit tag revalidation only where the route context supports it.
- This ensures consistency without requiring full page revalidation.

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
   ```

   `REDIS_URL` is optional in local development. If set, rate limiting uses shared Redis storage for multi-instance deployments. If omitted, the app falls back to in-memory limiting.

   Generate `AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to `.env`

5. **Run database migrations**

   ```bash
   npx prisma migrate dev --name init
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
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
├── MOBILE_APP_SETUP.md           # Complete mobile/PWA setup guide
├── QUICK_START_MOBILE.md         # Quick mobile testing guide
└── IMPLEMENTATION_SUMMARY.md     # Mobile implementation details
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
npm run cap:add:android  # Add Android platform
npm run cap:add:ios      # Add iOS platform (macOS only)
npm run cap:sync         # Sync web build to native projects
npm run cap:open:android # Open Android Studio
npm run cap:open:ios     # Open Xcode
npm run cap:run:android  # Build and run on Android device/emulator
npm run cap:run:ios      # Build and run on iOS device/simulator
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

For app store distribution, use Capacitor to build native apps:

**Quick Setup:**

```bash
# Install Capacitor dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# Add platforms
npm run cap:add:android
npm run cap:add:ios

# Build and sync
npm run cap:sync

# Open in native IDEs
npm run cap:open:android  # Android Studio
npm run cap:open:ios      # Xcode (macOS only)
```

**Build Options:**

1. **Static Export** (simpler, no SSR):
   - Change `next.config.ts`: `output: "export"`
   - App works 100% offline
   - No server-side features (API routes disabled)

2. **Connected App** (keeps SSR):
   - Deploy app to production (Vercel, AWS, etc.)
   - Point Capacitor to your hosted URL
   - Requires internet connection

**Publishing:**

- **Google Play Store:** $25 one-time fee
- **Apple App Store:** $99/year

**Detailed Documentation:**

- **Setup Guide:** See `MOBILE_APP_SETUP.md` for complete instructions
- **Quick Start:** See `QUICK_START_MOBILE.md` for testing
- **Summary:** See `IMPLEMENTATION_SUMMARY.md` for what was implemented

## Deployment

### Docker Compose (recommended)

The app ships with a multi-stage Dockerfile and a Compose file that runs the app alongside PostgreSQL.

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+

#### 1. Configure environment

Copy and edit the example env file:

```bash
cp .env.example .env
```

Set **at minimum**:

| Variable                                | Purpose                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| `POSTGRES_PASSWORD`                     | Password for the PostgreSQL container                     |
| `AUTH_SECRET`                           | Random secret — `openssl rand -base64 32`                 |
| `AUTH_URL`                              | Public URL (e.g. `https://calorietracker.yourdomain.com`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials                                  |
| `SMTP_*`                                | SMTP server for email verification & password reset       |
| `REDIS_URL`                             | Optional Redis endpoint for distributed rate limiting     |

#### 2. Build and start

```bash
docker compose up -d --build
```

This will:

1. Build the Next.js app in a multi-stage Docker image (node:22-alpine)
2. Start PostgreSQL 17 with a persistent `pgdata` volume
3. Wait for the database health check to pass
4. Run `prisma migrate deploy` automatically on startup
5. Start the production server on port **3000**

#### 3. Verify

```bash
docker compose ps      # Both services should be "running"
docker compose logs app # Check for "Migrations complete." + "Ready"
```

#### Useful commands

```bash
docker compose down              # Stop services (data preserved)
docker compose down -v           # Stop and delete database volume
docker compose up -d --build     # Rebuild after code changes
docker compose logs -f app       # Tail app logs
docker compose exec app sh       # Shell into the app container
```

### Cloudflare Tunnel

The app can be exposed to the internet via [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — no port forwarding or static IP required.

#### Prerequisites

- A domain managed by Cloudflare (e.g. `masmith.uk`)
- `cloudflared` installed: `winget install Cloudflare.cloudflared`

#### One-time setup

```bash
# Authenticate with Cloudflare (opens browser)
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create calorietracker

# Route your subdomain to the tunnel
cloudflared tunnel route dns calorietracker calorietracker.yourdomain.com
```

Update `.env`:

```env
AUTH_URL="https://calorietracker.yourdomain.com"
```

Update Google OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- **Authorized JavaScript origins:** `https://calorietracker.yourdomain.com`
- **Authorized redirect URIs:** `https://calorietracker.yourdomain.com/api/auth/callback/google`

#### Running with Docker + Tunnel

```bash
# Terminal 1: Start the Docker stack
docker compose up -d --build

# Terminal 2: Start the Cloudflare tunnel
cloudflared tunnel run --url http://localhost:3000 calorietracker
```

The site will be live at `https://calorietracker.yourdomain.com`.

#### Running without Docker

```bash
# Terminal 1: Build and start the production server
npm run build
npm start

# Terminal 2: Start the Cloudflare tunnel
cloudflared tunnel run --url http://localhost:3000 calorietracker
```

### LAN access (without Cloudflare)

To access from other devices on your local network without a tunnel:

```bash
npx next dev --hostname 0.0.0.0
```

Then visit `http://<your-local-ip>:3000` from other devices. You may need to allow port 3000 through Windows Firewall:

```powershell
New-NetFirewallRule -DisplayName "Next.js Dev" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
```

> **Note:** Google OAuth won't work over plain HTTP from non-localhost origins. Use Cloudflare Tunnel for full functionality.

## Security

### Authentication & Authorization

- **Password hashing** — bcrypt for salting
- **JWT session strategy** — short-lived tokens; admin role re-verified from the database on every JWT refresh
- **Google OAuth** — PKCE flow via NextAuth v5
- **Email verification** — required before login; hashed tokens stored in database
- **Password reset** — time-limited tokens, hashed, atomic token consumption
- **Account lockout** — failed logins, block (per email)
- **No user enumeration** — login, forgot-password, and registration endpoints all return generic responses regardless of whether the account exists
- **Rate limiting** — Request throttling is applied to sensitive auth and mutation flows to reduce abuse risk and protect service stability.
- **Input Validation** - throwing errors on bad data
- **HTTP Security Headers** - ensuring security headers are set

### Additional Measures

- **CSRF protection** — origin/referer checking on state-changing requests in `proxy.ts`
- **Ownership checks** — all meal and food mutations verify the requesting user owns the resource
- **Last-admin protection** — cannot delete the last admin user
- **Admin re-verification** — `isAdmin` is fetched from the database on every JWT callback, not cached from a stale token
- **Query safety cap** — dashboard queries limited to 10 000 rows
- **Production logging** — `console.error` calls are guarded behind `NODE_ENV === "development"`; server-side uses structured `logError()` that omits stack traces in production
- **Docker runs as non-root** — the container executes as `nextjs` (uid 1001)

## License & Copyright

Copyright © 2026 Michael Smith. All Rights Reserved.

This is proprietary and confidential software. Unauthorized copying, distribution, modification, or use of this software is strictly prohibited. See the [LICENSE](LICENSE) file for details.
