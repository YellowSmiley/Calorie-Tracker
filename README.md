# Calorie Tracker

A full-stack Next.js application for tracking daily food intake and macronutrients (calories, protein, carbs, and fat).

## Features

- 📊 **Daily Food Diary** - Track meals across Breakfast, Lunch, Dinner, and Snacks
- 🔢 **Macro Tracking** - Monitor calories, protein, carbohydrates, and fats
- 📈 **Daily Summary** - View total nutrition with collapsible accordion interface
- 🔐 **Google Authentication** - Secure sign-in with NextAuth v5
- 💾 **PostgreSQL Database** - Persistent storage with Prisma ORM
- ⚡ **Server Components** - Fast initial page loads with Next.js App Router
- 🎨 **Modern UI** - Tailwind CSS with dark mode support

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL
- **ORM:** Prisma 7.3.0 with pg adapter
- **Authentication:** NextAuth v5 (beta) with Google OAuth
- **Styling:** Tailwind CSS 4
- **Runtime:** React 19

## Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted)
- Google OAuth credentials

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

   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/calorie_tracker"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   AUTH_SECRET="your-generated-secret"
   AUTH_URL="http://localhost:3000"
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
│   │   ├── auth/[...nextauth]/   # NextAuth route handlers
│   │   ├── foods/                # Food CRUD endpoints
│   │   └── meals/                # Meal entry CRUD endpoints
│   ├── components/
│   │   ├── CreateFoodSidebar.tsx
│   │   ├── DailySummaryAccordion.tsx
│   │   └── UpdateServingSizeSidebar.tsx
│   ├── diary/
│   │   ├── page.tsx              # Server component (data loading)
│   │   ├── DiaryClient.tsx       # Client component (UI logic)
│   │   └── types.ts              # Shared type definitions
│   └── layout.tsx
├── lib/
│   ├── prisma.ts                 # Prisma client with pg adapter
│   └── defaultFoods.ts           # Seed data
├── prisma/
│   └── schema.prisma             # Database schema
├── auth.ts                       # NextAuth v5 configuration
└── types/
    └── next-auth.d.ts            # Extended NextAuth types
```

## Database Schema

- **User** - User accounts with OAuth data
- **Account** - OAuth provider connections
- **Session** - Database sessions
- **Food** - Global food catalog with nutrition info
- **MealEntry** - User-specific meal entries with serving sizes

## API Routes

### Foods

- `GET /api/foods` - List all available foods
- `POST /api/foods` - Create new food item

### Meals

- `GET /api/meals?date=YYYY-MM-DD` - Get diary for specific date
- `POST /api/meals` - Add food to meal
- `PATCH /api/meals/[id]` - Update serving size
- `DELETE /api/meals/[id]` - Remove meal entry

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
```

## License & Copyright

Copyright © 2026 Michael Smith. All Rights Reserved.

This is proprietary and confidential software. Unauthorized copying, distribution, modification, or use of this software is strictly prohibited. See the [LICENSE](LICENSE) file for details.
