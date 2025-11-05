# Android App Setup Guide

This guide will help you set up and run the Tennis Predictions Android app.

## Prerequisites

1. **Java Development Kit (JDK)**
   - JDK 17 or later
   - Download from: https://adoptium.net/

2. **Android Studio**
   - Android Studio Hedgehog (2023.1.1) or later
   - Download from: https://developer.android.com/studio

3. **Android SDK**
   - Android SDK 26 (Android 8.0) or later
   - Android SDK 34 (Android 14) for compilation
   - Install via Android Studio SDK Manager

4. **API Keys**
   - Google AI API Key (for Gemini): https://makersuite.google.com/app/apikey
   - Perplexity API Key: https://www.perplexity.ai/settings/api

## Quick Start

### Option 1: Using Android Studio (Recommended)

1. **Open Project**
   ```bash
   # Open Android Studio
   # File > Open > Navigate to android-app folder
   ```

2. **Configure API Keys**
   - Open `local.properties` in the root of the android-app folder
   - Add your API keys:
   ```properties
   sdk.dir=/path/to/your/Android/Sdk
   GOOGLE_AI_API_KEY=your_actual_google_ai_key_here
   PERPLEXITY_API_KEY=your_actual_perplexity_key_here
   API_BASE_URL=http://193.24.209.9:3001
   ```

3. **Sync Project**
   - Android Studio will automatically prompt you to sync Gradle
   - Click "Sync Now" or File > Sync Project with Gradle Files

4. **Run the App**
   - Connect an Android device via USB (with USB debugging enabled)
   - OR start an Android emulator (Tools > Device Manager)
   - Click the green "Run" button or press Shift+F10
   - Select your device/emulator and click OK

### Option 2: Using Command Line

1. **Set Android SDK Path**
   ```bash
   # On Linux/Mac
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

   # On Windows
   set ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
   set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
   ```

2. **Configure API Keys**
   - Edit `android-app/local.properties`
   - Add the configuration as shown in Option 1

3. **Build the APK**
   ```bash
   cd android-app
   ./gradlew assembleDebug
   ```
   The APK will be generated at: `app/build/outputs/apk/debug/app-debug.apk`

4. **Install on Device**
   ```bash
   # Connect your device via USB and enable USB debugging
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

## Configuration Details

### local.properties File

Create or edit `android-app/local.properties`:

```properties
# Path to Android SDK (required)
sdk.dir=/Users/yourname/Library/Android/sdk

# API Keys (required for AI analysis)
GOOGLE_AI_API_KEY=AIzaSy...your-key-here
PERPLEXITY_API_KEY=pplx-...your-key-here

# Backend API URL (modify if needed)
API_BASE_URL=http://193.24.209.9:3001
```

### Getting API Keys

#### Google AI (Gemini) API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to `local.properties`

#### Perplexity API Key
1. Go to https://www.perplexity.ai/settings/api
2. Sign in or create an account
3. Click "Generate API Key"
4. Copy the key and add it to `local.properties`

## Troubleshooting

### Gradle Sync Issues

**Problem**: Gradle sync fails
**Solution**:
- Check your internet connection
- Invalidate caches: File > Invalidate Caches > Invalidate and Restart
- Check that JDK 17+ is configured: File > Project Structure > SDK Location

### Build Errors

**Problem**: Compilation errors
**Solution**:
- Clean the project: Build > Clean Project
- Rebuild: Build > Rebuild Project
- Check that Android SDK 34 is installed

### API Connection Issues

**Problem**: Cannot load predictions
**Solution**:
- Verify `API_BASE_URL` in `local.properties`
- Check that the backend server is running
- For emulator: Use `10.0.2.2` instead of `localhost` if connecting to local server
- Check network permissions in AndroidManifest.xml (should already be set)

### Missing API Keys

**Problem**: AI analysis doesn't work
**Solution**:
- Verify API keys are correctly set in `local.properties`
- Ensure there are no extra spaces or quotes around the keys
- Rebuild the project after adding keys: Build > Rebuild Project

### Emulator Issues

**Problem**: App won't run on emulator
**Solution**:
- Create a new AVD (Android Virtual Device): Tools > Device Manager > Create Device
- Use a device with API level 26 or higher
- Recommended: Pixel 5 with API 34 (Android 14)

## Development Tips

### Running on Physical Device

1. Enable Developer Options on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Developer Options will appear in Settings

2. Enable USB Debugging:
   - Go to Settings > Developer Options
   - Enable "USB Debugging"

3. Connect via USB and authorize your computer when prompted

### Hot Reload

Jetpack Compose supports Live Edit in Android Studio:
- Make UI changes in @Composable functions
- Changes will appear almost instantly without rebuilding

### Debugging

- Use Android Studio's debugger: Run > Debug 'app'
- View logs: View > Tool Windows > Logcat
- Filter by tag or package name for cleaner logs

## Building for Production

1. **Create Signing Key**
   ```bash
   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```

2. **Configure Signing in build.gradle.kts**
   ```kotlin
   android {
       signingConfigs {
           create("release") {
               storeFile = file("my-release-key.jks")
               storePassword = "your-password"
               keyAlias = "my-key-alias"
               keyPassword = "your-password"
           }
       }
       buildTypes {
           release {
               signingConfig = signingConfigs.getByName("release")
           }
       }
   }
   ```

3. **Build Release APK**
   ```bash
   ./gradlew assembleRelease
   ```

## Project Structure

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/tennis/predictions/
│   │   │   ├── data/              # Data layer
│   │   │   │   ├── model/         # Data models
│   │   │   │   ├── api/           # API service
│   │   │   │   └── repository/    # Repository
│   │   │   ├── ui/                # UI layer
│   │   │   │   ├── theme/         # Theme configuration
│   │   │   │   ├── components/    # Reusable components
│   │   │   │   ├── screens/       # Screen composables
│   │   │   │   └── viewmodel/     # ViewModels
│   │   │   ├── util/              # Utilities
│   │   │   └── MainActivity.kt    # Entry point
│   │   ├── res/                   # Resources
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── local.properties               # YOU CREATE THIS
└── README.md
```

## Testing the App

1. **Launch the app** - You should see today's predictions grouped by tournament
2. **Expand a tournament** - Tap on a tournament card to see all matches
3. **Analyze a match** - Tap "Analyze with AI" on any match
4. **Switch AI providers** - Try both Google Gemini and Perplexity
5. **Use filters** - Tap the filter icon to filter by surface, tournament, etc.
6. **Pull to refresh** - Swipe down to reload predictions

## Performance

The app is optimized for smooth performance:
- Efficient API calls with caching
- Lazy loading of lists
- AI analysis results cached for 1 hour
- Smooth animations with Jetpack Compose

## Support

If you encounter issues:
1. Check this setup guide
2. Review the troubleshooting section
3. Check Android Studio's Logcat for error messages
4. Verify all prerequisites are installed correctly

## Next Steps

- Customize the theme in `ui/theme/`
- Add more features in the UI components
- Extend the API service for additional endpoints
- Implement offline mode with Room database
