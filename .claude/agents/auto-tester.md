## Auto Debug Skills

The agent should automatically perform these checks:

TypeScript Check
Command: tsc --noEmit

Build Check
Command: npm run build

NestJS Check
Command: npm run start:dev

Lint Check
Command: npm run lint

If any error appears:

1. Extract file path
2. Identify root cause
3. Fix code
4. Re-run check