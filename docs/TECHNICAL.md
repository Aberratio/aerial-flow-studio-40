# Technical Documentation

## Architecture Overview

IguanaFlow is a modern full-stack web application built with React and Supabase. The architecture follows a client-server model with a PostgreSQL database, real-time subscriptions, and serverless edge functions.

### High-Level Architecture

```
┌─────────────────┐
│   React Client  │  (Vite + TypeScript)
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│   Supabase API   │  (Backend as a Service)
│   - Auth         │
│   - Database     │
│   - Storage      │
│   - Functions    │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  (Database)
└─────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **PWA**: Vite PWA Plugin

## Database Schema

### Core Tables

#### `profiles`
User profile information linked to Supabase Auth.

```sql
- id (UUID, PK, references auth.users)
- email (TEXT)
- username (TEXT, UNIQUE)
- avatar_url (TEXT)
- bio (TEXT)
- role (user_role ENUM: 'free', 'premium', 'trainer', 'admin')
- created_at, updated_at (TIMESTAMPTZ)
```

#### `figures`
Aerial exercises/poses library.

```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- difficulty_level (TEXT: 'beginner', 'intermediate', 'advanced')
- image_url (TEXT)
- video_url (TEXT)
- instructions (TEXT)
- created_by (UUID, references profiles)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `posts`
Social feed posts.

```sql
- id (UUID, PK)
- user_id (UUID, references profiles)
- content (TEXT)
- image_url (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `challenges`
28-day challenge programs.

```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- start_date, end_date (TIMESTAMPTZ)
- created_by (UUID, references profiles)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `training_sessions`
User-created training sessions.

```sql
- id (UUID, PK)
- user_id (UUID, references profiles)
- title (TEXT)
- description (TEXT)
- duration_minutes (INTEGER)
- date_scheduled (TIMESTAMPTZ)
- completed (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `training_library`
Published training courses and exercises.

```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- thumbnail_url (TEXT)
- category (TEXT: 'warmup', 'exercise', 'cooldown', 'complex')
- sport_type (TEXT[])
- difficulty_level (TEXT)
- tags (TEXT[])
- training_type (TEXT: 'video', 'figure_set', 'complex')
- video_url (TEXT)
- duration_seconds (INTEGER)
- premium (BOOLEAN)
- is_published (BOOLEAN)
- created_by (UUID, references profiles)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `subscribers`
Stripe subscription management.

