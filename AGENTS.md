# Agent Guidelines for ScoreBoard

This document provides essential information for AI coding agents working in this repository.

## Project Overview

**Status**: Project initialization pending
**Type**: To be determined (Web app, API, CLI, etc.)
**Primary Language**: To be determined

## Build, Lint, and Test Commands

### Development
```bash
# Install dependencies
npm install        # or: yarn install / pnpm install / pip install -r requirements.txt

# Start development server
npm run dev        # or: yarn dev / npm start

# Build for production
npm run build      # or: yarn build / python setup.py build
```

### Testing
```bash
# Run all tests
npm test           # or: yarn test / pytest / cargo test

# Run tests in watch mode
npm run test:watch # or: pytest --watch

# Run a single test file
npm test path/to/test.js                    # Jest/Vitest
pytest path/to/test_file.py                 # Pytest
cargo test test_name                         # Rust

# Run a specific test case
npm test -- -t "test name"                   # Jest
pytest path/to/test.py::test_function_name  # Pytest
```

### Linting and Formatting
```bash
# Lint code
npm run lint       # or: eslint . / flake8 / cargo clippy

# Fix linting issues
npm run lint:fix   # or: eslint . --fix / black .

# Format code
npm run format     # or: prettier --write . / black .
```

## Code Style Guidelines

### General Principles
- Write clear, self-documenting code
- Prefer explicit over implicit
- Keep functions small and focused (single responsibility)
- Avoid premature optimization
- Write code that's easy to delete

### Imports
- Group imports in the following order:
  1. Standard library imports
  2. Third-party library imports
  3. Local/project imports
- Sort imports alphabetically within each group
- Use absolute imports over relative when possible
- Remove unused imports

**TypeScript/JavaScript:**
```typescript
// Standard library
import fs from 'fs';
import path from 'path';

// Third-party
import express from 'express';
import { z } from 'zod';

// Local
import { UserService } from '@/services/user';
import type { Config } from '@/types';
```

**Python:**
```python
# Standard library
import os
import sys

# Third-party
import numpy as np
import requests

# Local
from app.services import UserService
from app.types import Config
```

### Formatting
- Indentation: 2 spaces (JS/TS) or 4 spaces (Python)
- Line length: 80-100 characters (soft limit), 120 (hard limit)
- Use trailing commas in multi-line arrays/objects
- Use single quotes for strings (JS/TS) or double quotes (Python)
- Always use semicolons (if applicable to language)

### Types and Interfaces
- Always use explicit types (TypeScript, Rust, etc.)
- Avoid `any` type - prefer `unknown` and type guards
- Define interfaces for objects with known shapes
- Use type inference only when type is obvious
- Document complex types with comments

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// Avoid
function getUser(id: any): any {
  // Implementation
}
```

### Naming Conventions
- **Variables/Functions**: camelCase (JS/TS) or snake_case (Python)
- **Classes/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Private members**: prefix with underscore or use # (JS)
- **Boolean variables**: prefix with is/has/should/can
- **Files**: kebab-case or match primary export case

### Error Handling
- Always handle errors explicitly
- Use try-catch for async operations
- Provide meaningful error messages
- Create custom error classes for domain errors
- Log errors with sufficient context
- Never silently swallow errors

```typescript
// Good
try {
  const data = await fetchData();
  return processData(data);
} catch (error) {
  logger.error('Failed to fetch and process data', { error, context });
  throw new DataProcessingError('Unable to process data', { cause: error });
}

// Avoid
try {
  const data = await fetchData();
  return processData(data);
} catch (error) {
  // Silent failure
}
```

### Comments and Documentation
- Write self-documenting code first
- Add comments for "why", not "what"
- Document public APIs with JSDoc/docstrings
- Keep comments up-to-date with code changes
- Use TODO/FIXME/NOTE tags appropriately

## Testing Guidelines

### Test Structure
- One test file per source file
- Name test files: `*.test.ts`, `*_test.py`, etc.
- Use descriptive test names that explain intent
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests independent and isolated

### What to Test
- Happy path functionality
- Edge cases and boundary conditions
- Error conditions and validation
- Integration points between modules
- Public API contracts

## Git Commit Guidelines

- Use conventional commits format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep commits atomic and focused
- Write descriptive commit messages
- Reference issue numbers when applicable

Examples:
```
feat(auth): add JWT authentication
fix(api): handle null response from user service
docs(readme): update installation instructions
test(user): add tests for user validation
```

## AI Agent Specific Notes

### Before Making Changes
1. Read relevant existing code first
2. Understand the current patterns and conventions
3. Check for similar implementations in the codebase
4. Plan changes using the TodoWrite tool for multi-step tasks

### When Writing Code
1. Match the existing code style exactly
2. Add appropriate error handling
3. Include types/type hints
4. Write or update tests for new functionality
5. Update documentation if needed

### After Making Changes
1. Run tests to ensure nothing broke
2. Run linter and fix any issues
3. Verify the build succeeds
4. Review your changes for consistency

## Additional Resources

- **Documentation**: Check `/docs` directory
- **Contributing**: See `CONTRIBUTING.md` if present
- **Architecture**: See `ARCHITECTURE.md` if present
- **API Docs**: Check `/api-docs` or similar

---

**Note**: This document should be updated as the project evolves and conventions are established.
