package com.smartration.app.data.repository

import com.smartration.app.data.model.RiceHistoryItem
import com.smartration.app.data.model.RiceInfo
import com.smartration.app.data.remote.ApiService
import com.smartration.app.data.remote.DistributeRequest
import com.smartration.app.data.remote.FaceVerifyRequest
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RiceRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getRiceInfo(): Result<RiceInfo> {
        return try {
            val response = apiService.getRiceInfo()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.status == "success" && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "Failed to fetch rice info"))
                }
            } else {
                Result.failure(Exception("Failed to fetch rice info"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Rice info fetch error")
            Result.failure(e)
        }
    }

    suspend fun getRiceHistory(): Result<List<RiceHistoryItem>> {
        return try {
            val response = apiService.getRiceHistory()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.status == "success") {
                    Result.success(body.data?.distributions ?: emptyList())
                } else {
                    Result.failure(Exception(body?.message ?: "Failed to fetch rice history"))
                }
            } else {
                Result.failure(Exception("Failed to fetch rice history"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Rice history fetch error")
            Result.failure(e)
        }
    }

    suspend fun verifyFace(username: String, imageBase64: String): Result<Boolean> {
        return try {
            val response = apiService.verifyFace(FaceVerifyRequest(username, imageBase64))
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.status == "success" && body.data != null) {
                    Result.success(body.data.match)
                } else {
                    Result.failure(Exception(body?.message ?: "Verification failed"))
                }
            } else {
                Result.failure(Exception("Verification failed"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Face verify error")
            Result.failure(e)
        }
    }

    suspend fun distribute(kg: Double, isVerified: Boolean = false): Result<Unit> {
        return try {
            val response = apiService.distributeRice(DistributeRequest(kg, isVerified = isVerified))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Distribution failed"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Distribution error")
            Result.failure(e)
        }
    }
}
