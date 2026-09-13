package com.smartration.app.ui.feature.rice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartration.app.data.model.RiceHistoryItem
import com.smartration.app.data.model.UiState
import com.smartration.app.data.repository.RiceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RiceHistoryViewModel @Inject constructor(
    private val riceRepository: RiceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<List<RiceHistoryItem>>>(UiState.Loading)
    val uiState = _uiState.asStateFlow()

    init {
        loadHistory()
    }

    fun loadHistory() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            riceRepository.getRiceHistory()
                .onSuccess { history ->
                    if (history.isEmpty()) {
                        _uiState.value = UiState.Empty
                    } else {
                        _uiState.value = UiState.Success(history)
                    }
                }
                .onFailure { error ->
                    _uiState.value = UiState.Error(error.message ?: "Failed to load history")
                }
        }
    }
}
