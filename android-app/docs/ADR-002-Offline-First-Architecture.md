# ADR-002: Offline-First Architecture with Room

## Status
Accepted

## Context
Users need to access tennis predictions even when offline or with poor network connectivity. The app should provide a seamless experience regardless of network conditions.

## Decision
Implement an offline-first architecture using Room database as the single source of truth.

## Rationale

### Data Flow:
1. **UI Layer** requests data from Repository
2. **Repository** immediately returns cached data from Room (if available)
3. **Repository** fetches fresh data from network (if connected)
4. **Repository** updates Room cache
5. **Room** emits updated data to UI via Flow

### Why Offline-First:
- Better user experience (instant data display)
- Resilient to network issues
- Reduced API calls (cost savings)
- Works completely offline
- Automatic cache management

### Why Room:
- Official Android persistence library
- Type-safe SQL queries
- Compile-time verification
- Integration with Kotlin Coroutines and Flow
- Migration support
- Paging library integration

## Consequences

### Positive:
- Instant app startup (no loading spinners)
- Works completely offline
- Reduced network bandwidth usage
- Better perceived performance
- Automatic data persistence

### Negative:
- Cache invalidation complexity
- Storage space usage
- Data synchronization logic needed
- Potential stale data issues

## Implementation Details

### Cache Strategy:
- Predictions cached for 7 days
- Automatic cleanup of old data
- Network-first for initial load
- Cache-first for subsequent loads

### Sync Strategy:
- Background sync every app launch (if connected)
- Manual refresh option for users
- Optimistic updates for user actions

### Database Schema:
- `predictions` table with full prediction data
- Indexes on `prediction_day`, `tournament`, `created_at`
- Foreign key relationships for referential integrity

## Alternatives Considered
1. **Network-only** - Poor offline experience
2. **SharedPreferences** - Not suitable for complex data
3. **SQLite directly** - More boilerplate, less safe
4. **Realm** - Less integration with Android architecture components

## Monitoring
- Track cache hit/miss ratios
- Monitor database size
- Log sync errors
- Measure time-to-first-data
