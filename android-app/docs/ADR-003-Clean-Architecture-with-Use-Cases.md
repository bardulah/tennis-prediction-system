# ADR-003: Clean Architecture with Use Case Layer

## Status
Accepted

## Context
The app needs a scalable, maintainable architecture that separates business logic from UI and data layers.

## Decision
Implement Clean Architecture principles with a dedicated Use Case (Interactor) layer between ViewModels and Repositories.

## Architecture Layers

```
┌─────────────────────┐
│   Presentation      │  ← Jetpack Compose UI, ViewModels
├─────────────────────┤
│   Domain/UseCases   │  ← Business Logic, Use Cases
├─────────────────────┤
│   Data/Repository   │  ← Data Sources, API, Database
└─────────────────────┘
```

## Rationale

### Why Use Cases:
- **Single Responsibility**: Each use case handles one business operation
- **Testability**: Easy to unit test business logic in isolation
- **Reusability**: Use cases can be composed and reused
- **Independence**: Business logic independent of framework
- **Maintainability**: Changes to business rules isolated to use cases

### Benefits:
1. **Separation of Concerns**: Clear boundaries between layers
2. **Testability**: Each layer can be tested independently
3. **Flexibility**: Easy to swap implementations
4. **Scalability**: Easy to add new features
5. **Team Collaboration**: Different teams can work on different layers

## Implementation

### Use Case Pattern:
```kotlin
class GetTodaysPredictionsUseCase @Inject constructor(
    private val repository: PredictionsRepository
) {
    operator fun invoke(filters: PredictionFilters): Flow<Result<List<Prediction>>> {
        // Business logic here
    }
}
```

### ViewModel Integration:
```kotlin
@HiltViewModel
class PredictionsViewModel @Inject constructor(
    private val getTodaysPredictionsUseCase: GetTodaysPredictionsUseCase,
    private val calculateStatsUseCase: CalculateStatsUseCase
) : ViewModel() {
    // ViewModels depend on use cases, not repositories directly
}
```

### Key Use Cases:
- `GetTodaysPredictionsUseCase` - Fetch and filter predictions
- `GetFilterOptionsUseCase` - Load available filters
- `GroupPredictionsByTournamentUseCase` - Group data for UI
- `CalculateStatsUseCase` - Compute statistics
- `AnalyzeMatchUseCase` - AI analysis with retry logic

## Consequences

### Positive:
- Clear separation between business logic and data access
- Easy to test business logic without Android dependencies
- Reusable business logic across different UIs
- Changes to data layer don't affect business logic
- Easier to understand codebase structure

### Negative:
- More classes and files to maintain
- Slight increase in boilerplate
- Learning curve for new developers
- Potential over-engineering for simple operations

## Alternatives Considered
1. **ViewModels directly calling Repository** - Mixes concerns
2. **No Use Case layer** - Business logic scattered
3. **MVI/MVA patterns** - More complex for this use case

## Guidelines

### When to create a Use Case:
- Complex business logic
- Multiple repository calls needed
- Logic reused in multiple places
- Need for error handling and retry logic

### When NOT to create a Use Case:
- Simple pass-through operations
- UI-specific transformations
- One-off operations

## Testing Strategy
- Unit tests for each use case
- Mock repositories in use case tests
- Integration tests at repository layer
- UI tests don't test business logic
