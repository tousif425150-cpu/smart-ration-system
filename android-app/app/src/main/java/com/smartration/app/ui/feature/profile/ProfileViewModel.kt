package com.smartration.app.ui.feature.profile

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
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val riceRepository: RiceRepository
) : ViewModel() {

    private val _username = MutableStateFlow("")
    val username = _username.asStateFlow()

    private val _familyId = MutableStateFlow("")
    val familyId = _familyId.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.getUsername().firstOrNull()?.let {
                _username.value = it
            }
            riceRepository.getRiceInfo().onSuccess {
                _familyId.value = it.familyId.toString()
            }
        }
    }

    fun logout(onLogoutSuccess: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onLogoutSuccess()
        }
    }
}
