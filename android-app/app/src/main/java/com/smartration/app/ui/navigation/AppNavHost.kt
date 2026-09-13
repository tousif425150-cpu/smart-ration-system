package com.smartration.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.smartration.app.ui.components.MainScaffold
import com.smartration.app.ui.feature.home.HomeScreen
import com.smartration.app.ui.feature.login.LoginScreen
import com.smartration.app.ui.feature.notifications.NotificationScreen
import com.smartration.app.ui.feature.profile.ChangePasswordScreen
import com.smartration.app.ui.feature.profile.ProfileScreen
import com.smartration.app.ui.feature.rice.RiceHistoryScreen
import com.smartration.app.ui.feature.rice.RiceInfoScreen

@Composable
fun AppNavHost(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screens.Login.route
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showScaffold = currentRoute != Screens.Login.route
    val currentTitle = when (currentRoute) {
        Screens.Home.route -> Screens.Home.title
        Screens.Rice.route -> Screens.Rice.title
        Screens.History.route -> Screens.History.title
        Screens.Notifications.route -> Screens.Notifications.title
        Screens.Profile.route -> Screens.Profile.title
        Screens.ChangePassword.route -> Screens.ChangePassword.title
        else -> "Smart Ration"
    }

    MainScaffold(
        navController = navController,
        showBottomBar = showScaffold,
        title = currentTitle
    ) { innerModifier ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = innerModifier.then(modifier)
        ) {
            composable(Screens.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screens.Home.route) {
                            popUpTo(Screens.Login.route) { inclusive = true }
                        }
                    }
                )
            }
            composable(Screens.Home.route) {
                HomeScreen()
            }
            composable(Screens.Rice.route) {
                RiceInfoScreen()
            }
            composable(Screens.History.route) {
                RiceHistoryScreen()
            }
            composable(Screens.Notifications.route) {
                NotificationScreen()
            }
            composable(Screens.Profile.route) {
                ProfileScreen(
                    onLogout = {
                        navController.navigate(Screens.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    navigateToChangePassword = {
                        navController.navigate(Screens.ChangePassword.route)
                    }
                )
            }
            composable(Screens.ChangePassword.route) {
                ChangePasswordScreen(
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
