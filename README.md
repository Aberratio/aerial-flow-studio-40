# 🦎 IguanaFlow

IguanaFlow is a comprehensive training platform for aerial artists, pole dancers, and anyone who loves to fly. Think of it as your personal aerial arts coach, community hub, and progress tracker all rolled into one beautiful web app.

This platform helps you:

- **Learn** from a curated library of 200+ aerial poses and figures with step-by-step instructions
- **Challenge yourself** with structured 28-day programs designed to level up your skills
- **Connect** with a global community of aerial artists, share your progress, and get inspired
- **Track** your journey with detailed analytics and visual progress reports
- **Train** with personalized sessions and courses created by real instructors

Basically, it's like having a personal trainer, a social network, and a progress journal specifically for aerial arts. Pretty neat, right?

**🌐 Live and kicking at [iguanaflow.com](https://iguanaflow.com)**

## 🤖 About This Project

**This repository is my AI experiment** - a journey into seeing what's possible when you combine modern AI coding assistants with a clear vision.

The majority of this codebase was built using:

- **[Lovable](https://lovable.dev)** - For rapid prototyping and initial development
- **[Cursor](https://cursor.sh)** - For iterative improvements, refactoring, and fine-tuning

It's been fascinating to watch AI tools help bring this platform to life, from the initial concept to a fully functional, production-ready application serving real users at iguanaflow.com.

This isn't just a demo or proof of concept - it's a real, working application that people use every day to improve their aerial skills. The fact that AI played such a significant role in its creation is both exciting and a testament to how far these tools have come.

## 📝 Notes

- The app is **live in production** at [iguanaflow.com](https://iguanaflow.com)
- Feel free to explore the code
- Built with love (and a lot of AI assistance) for the aerial arts community
- Contributions and feedback are welcome!

**Questions? Ideas? Want to chat?**  
Reach out via [Instagram @iguana.flow](https://www.instagram.com/iguana.flow) or [hello@iguanaflow.com](mailto:hello@iguanaflow.com)

---

## ✨ Key Features

### 📚 Exercise Library

A massive collection of aerial poses, tricks, and transitions. Each exercise comes with:

- Clear photos and video demonstrations
- Step-by-step instructions
- Tips and variations
- Prerequisites and similar exercises
- Difficulty levels and categories

### 🎯 28-Day Challenges

Structured programs that guide you through progressive training over 28 days. Perfect for staying motivated and seeing real progress.

### 👥 Social Community

- **Feed**: Share your achievements, ask questions, and cheer on others
- **Friends System**: Connect with fellow aerialists, follow their journeys
- **Posts**: Document your training, share photos, and celebrate milestones
- **Achievements**: Earn badges and unlock rewards as you progress

### 🏋️ Training Sessions & Courses

- Create custom training sessions tailored to your goals
- Access professional courses designed by certified instructors
- Track your workout history and performance
- Built-in workout timer for your practice sessions

### 📊 Progress Tracking

- Visual analytics showing your improvement over time
- Skill tree system that maps your aerial journey
- Level progression and milestone tracking
- Detailed statistics on your training habits

### 🌳 Skill Tree / Aerial Journey

An interactive skill tree that visualizes your learning path. Unlock new levels, see your progress, and discover what's next in your aerial adventure.

### 👑 Premium Features

- Unlimited access to all challenges
- Advanced analytics and insights
- Expert coaching and feedback
- Priority support
- Exclusive content

### 📱 Progressive Web App (PWA)

Install IguanaFlow on your phone and use it like a native app. Works offline, loads fast, and feels smooth.

### 📸 Instagram Integration

Seamlessly embed and share Instagram content within the platform.

---

## 🛠️ Tech Stack

This project is built with modern, battle-tested technologies:

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Payments**: Stripe integration for premium subscriptions
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **PWA**: Vite PWA plugin
- **Deployment**: Production-ready and live at iguanaflow.com

---

## 🚀 Getting Started

Want to run this locally? Here's how:

### Prerequisites

- Node.js 18+ (we recommend using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm, yarn, or bun (we use bun, but npm works fine)
- A Supabase account (for backend services)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd aerial-flow-studio-40

# Install dependencies
npm install
# or
bun install

# Set up environment variables
# Create a .env file with your Supabase credentials
# (Check with the project maintainer for required env vars)

# Start the development server
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173` (or whatever port Vite assigns).

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 📁 Project Structure

```
aerial-flow-studio-40/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Authentication modals
│   │   ├── Challenge/      # Challenge-related components
│   │   ├── Layout/         # Layout components
│   │   ├── Profile/        # User profile components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...             # Other feature components
│   ├── contexts/           # React contexts (Auth, Dictionary)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/      # External service integrations
│   │   └── supabase/      # Supabase client and types
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components (routes)
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Main app component
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── ...config files
```

---

_Built with React, TypeScript, Supabase, and a healthy dose of AI magic ✨_
