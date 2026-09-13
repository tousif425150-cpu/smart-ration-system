package com.smartration.app.data.remote

import com.smartration.app.data.model.ApiResponse
import com.smartration.app.data.model.ChangePasswordRequest
import com.smartration.app.data.model.LoginRequest
import com.smartration.app.data.model.LoginResponse
import com.smartration.app.data.model.NotificationListResponse
import com.smartration.app.data.model.RiceHistoryResponse
import com.smartration.app.data.model.RiceInfo
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.PATCH
import retrofit2.http.Path

interface ApiService {

    @POST("auth/user/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginResponse>>

    @POST("auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<ApiResponse<Any>>

    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Any>>

    @PATCH("auth/fcm-token")
    suspend fun updateFcmToken(@Body body: Map<String, String>): Response<ApiResponse<Any>>

    @GET("rice")
    suspend fun getRiceInfo(): Response<ApiResponse<RiceInfo>>

    @GET("rice/history")
    suspend fun getRiceHistory(): Response<ApiResponse<RiceHistoryResponse>>

    @GET("notifications")
    suspend fun getNotifications(): Response<ApiResponse<NotificationListResponse>>

    @PUT("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: Int): Response<ApiResponse<Any>>

    @PUT("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiResponse<Any>>

    @POST("auth/face-verify")
    suspend fun verifyFace(@Body request: FaceVerifyRequest): Response<ApiResponse<FaceVerifyResponse>>

    @POST("rice/distribute")
    suspend fun distributeRice(@Body request: DistributeRequest): Response<ApiResponse<Any>>
}

data class DistributeRequest(
    val distributedKg: Double,
    val notes: String? = null,
    val isVerified: Boolean = false
)

data class FaceVerifyRequest(
    val username: String,
    val imageBase64: String
)

data class FaceVerifyResponse(
    val match: Boolean
)
