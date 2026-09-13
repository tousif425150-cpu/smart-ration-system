package com.smartration.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.smartration.app.data.repository.AuthRepository
import com.smartration.app.ui.navigation.AppNavHost
import com.smartration.app.ui.navigation.Screens
import com.smartration.app.ui.theme.SmartRationTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            var startDestination by remember { mutableStateOf<String?>(null) }
            
            LaunchedEffect(Unit) {
                startDestination = if (authRepository.isLoggedIn()) {
                    Screens.Home.route
                } else {
                    Screens.Login.route
                }
            }
            
            SmartRationTheme {
                startDestination?.let { destination ->
                    AppNavHost(startDestination = destination)
                }
            }
        }
    }
}