```sql
- id (UUID, PK)
- user_id (UUID, references auth.users)
- email (TEXT, UNIQUE)
- stripe_customer_id (TEXT)
- subscribed (BOOLEAN)
- subscription_tier (TEXT)
- subscription_end (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `orders`
Payment order tracking.

```sql
- id (UUID, PK)
- user_id (UUID, references auth.users)
- stripe_session_id (TEXT, UNIQUE)
- amount (INTEGER)
- currency (TEXT)
- status (TEXT)
- order_type (TEXT: 'subscription' or 'challenge')
- item_id (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### Relationships

- **profiles** ↔ **posts**: One-to-many
- **profiles** ↔ **challenges**: One-to-many (creator)
- **challenges** ↔ **challenge_participants**: Many-to-many
- **training_sessions** ↔ **training_session_figures**: One-to-many
- **training_library** ↔ **training_library_exercises**: One-to-many
- **profiles** ↔ **user_follows**: Self-referential many-to-many

## API Structure

### Supabase Client

The application uses the Supabase JavaScript client for all database operations:

```typescript
import { supabase } from "@/integrations/supabase/client";
```

### Common Patterns

#### Querying Data

```typescript
const { data, error } = await supabase
  .from('figures')
  .select('*')
  .eq('difficulty_level', 'beginner')
  .order('created_at', { ascending: false });
```

#### Real-time Subscriptions

```typescript
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts'
  }, (payload) => {
    // Handle new post
  })
  .subscribe();
```

#### File Uploads

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/${filename}`, file);
```

### Edge Functions

Located in `supabase/functions/`:

- **check-subscription**: Verify user subscription status
- **create-checkout**: Create Stripe checkout session
- **customer-portal**: Manage Stripe customer portal
- **handle-stripe-webhook**: Process Stripe webhooks
- **purchase-challenge**: Handle challenge purchases
- **redeem-challenge-code**: Redeem challenge redemption codes
- **fetch-instagram-embed**: Fetch Instagram embed data

## Authentication Flow

### Authentication Context

The app uses `AuthContext` (`src/contexts/AuthContext.tsx`) to manage authentication state:

1. **Initialization**: Checks for existing session on mount
2. **Sign In**: Email/password or OAuth providers
3. **Sign Up**: Creates user account and profile
4. **Sign Out**: Clears session and redirects
5. **Session Management**: Auto-refresh tokens, handle expiration

### Protected Routes

Routes are protected using the `ProtectedRoute` component:

```typescript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### User Roles

- **free**: Basic user, limited access
- **premium**: Paid subscription, full access
- **trainer**: Can create and publish content
- **admin**: Full administrative access

## Environment Variables

Required environment variables (typically in `.env` or Supabase dashboard):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (for Edge Functions)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
VITE_APP_URL=https://iguanaflow.com
```

**Note**: The Supabase client is currently configured with hardcoded values in `src/integrations/supabase/client.ts`. For production, these should be moved to environment variables.

## State Management

### React Query

TanStack Query handles all server state:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['figures', filters],
  queryFn: () => fetchFigures(filters)
});
```

### React Context

- **AuthContext**: User authentication state
- **DictionaryContext**: Internationalization (if implemented)

### Local State

- React hooks (`useState`, `useReducer`) for component-level state
- Form state managed by React Hook Form

## Routing

React Router v6 handles client-side routing:

- **Public Routes**: Landing, About, Privacy Policy, Terms
- **Protected Routes**: Feed, Library, Challenges, Profile, Training
- **Admin Routes**: Admin dashboard, user management, content management

Route definitions in `src/App.tsx`.

## PWA Configuration

Progressive Web App features configured in `vite.config.ts`:

- **Service Worker**: Automatic registration via Vite PWA plugin
- **Manifest**: App metadata, icons, theme colors
- **Offline Support**: Caching strategy for static assets
- **Install Prompt**: Custom install instructions for iOS/Android

## Deployment

### Build Process

```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build locally
```

### Build Output

- Static files in `dist/`
- Optimized and minified
- Code splitting for optimal loading

### Hosting

The application is deployed at [iguanaflow.com](https://iguanaflow.com). Typical deployment steps:

1. Build the application: `npm run build`
2. Deploy `dist/` folder to hosting provider
3. Configure environment variables
4. Set up custom domain
5. Configure Supabase project settings

### Database Migrations

Database migrations are in `supabase/migrations/`. Apply migrations via:

```bash
supabase db push
# or through Supabase dashboard
```

## Performance Optimizations

- **Code Splitting**: Automatic via Vite
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Lazy loading images with `LazyImage` component
- **Caching**: React Query caching, PWA service worker caching
- **Bundle Size**: Tree shaking, minification

## Security Considerations

- **Row Level Security (RLS)**: Enabled on all tables
- **Authentication**: Supabase Auth with JWT tokens
- **Input Validation**: Zod schemas for form validation
- **XSS Protection**: React's built-in XSS protection
- **CORS**: Configured in Supabase project settings
- **Rate Limiting**: Handled by Supabase

## Development Workflow

1. **Local Development**: `npm run dev` (runs on port 8080)
2. **Linting**: `npm run lint`
3. **Type Checking**: TypeScript compiler
4. **Hot Reload**: Automatic via Vite HMR

## Testing

Currently, testing is manual. Future improvements:
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright or Cypress

## Monitoring & Analytics

- Error tracking: Consider Sentry or similar
- Analytics: Consider Google Analytics or Plausible
- Performance: Web Vitals monitoring

## Future Improvements

- Automated testing suite
- CI/CD pipeline
- Enhanced error tracking
- Performance monitoring
- Advanced caching strategies
- GraphQL API layer (optional)

---

For questions or contributions, see [CONTRIBUTING.md](../CONTRIBUTING.md).

