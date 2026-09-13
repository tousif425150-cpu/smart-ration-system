package com.smartration.app.data.repository

import com.smartration.app.data.model.NotificationItem
import com.smartration.app.data.remote.ApiService
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getNotifications(): Result<List<NotificationItem>> {
        return try {
            val response = apiService.getNotifications()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.status == "success") {
                    Result.success(body.data?.notifications ?: emptyList())
                } else {
                    Result.failure(Exception(body?.message ?: "Failed to fetch notifications"))
                }
            } else {
                Result.failure(Exception("Failed to fetch notifications"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Notifications fetch error")
            Result.failure(e)
        }
    }

    suspend fun markAsRead(id: Int): Result<Unit> {
        return try {
            val response = apiService.markNotificationRead(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to mark notification as read"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Mark read error")
            Result.failure(e)
        }
    }

    suspend fun markAllAsRead(): Result<Unit> {
        return try {
            val response = apiService.markAllNotificationsRead()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to mark all as read"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Mark all read error")
            Result.failure(e)
        }
    }
}
