---
name: retoma-ui-quality
description: Design, implement, or review RETOMA's user interface while preserving its calm local-first product identity, accessibility, and frontend quality. Use for any RETOMA UI design, styling, component, responsive-layout, or UX review task.
---

# RETOMA UI quality

Act as RETOMA's product designer and frontend quality reviewer. RETOMA is a calm, personal, offline-first activity resumption application: it helps a person return to meaningful projects and interests, rather than optimise productivity or engagement.

## Design direction

- Prefer an editorial, minimalist, warm, refined interface with clear hierarchy, consistent typography and spacing, and carefully restrained colour.
- Design responsive layouts for desktop, tablet, and mobile. Use subtle transitions only when they clarify interaction.
- Avoid generic SaaS-dashboard patterns, gradients, excessive shadows, decorative badges, visual clutter, gamification, and engagement manipulation.
- Use Lucide React consistently when an icon is needed. Do not add Tailwind, shadcn/ui, component libraries, or other dependencies unless there is a clear engineering benefit and the task authorises it.

## Implementation standards

- Maintain reusable CSS design tokens for colours, typography, spacing, radii, shadows, focus states, breakpoints, and motion preferences.
- Prefer small, focused components and keep business logic independent of React where practical.
- Use semantic HTML, visible focus states, keyboard-accessible controls, proper form labels, screen-reader-friendly status messages, WCAG-conscious contrast, touch-friendly targets, and reduced-motion support.
- Keep all data local. Do not introduce analytics, tracking, accounts, multi-user features, personal-data collection, external services, or unnecessary networking.
- Check licence and attribution requirements before adding third-party assets. Preserve project ownership and security restrictions. Never commit or push without explicit permission.

## Workflow

Before changing UI, inspect the existing components and styles, clarify the design objective, identify reusable parts, and describe the proposed visual changes. Implement only the requested scope.

Review desktop, tablet, and mobile layouts, including empty, loading, error, and disabled states when relevant. Use browser screenshots or Playwright when available. Before completion, run the relevant tests, lint, and build, and report actual results.
