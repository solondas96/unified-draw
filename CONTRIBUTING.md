# Contributing to UnifiedDraw

First off, thank you for considering contributing to UnifiedDraw! It's people like you that make it such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check if there's already an [issue](https://github.com/solondas96/unified-draw/issues) for it. If not, feel free to open one!

## Setting up for local development

1. Fork the repo and clone it locally.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the local development server at `http://localhost:5173`.
4. Create a branch for your edits.

## Pull Request Guidelines

- Ensure your code passes all linting (`npm run lint`).
- Ensure the project builds successfully (`npm run build`).
- Ensure tests pass with adequate coverage (`npm run test -- --coverage`).
- The `main` branch is protected. All PRs require at least one approving review from a `CODEOWNER` before merging.

## Style Guide

We use `oxlint` and `prettier` for code formatting. These are automatically enforced via `husky` and `lint-staged` pre-commit hooks, so you don't need to worry about manually formatting your code before committing!
