# RETOMA

RETOMA is a personal, single-user activity management application. It is intended to help someone keep projects and interests in one place, record where they paused, and choose what to resume based on the time available.

## Target user

The target user is the person running the application on their own device. RETOMA does not include accounts, shared workspaces, or social features.

## Current status

The project is at its initial application-shell stage. The React application renders, and the development, linting, production-build, test, Activity domain model, local database, repository, and application-use-case foundations are configured. Visual activity management flows, progress tracking, and time-based resumption are planned but not implemented yet.

Current local updates use a last-write-wins approach if separate contexts update the same activity at the same time. Conflict detection is not implemented yet.

## Technology stack

- React 19 and TypeScript 6
- Vite 8
- Dexie 4 and Zod 4 for local data foundations and validation
- Vitest 4, jsdom, and React Testing Library
- ESLint 10
- Lucide React

## Installation and execution

Requirements: Node.js and npm.

```bash
npm ci
npm run dev
```

Use the local URL shown by Vite to open the application. To create a production build:

```bash
npm run build
npm run preview
```

## Testing and quality checks

```bash
npm run test
npm run test:watch
npm run lint
npm run build
```

The current test suite verifies that the application shell renders. As domain features are added, tests should cover business rules and important user flows.

## Data and privacy

RETOMA is designed for local device data only. It does not use cloud synchronization, analytics, advertising, external tracking, or AI features.

## Roadmap

Planned work and estimates are documented in [ROADMAP.md](./ROADMAP.md).
