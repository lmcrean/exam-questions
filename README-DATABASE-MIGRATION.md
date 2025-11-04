# Database Migration to Shared Package

This document describes the database architecture migration completed for scaling to 100,000 users.

## Overview

The database layer has been extracted from `apps/api` into a shared package `packages/db` using Turborepo for better code reusability and maintainability.

## Architecture Changes

### Before
```
apps/api/
├── db/
│   ├── database.ts          # Database connection
│   └── migrations/          # Database migrations
├── services/
│   └── db-service/          # Database operations
└── models/                  # Domain models (tightly coupled)
```

### After
```
packages/db/                 # Shared database package
├── src/
│   ├── database.ts          # Database connection (supports PostgreSQL & SQLite)
│   ├── types.ts             # Type definitions
│   ├── service/             # Database operations (CRUD helpers)
│   │   ├── findById.ts
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── ...
│   └── migrations/          # All database migrations
│       ├── initialSchema.ts
│       ├── assessmentSchema.ts
│       └── ...
└── package.json

apps/api/                    # API still owns business logic
├── models/                  # Domain models (use @repo/db)
└── routes/                  # API routes (use @repo/db)

apps/web/                    # Can now access DB if needed
apps/ai/                     # Can now access DB if needed
```

## Key Benefits

1. **Code Reusability**: All apps can now import from `@repo/db`
2. **Reduced Duplication**: Single source of truth for database operations
3. **Independent Testing**: Database layer can be tested separately
4. **Better Scaling**: New services can easily access the database
5. **Turborepo Caching**: Faster builds with intelligent caching

## Usage

### Importing the Database

```typescript
// Import database connection
import { db, dbType } from '@repo/db';

// Import database service
import { DbService, findById, create, update } from '@repo/db';

// Import types
import type { DbRecord, WhereCondition } from '@repo/db';

// Import migrations
import { createTables, dropTables } from '@repo/db';
```

### Database Operations

```typescript
// Using the database connection directly
const users = await db('users').where('email', email).first();

// Using the database service
const user = await DbService.findById('users', userId);
const newUser = await DbService.create('users', userData);

// Using individual service functions
const user = await findById('users', userId);
const users = await findBy('users', 'email', email);
```

### Running Migrations

```typescript
import { db, createTables } from '@repo/db';

// Run initial schema creation
await createTables(db);
```

## Environment Variables

The shared package uses the following environment variables:

- `NODE_ENV`: Set to "production" for PostgreSQL, otherwise uses SQLite
- `NEON_DATABASE_URL`: PostgreSQL connection string (production)
- `SQLITE_PATH`: Path to SQLite database file (development) - defaults to `./dev.sqlite3`

## Development Workflow

### Building the Package

```bash
# Build all packages
npm run build

# Build just the database package
cd packages/db && npm run build

# Watch mode for development
cd packages/db && npm run dev
```

### Running Tests

```bash
# Run all tests
npm run test

# Run API tests (uses shared package)
cd apps/api && npm run test
```

### Adding New Database Operations

1. Add the function to `packages/db/src/service/`
2. Export it from `packages/db/src/service/index.ts`
3. Re-export from `packages/db/src/index.ts`
4. Build the package: `npm run build`
5. Use it in your app: `import { myNewFunction } from '@repo/db'`

## Migration Checklist

✅ Turborepo installed and configured
✅ Workspace structure created
✅ `packages/db` package initialized
✅ Database connection migrated
✅ Database services migrated
✅ All migrations moved
✅ `apps/api` updated to use `@repo/db`
✅ All imports updated
✅ Tests passing
✅ Build successful
✅ Documentation created

## Performance Improvements

With Turborepo, you get:

- **Smart Caching**: Builds are cached based on file changes
- **Parallel Execution**: Multiple packages build simultaneously
- **Remote Caching**: Share cache across team members (optional)

## Troubleshooting

### Import Errors

If you see "Cannot find module '@repo/db'":
1. Ensure packages/db is built: `cd packages/db && npm run build`
2. Run `npm install` in the root directory

### SQLite Path Issues

If SQLite can't find the database file:
1. Set `SQLITE_PATH` environment variable
2. Or use the default path set in `apps/api/db/index.ts`

### TypeScript Errors

If TypeScript can't resolve types:
1. Ensure the package is built with declarations: `npm run build`
2. Check that `types` field in package.json points to `./dist/index.d.ts`

## Future Enhancements

- [ ] Add database pooling configuration
- [ ] Implement connection retry logic
- [ ] Add database health check utilities
- [ ] Create migration runner CLI tool
- [ ] Add database seeding utilities
- [ ] Implement query logging middleware

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the code in `packages/db/src/`
- See examples in `apps/api/` for usage patterns
