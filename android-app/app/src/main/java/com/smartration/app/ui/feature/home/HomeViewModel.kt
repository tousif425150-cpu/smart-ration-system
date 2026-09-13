package com.smartration.app.ui.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartration.app.data.model.RiceInfo
import com.smartration.app.data.model.UiState
import com.smartration.app.data.repository.RiceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val riceRepository: RiceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<RiceInfo>>(UiState.Loading)
    val uiState = _uiState.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            riceRepository.getRiceInfo()
                .onSuccess { info ->
                    _uiState.value = UiState.Success(info)
                }
                .onFailure { error ->
                    _uiState.value = UiState.Error(error.message ?: "Unknown error occurred")
                }
        }
    }
}
