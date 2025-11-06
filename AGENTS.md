# Agent Commands & Guidelines

## Build/Lint/Test Commands
- **Frontend**: `cd dashboard/frontend && npm install && npm run dev` (dev) / `npm run build` (prod)
- **Backend**: `cd dashboard/backend && go mod download && go build -o tennis-dashboard && ./tennis-dashboard`
- **Scraping**: `node scraping/scrape-with-date.js [options]` or `./run-morning-scrape.sh` / `./run-evening-scrape.sh`
- **Database**: `psql -d tennis_predictions < database/schema.sql`
- **Tests**: No test framework configured - run manual validation scripts in `scripts/`

## Code Style Guidelines
- **JavaScript**: ES6 imports, `const` > `let`, arrow functions, async/await, JSDoc comments, 2-space indent, single quotes
- **Go**: `go fmt`, PascalCase exports, camelCase locals, explicit error returns, grouped imports (std → third-party → internal)
- **SQL**: snake_case naming, CHECK constraints, indexed FKs, COMMENT ON statements
- **Shell**: `set -euo pipefail`, `${VAR}` syntax, quoted paths, descriptive error messages
- **General**: Validate inputs, fail fast, env vars for secrets, descriptive names, no comments unless complex logic
