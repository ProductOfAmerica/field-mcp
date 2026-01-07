---
description: Audit codebase for dependency injection violations and coupling issues
allowed-tools: Bash(find:*), Bash(grep:*), Bash(cat:*), Bash(wc:*), View, Edit
---

# Dependency Injection Audit

Analyze this Node.js codebase for dependency injection violations. Check ALL `.js`, `.ts`, `.mjs`, and `.cjs` files.

## Anti-Patterns to Detect

### 1. Hard-coded Dependencies Inside Classes/Functions
Flag code like:
```javascript
class UserService {
  constructor() {
    this.db = require('./database'); // BAD
    this.logger = new Logger();      // BAD
  }
}
```

### 2. Singleton Instance Exports
Flag:
```javascript
module.exports = new UserService(); // BAD - exports instance, not factory
export default new ApiClient();     // BAD
```

### 3. Direct Imports of Implementations in Business Logic
Flag files that import concrete implementations rather than receiving them:
```javascript
import { S3Client } from '@aws-sdk/client-s3'; // BAD if used directly in business logic
const stripe = require('stripe')(key);         // BAD - should be injected
```

### 4. Missing Factory Functions
Flag modules that export classes without factory functions when the class has dependencies.

### 5. God Classes with Multiple Responsibilities
Flag classes/modules that instantiate many different dependencies internally.

### 6. Scattered Configuration
Flag when config/env vars are accessed throughout the codebase instead of being injected from a composition root.

## What to Check

1. **Entry points** (`index.js`, `app.js`, `server.js`, `main.ts`) - Should contain the composition root where dependencies are wired
2. **Service/handler files** - Should receive dependencies via constructor/factory params
3. **Test files** - Check if mocking is difficult (indicates tight coupling)

## Output Format

Create a report with:

### Summary
- Total files scanned
- Number of violations found
- Severity breakdown (Critical/Warning/Info)

### Violations Found
For each violation:
- **File**: path/to/file.js:lineNumber
- **Type**: (Hard-coded Dependency | Singleton Export | Missing Factory | etc.)
- **Code**: The problematic code snippet
- **Fix**: Suggested refactor

### Composition Root Check
- Does one exist? (Yes/No)
- Location if found
- Assessment of its completeness

### Recommendations
Prioritized list of refactoring steps, starting with highest-impact changes.

## Execution Steps

1. Find all JS/TS files (excluding node_modules, dist, build, coverage)
2. Scan for `require()` and `import` statements inside class constructors and function bodies
3. Scan for `module.exports = new` and `export default new` patterns
4. Check for `process.env` usage outside config files
5. Identify files with 3+ direct instantiations (`new SomeClass`)
6. Look for composition root patterns in entry files
7. Generate the report

$ARGUMENTS