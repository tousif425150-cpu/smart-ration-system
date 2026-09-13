package com.smartration.app.ui.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartration.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChangePasswordViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ChangePasswordUiState>(ChangePasswordUiState.Idle)
    val uiState = _uiState.asStateFlow()

    fun changePassword(old: String, new: String, confirm: String) {
        if (new != confirm) {
            _uiState.value = ChangePasswordUiState.Error("Passwords do not match")
            return
        }
        if (new.length < 6) {
            _uiState.value = ChangePasswordUiState.Error("Password must be at least 6 characters")
            return
        }

        viewModelScope.launch {
            _uiState.value = ChangePasswordUiState.Loading
            authRepository.changePassword(old, new, confirm)
                .onSuccess {
                    _uiState.value = ChangePasswordUiState.Success
                }
                .onFailure { error ->
                    _uiState.value = ChangePasswordUiState.Error(error.message ?: "Failed to change password")
                }
        }
    }

    fun resetState() {
        _uiState.value = ChangePasswordUiState.Idle
    }
}

sealed class ChangePasswordUiState {
    object Idle : ChangePasswordUiState()
    object Loading : ChangePasswordUiState()
    object Success : ChangePasswordUiState()
    data class Error(val message: String) : ChangePasswordUiState()
}
