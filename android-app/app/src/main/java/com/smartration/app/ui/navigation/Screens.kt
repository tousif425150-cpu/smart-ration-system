package com.smartration.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screens(val route: String, val title: String) {
    data object Login : Screens("login", "Login")
    data object Home : Screens("home", "Home")
    data object Rice : Screens("rice", "Rice")
    data object History : Screens("history", "History")
    data object Notifications : Screens("notifications", "Notifications")
    data object Profile : Screens("profile", "Profile")
    data object ChangePassword : Screens("change_password", "Change Password")
}

sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    data object Home : BottomNavItem(
        route = Screens.Home.route,
        title = "Home",
        icon = Icons.Filled.Home
    )

    data object Rice : BottomNavItem(
        route = Screens.Rice.route,
        title = "Rice",
        icon = Icons.Filled.ShoppingCart
    )

    data object History : BottomNavItem(
        route = Screens.History.route,
        title = "History",
        icon = Icons.Filled.History
    )

    data object Notifications : BottomNavItem(
        route = Screens.Notifications.route,
        title = "Alerts",
        icon = Icons.Filled.Notifications
    )

    data object Profile : BottomNavItem(
        route = Screens.Profile.route,
        title = "Profile",
        icon = Icons.Filled.Person
    )
}
