# Changelog

## 1.1.0 - Unreleased

### Changed

- Update dev configurations
- Bump dependencies
- Update `eslint` and `esbuild`
- Consolidate event handlers, perf improvements
- Refactor `main.ts` into smaller, single-responsibility modules (`modal`, `stats`, `types`) for improved maintainability.
- Update test suite to accomodate new project structure.
- Improve `getWordCount` regex to handle abbreviations properly.
- Create shared services to eliminate code duplication between main plugin and modal.
- Refactor `updateWordCount` method into smaller, single-purpose functions for improved maintainability.
- Centralize types into `types.ts`.

### Added

- Add CI GitHub Action workflow
- Add stats modal on click
- Add styles
- Add stats based on current text selection
- Add testing with Jest
    - Expand testing suite
- Add formatting with Prettier
    - Add prettier check to CI
    - Add `.prettierignore` file
    - Add new dependency `eslint-config-prettier`
- Add `EditorContext` service for centralized editor state management
- Add `StatsService` class with built-in caching for performance optimization
- Add comprehensive unit tests for new shared services and refactored methods

## 1.0.0 - 2025-01-30

### Added

- Initial release.
- Core Status Bar Modules:
    - Word counter
    - Character counter
    - Read time estimation
    - Last saved time
- Toggle modules on/off in settings.
- Adjust module labels in settings.
