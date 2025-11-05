# Tennis Predictions Android App

A modern Android application for viewing tennis match predictions with AI-powered analysis.

## Features

- **Today's Predictions**: View all tennis predictions for today
- **Tournament Grouping**: Predictions organized by tournament with expandable/collapsible sections
- **AI Analysis**: Analyze matches using Google Gemini or Perplexity AI
- **Filters**: Search and filter by tournament, surface, recommended action, and more
- **Statistics**: View overall accuracy, average confidence, and value bet percentage
- **Clean UI**: Minimalistic Material 3 design with smooth animations

## Tech Stack

- **Kotlin** - Modern programming language
- **Jetpack Compose** - Declarative UI framework
- **Material 3** - Latest Material Design components
- **Retrofit** - HTTP client for API calls
- **Coroutines** - Asynchronous programming
- **ViewModel** - Architecture component for state management
- **Google Generative AI SDK** - For Gemini AI integration
- **Markdown Rendering** - For displaying formatted AI analysis

## Setup

1. **API Keys**: Update `local.properties` with your API keys:
   ```properties
   GOOGLE_AI_API_KEY=your_google_ai_key_here
   PERPLEXITY_API_KEY=your_perplexity_key_here
   API_BASE_URL=http://193.24.209.9:3001
   ```

2. **SDK Location**: Update `local.properties` with your Android SDK path:
   ```properties
   sdk.dir=/path/to/your/android-sdk
   ```

3. **Build**:
   ```bash
   ./gradlew assembleDebug
   ```

4. **Run**: Open the project in Android Studio and run on your device or emulator

## Architecture

```
app/
├── data/
│   ├── model/          # Data models (Prediction, Tournament, etc.)
│   ├── api/            # Retrofit API service
│   └── repository/     # Data repository layer
├── ui/
│   ├── theme/          # App theme (colors, typography)
│   ├── components/     # Reusable UI components
│   ├── screens/        # Main screens
│   └── viewmodel/      # ViewModels for state management
└── util/               # Utility classes (AI service, extensions)
```

## Requirements

- Android SDK 26+ (Android 8.0+)
- Android Studio Hedgehog or later
- Kotlin 1.9.20+

## API Integration

The app connects to the same backend API as the web dashboard:
- Base URL: `http://193.24.209.9:3001`
- Endpoints:
  - `GET /api/predictions` - Fetch predictions with filters
  - `GET /api/filters` - Get available filter options

## AI Analysis

Two AI providers are supported:
- **Google Gemini 2.0 Flash** - With web search grounding
- **Perplexity Sonar Pro** - Real-time web search

Analysis results are cached for 1 hour to improve performance and reduce API calls.

## Performance

- Efficient data loading with pagination
- HTTP response caching
- AI analysis caching (SharedPreferences)
- Smooth animations with Compose
- Lazy loading of list items

## License

MIT License - See root project for details
