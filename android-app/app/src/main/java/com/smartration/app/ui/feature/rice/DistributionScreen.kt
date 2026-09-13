package com.smartration.app.ui.feature.rice

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.smartration.app.data.model.RiceInfo

@Composable
fun DistributionScreen(
    info: RiceInfo,
    onSuccess: () -> Unit,
    onCancel: () -> Unit,
    viewModel: DistributionViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    when (uiState) {
        is DistributionUiState.Idle -> {
            DistributionConfirmation(
                kg = info.remainingKg,
                onConfirm = { viewModel.startDistribution(info.remainingKg, info.isFaceVerificationRequired) },
                onCancel = onCancel
            )
        }
        is DistributionUiState.AwaitingFaceCapture -> {
            FaceCaptureScreen(
                onImageCaptured = { bytes -> viewModel.verifyAndDistribute(bytes, info.remainingKg) },
                onCancel = { viewModel.resetState() }
            )
        }
        is DistributionUiState.VerifyingFace, is DistributionUiState.Distributing -> {
            LoadingScreen(
                message = if (uiState is DistributionUiState.VerifyingFace) 
                    "Verifying Face..." else "Processing Distribution..."
            )
        }
        is DistributionUiState.Success -> {
            SuccessScreen(onContinue = onSuccess)
        }
        is DistributionUiState.Error -> {
            ErrorScreen(
                message = (uiState as DistributionUiState.Error).message,
                onRetry = { viewModel.resetState() }
            )
        }
    }
}

@Composable
fun DistributionConfirmation(kg: Double, onConfirm: () -> Unit, onCancel: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Confirm Distribution",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(
            text = "You are about to collect",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        
        Text(
            text = "$kg KG",
            style = MaterialTheme.typography.displayMedium,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = "of rice ration",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        
        Button(
            onClick = onConfirm,
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text("Confirm and Proceed", fontSize = 18.sp)
        }
        
        TextButton(
            onClick = onCancel,
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        ) {
            Text("Cancel")
        }
    }
}

@Composable
fun LoadingScreen(message: String) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = message)
    }
}

@Composable
fun SuccessScreen(onContinue: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(100.dp)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Success!",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Rice ration distributed successfully.",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(48.dp))
        Button(onClick = onContinue, modifier = Modifier.fillMaxWidth().height(56.dp)) {
            Text("Continue")
        }
    }
}

@Composable
fun ErrorScreen(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Error",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(48.dp))
        Button(onClick = onRetry, modifier = Modifier.fillMaxWidth().height(56.dp)) {
            Text("Try Again")
        }
    }
}
