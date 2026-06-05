# Expense Tracker & Budget Manager

Expense Tracker & Budget Manager is a simple React app for tracking expenses, managing budgets, reviewing goals, and testing receipt scans with local mock data.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest

## Product Boundary

This project is mock-only. It does not connect to real accounts, process payments, move money, or call real OCR services. Connected accounts, receipt scans, sample data, and sign-in are simulated locally for testing.

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Available Scripts

- `npm run dev` starts the local Vite development server.
- `npm run build` creates a production build.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.
- `npm run lint:styles` checks CSS and style rules.
- `npm run typecheck` runs TypeScript checks.
- `npm run test` runs the Vitest test suite.

## Architecture

The app keeps rules, mock data, feature screens, and shared UI components under `src/`.
