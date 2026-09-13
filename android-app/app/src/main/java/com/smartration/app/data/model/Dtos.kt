package com.smartration.app.data.model

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User
)

data class User(
    val id: Int,
    val username: String,
    val role: String,
    val familyMemberId: Int?,
    val lastLoginAt: String?
)

data class FamilyMember(
    val id: Int,
    val memberId: String,
    val familyId: Int,
    val name: String,
    val age: Int?,
    val gender: String?,
    val relation: String,
    val isFamilyHead: Boolean,
    val accountStatus: String,
    val faceEnrollmentStatus: String,
    val profilePhotoPath: String?
)

data class RiceInfo(
    val monthlyEntitlementKg: Double,
    val totalReceivedKg: Double,
    val remainingKg: Double,
    val lastDistributionDate: String?,
    val familyMemberCount: Int,
    val familyId: String,
    val headName: String?,
    val mobileNumber: String?,
    val isFaceVerificationRequired: Boolean
)

data class RiceHistoryItem(
    val id: Int,
    val date: String,
    val time: String,
    val distributedKg: Double,
    val remainingKg: Double,
    val status: String,
    val notes: String?
)

data class RiceHistoryResponse(
    val distributions: List<RiceHistoryItem>,
    val total: Int,
    val page: Int,
    val totalPages: Int
)

data class NotificationItem(
    val id: Int,
    val title: String,
    val message: String,
    val type: String,
    val isRead: Boolean,
    val createdAt: String
)

data class NotificationListResponse(
    val notifications: List<NotificationItem>
)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String,
    val confirmPassword: String
)

data class ApiResponse<T>(
    val status: String,
    val message: String?,
    val data: T?
)

sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    object Empty : UiState<Nothing>()
    data class Success<out T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
