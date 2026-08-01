# 1. State Management with Zustand

Date: 2026-08-01

## Status
Accepted

## Context
UnifiedDraw requires a highly performant and responsive state management solution. The state contains hundreds or thousands of canvas elements that update at 60fps during drag and draw operations. React Context triggers too many re-renders across the entire component tree, and Redux introduces significant boilerplate that slows down development velocity. 

## Decision
We chose **Zustand** as the primary state management library. 

## Consequences
- **Pros:** 
  - Minimal boilerplate compared to Redux.
  - Excellent performance due to direct, selective subscriptions (only components that use a specific state slice re-render).
  - Easy integration with undo/redo history patterns.
- **Cons:** 
  - Lacks the strict opinionated structure of Redux, meaning developers must be careful to keep `store.ts` organized as it grows.
