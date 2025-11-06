# ADR-001: Use Hilt for Dependency Injection

## Status
Accepted

## Context
The Android app needs a dependency injection framework to manage dependencies between components, improve testability, and reduce boilerplate code.

## Decision
We will use Hilt (Dagger 2 wrapper) for dependency injection instead of manual DI or other frameworks.

## Rationale

### Why Hilt over alternatives:

**Hilt vs Manual DI:**
- Reduces boilerplate code significantly
- Provides compile-time verification
- Built-in Android component integration
- Automatic lifecycle management

**Hilt vs Koin:**
- Compile-time safety vs runtime resolution
- Better performance (no reflection)
- Official Google recommendation
- Consistent with modern Android development

**Hilt vs pure Dagger 2:**
- Less boilerplate
- Android-specific annotations (@HiltAndroidApp, @AndroidEntryPoint)
- Predefined components for Android lifecycle
- Easier learning curve

## Consequences

### Positive:
- Clean separation of concerns
- Easy to test with mocking
- Automatic singleton management
- Compile-time dependency graph validation
- Reduced coupling between components

### Negative:
- Build time increase (KSP processing)
- Additional learning curve for team members
- Generated code to understand during debugging

## Alternatives Considered
1. **Manual DI** - Too much boilerplate
2. **Koin** - Runtime resolution, less safe
3. **Pure Dagger 2** - More complex setup

## Implementation
- All ViewModels injected via Hilt
- Repository instances provided via modules
- Singletons for network, database, preferences
- Test variants use HiltTestApplication
