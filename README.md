# Calorie Tracker

A full-stack Next.js application for tracking daily food intake and macronutrients (calories, protein, carbs, and fat).

## Features

- 📊 **Daily Food Diary** - Track meals across Breakfast, Lunch, Dinner, and Snacks
- 🔢 **Macro Tracking** - Monitor calories, protein, carbohydrates, and fats
- 📈 **Dashboard** - View daily, weekly, and monthly nutrition summaries with progress bars
- 📅 **Daily Summary** - Collapsible accordion showing nutrition totals vs goals
- ⚙️ **Customizable Settings** - Set personal nutrition goals and preferred measurement units
- 🔄 **Unit Conversions** - Support for kcal/cal/Cal, g/mg/oz, g/kg/lbs, ml/cup/tbsp/tsp/L
- 🍔 **Food Management** - Create, edit, and delete custom foods with full CRUD support
- 🔐 **Authentication** - Google OAuth and email/password credentials with email verification
- 🛡️ **Admin Panel** - User management and global food database administration
- 💾 **PostgreSQL Database** - Persistent storage with Prisma ORM
- ⚡ **Server Components** - Fast initial page loads with Next.js App Router
- 🎨 **Modern UI** - Tailwind CSS with dark mode support
- 🧪 **Testing** - Unit tests with Jest and end-to-end tests with Playwright

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL with pg adapter
- **ORM:** Prisma 7.3.0
- **Authentication:** NextAuth v5 (beta) with Google OAuth & Credentials
- **Styling:** Tailwind CSS 4
- **Runtime:** React 19
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
   ```

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

6. **Seed the database** (optional — adds default foods)

   ```bash
   npm run seed
   ```

7. **Start the development server**

   ```bash
   npm run dev
   ```

8. **Open the app**

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
│   │   └── Navigation.tsx         # Bottom navigation bar
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
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home/Dashboard server component
│   └── providers.tsx             # Session provider wrapper
├── e2e/                          # Playwright end-to-end tests
├── lib/
│   ├── prisma.ts                 # Prisma client with pg adapter
│   └── unitConversions.ts        # Unit conversion & formatting utilities
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Seed data (default foods)
├── types/
│   └── next-auth.d.ts            # Extended NextAuth types
├── auth.ts                       # NextAuth v5 configuration
├── middleware.ts                  # Route protection middleware
├── prisma.config.ts              # Prisma configuration
├── jest.config.ts                # Jest configuration
├── jest.setup.ts                 # Jest setup (testing-library/jest-dom)
└── playwright.config.ts          # Playwright configuration
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
npm run seed             # Seed database with default foods
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Run database migrations
```

## License & Copyright

Copyright © 2026 Michael Smith. All Rights Reserved.

This is proprietary and confidential software. Unauthorized copying, distribution, modification, or use of this software is strictly prohibited. See the [LICENSE](LICENSE) file for details.
