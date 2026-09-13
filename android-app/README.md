# Smart Ration System - Android App

**Status:** Stage 1 - Project Structure Only (Implementation in Stage 4)

## Stack (Confirmed)
- **Language:** Kotlin
- **UI:** Jetpack Compose (Material 3 / Material You)
- **Architecture:** MVVM + Clean Architecture
- **DI:** Hilt
- **Networking:** Retrofit + OkHttp + Gson
- **Image Loading:** Coil
- **Local Storage:** DataStore Preferences
- **Camera / Face:** CameraX + ML Kit Face Detection
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 34 (Android 14)

## Planned Package Structure
```
app/src/main/java/com/smartration/app/
├── data/
│   ├── model/          # Data classes (API request/response models)
│   ├── remote/         # Retrofit API service interfaces
│   ├── repository/     # Repository implementations
│   └── local/          # DataStore, Room (if needed later)
├── di/                 # Hilt modules (AppModule, NetworkModule, etc.)
├── ui/
│   ├── theme/          # Material 3 theme, colors, typography, shapes
│   ├── components/     # Reusable Compose components (Cards, Buttons, Fields)
│   ├── navigation/     # NavGraph, Screens sealed class
│   ├── feature/
│   │   ├── login/      # LoginScreen, LoginViewModel (password + face)
│   │   ├── dashboard/  # HomeDashboardScreen, DashboardViewModel
│   │   ├── profile/    # ProfileScreen, ProfileViewModel
│   │   ├── rice/       # RiceInfoScreen, RiceHistoryScreen
│   │   ├── notifications/
│   │   ├── settings/   # ChangePassword
│   │   └── face/       # FaceCaptureScreen for verification
│   └── state/          # UI State sealed classes (Loading/Success/Error)
└── utils/              # Extensions, constants, validators
```

## Screens (Stage 4)
1. Login (Password + Face Verification option)
2. Home Dashboard (Rice stats cards)
3. Profile
4. Rice Information
5. Rice History (Lazy list with date/qty/remaining/status)
6. Notifications
7. Change Password
8. Logout

## Next Steps (Stage 4)
- Create Gradle project in Android Studio or via Gradle CLI
- Add all Kotlin/Compose/Hilt/Retrofit dependencies to build.gradle.kts
- Implement the screens above in Compose with Material 3 design
- Connect to Stage 2 API endpoints
```
