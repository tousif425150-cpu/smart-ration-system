package com.smartration.app.data.repository

import com.smartration.app.data.local.UserPreferences
import com.smartration.app.data.model.ChangePasswordRequest
import com.smartration.app.data.model.LoginRequest
import com.smartration.app.data.model.LoginResponse
import com.smartration.app.data.remote.ApiService
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {

    suspend fun login(username: String, password: String): Result<LoginResponse> {
        return try {
            val response = apiService.login(LoginRequest(username, password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.status == "success" && body.data != null) {
                    val loginData = body.data
                    userPreferences.saveToken(loginData.accessToken, loginData.refreshToken)
                    userPreferences.saveUserMeta(
                        username = loginData.user.username,
                        userId = loginData.user.id,
                        role = loginData.user.role,
                        familyMemberId = loginData.user.familyMemberId
                    )

                    // Register FCM token
                    try {
                        val token = FirebaseMessaging.getInstance().token.await()
                        apiService.updateFcmToken(mapOf("fcmToken" to token))
                    } catch (e: Exception) {
                        Timber.e(e, "Failed to register FCM token")
                    }

                    Result.success(loginData)
                } else {
                    Result.failure(Exception(body?.message ?: "Login failed"))
                }
            } else {
                Result.failure(Exception("Invalid credentials or server error"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Login error")
            Result.failure(e)
        }
    }

    suspend fun changePassword(
        oldPassword: String,
        newPassword: String,
        confirmPassword: String
    ): Result<Unit> {
        return try {
            val response = apiService.changePassword(
                ChangePasswordRequest(oldPassword, newPassword, confirmPassword)
            )
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.status == "success") {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(body?.message ?: "Failed to change password"))
                }
            } else {
                Result.failure(Exception("Failed to change password"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Change password error")
            Result.failure(e)
        }
    }

    suspend fun logout(): Result<Unit> {
        return try {
            apiService.logout()
            userPreferences.clearPreferences()
            Result.success(Unit)
        } catch (e: Exception) {
            Timber.e(e, "Logout error")
            userPreferences.clearPreferences()
            Result.success(Unit)
        }
    }

    fun getAccessToken() = userPreferences.accessToken

    fun getUsername() = userPreferences.username

    suspend fun isLoggedIn(): Boolean {
        return userPreferences.getToken() != null
    }

    suspend fun clearData() = userPreferences.clearPreferences()
}
