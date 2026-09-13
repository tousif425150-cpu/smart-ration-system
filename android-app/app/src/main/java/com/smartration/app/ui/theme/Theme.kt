package com.smartration.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = PrimaryGreen,
    onPrimary = SurfaceWhite,
    primaryContainer = PrimaryGreenLight,
    onPrimaryContainer = TextPrimary,
    secondary = SecondaryAmber,
    onSecondary = TextPrimary,
    secondaryContainer = SecondaryAmberDark,
    onSecondaryContainer = SurfaceWhite,
    tertiary = RiceBrown,
    onTertiary = TextPrimary,
    background = BackgroundCream,
    onBackground = TextPrimary,
    surface = SurfaceWhite,
    onSurface = TextPrimary,
    surfaceVariant = RiceBrown,
    onSurfaceVariant = TextSecondary,
    error = ErrorRed,
    onError = SurfaceWhite,
    outline = DividerColor,
    surfaceTint = PrimaryGreen
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryGreenLight,
    onPrimary = TextPrimary,
    primaryContainer = PrimaryGreenDark,
    onPrimaryContainer = SurfaceWhite,
    secondary = SecondaryAmber,
    onSecondary = TextPrimary,
    tertiary = RiceBrown,
    background = Color(0xFF121212),
    onBackground = SurfaceWhite,
    surface = Color(0xFF1E1E1E),
    onSurface = SurfaceWhite,
    error = Color(0xFFEF5350),
    onError = TextPrimary,
    outline = TextSecondary
)

@Composable
fun SmartRationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
