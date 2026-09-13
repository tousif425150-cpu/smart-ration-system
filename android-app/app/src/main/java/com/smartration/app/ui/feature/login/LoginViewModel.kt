package com.smartration.app.ui.feature.login

import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartration.app.data.repository.AuthRepository
import com.smartration.app.data.repository.RiceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val riceRepository: RiceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState = _uiState.asStateFlow()

    private var loginResponse: Any? = null

    fun login(username: String, password: String, useFace: Boolean = false) {
        if (username.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState.Error("Username and password are required")
            return
        }

        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            authRepository.login(username, password)
                .onSuccess { response ->
                    if (useFace) {
                        loginResponse = response
                        _uiState.value = LoginUiState.AwaitingFaceCapture
                    } else {
                        _uiState.value = LoginUiState.Success
                    }
                }
                .onFailure { error ->
                    _uiState.value = LoginUiState.Error(error.message ?: "Login failed")
                }
        }
    }

    fun verifyFaceAndLogin(username: String, imageBytes: ByteArray) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            val imageBase64 = Base64.encodeToString(imageBytes, Base64.NO_WRAP)
            
            riceRepository.verifyFace(username, imageBase64)
                .onSuccess { isMatch ->
                    if (isMatch) {
                        _uiState.value = LoginUiState.Success
                    } else {
                        _uiState.value = LoginUiState.Error("Face verification failed. Please try again.")
                    }
                }
                .onFailure { error ->
                    _uiState.value = LoginUiState.Error(error.message ?: "Verification failed")
                }
        }
    }

    fun resetState() {
        _uiState.value = LoginUiState.Idle
    }
}

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    object AwaitingFaceCapture : LoginUiState()
    object Success : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}
