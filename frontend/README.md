# PoshanCare

PoshanCare is a modern nutrition tracking and nutrition intelligence web application designed to help users track food intake, body metrics, macronutrients, and health goals with precision.

## Tech Stack

- **Framework & Build**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Code Quality**: ESLint, Prettier

## Project Structure

```
frontend/
├── UI_UX/                   # Visual Source of Truth (Google Stitch HTML designs)
├── src/
│   ├── assets/              # Images, static media
│   ├── components/          # Reusable components (layout, ui, common)
│   ├── pages/               # Route components (landing, auth, onboarding, app, shared)
│   ├── routes/              # Centralized route definitions
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Third-party configurations
│   ├── utils/               # Helper utilities
│   ├── types/               # TypeScript type definitions
│   ├── constants/           # Constant values
│   ├── styles/              # Global CSS & Tailwind imports
│   ├── App.tsx              # Root application component
│   └── main.tsx             # Entry point
├── public/                  # Public assets
├── .env.example             # Environment variable placeholders
├── package.json             # Scripts & dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── eslint.config.js         # ESLint configuration
```

## Development Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Run TypeScript type checker:
   ```bash
   npm run typecheck
   ```
6. Run linter:
   ```bash
   npm run lint
   ```

## UI/UX Reference

> **Note**: The `frontend/UI_UX/` directory contains the complete Google Stitch HTML designs (`authentication/`, `landing/`, `main_application/`, `onboarding/`, `shared/`).
> This directory serves as the **visual source of truth** for PoshanCare and must remain untouched as reference material for UI implementation in Phase 2.
