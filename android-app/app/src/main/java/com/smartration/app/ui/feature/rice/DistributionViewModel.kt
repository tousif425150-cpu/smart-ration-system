package com.smartration.app.ui.feature.rice

import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartration.app.data.repository.AuthRepository
import com.smartration.app.data.repository.RiceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DistributionViewModel @Inject constructor(
    private val riceRepository: RiceRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<DistributionUiState>(DistributionUiState.Idle)
    val uiState = _uiState.asStateFlow()

    fun startDistribution(remainingKg: Double, isFaceVerificationRequired: Boolean) {
        if (remainingKg <= 0) {
            _uiState.value = DistributionUiState.Error("No remaining ration for this month")
            return
        }

        if (isFaceVerificationRequired) {
            _uiState.value = DistributionUiState.AwaitingFaceCapture(remainingKg)
        } else {
            processDistribution(remainingKg)
        }
    }

    fun verifyAndDistribute(imageBytes: ByteArray, remainingKg: Double) {
        viewModelScope.launch {
            _uiState.value = DistributionUiState.VerifyingFace
            
            val username = authRepository.getUsername().firstOrNull() ?: ""
            val imageBase64 = Base64.encodeToString(imageBytes, Base64.NO_WRAP)
            
            riceRepository.verifyFace(username, imageBase64)
                .onSuccess { isMatch ->
                    if (isMatch) {
                        processDistribution(remainingKg, isVerified = true)
                    } else {
                        _uiState.value = DistributionUiState.Error("Face verification failed. Please try again.")
                    }
                }
                .onFailure { error ->
                    _uiState.value = DistributionUiState.Error(error.message ?: "Verification failed")
                }
        }
    }

    private fun processDistribution(kg: Double, isVerified: Boolean = false) {
        viewModelScope.launch {
            _uiState.value = DistributionUiState.Distributing
            riceRepository.distribute(kg, isVerified)
                .onSuccess {
                    _uiState.value = DistributionUiState.Success
                }
                .onFailure { error ->
                    _uiState.value = DistributionUiState.Error(error.message ?: "Distribution failed")
                }
        }
    }

    fun resetState() {
        _uiState.value = DistributionUiState.Idle
    }
}

sealed class DistributionUiState {
    object Idle : DistributionUiState()
    data class AwaitingFaceCapture(val kg: Double) : DistributionUiState()
    object VerifyingFace : DistributionUiState()
    object Distributing : DistributionUiState()
    object Success : DistributionUiState()
    data class Error(val message: String) : DistributionUiState()
}
