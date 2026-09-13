package com.smartration.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "smart_ration_prefs")

@Singleton
class UserPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private object PreferencesKeys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USERNAME = stringPreferencesKey("username")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_ROLE = stringPreferencesKey("user_role")
        val FAMILY_MEMBER_ID = stringPreferencesKey("family_member_id")
    }

    val accessToken: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.ACCESS_TOKEN]
    }

    val username: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.USERNAME]
    }

    suspend fun saveToken(accessToken: String, refreshToken: String) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.ACCESS_TOKEN] = accessToken
            prefs[PreferencesKeys.REFRESH_TOKEN] = refreshToken
        }
    }

    suspend fun getToken(): String? {
        return context.dataStore.data.map { prefs ->
            prefs[PreferencesKeys.ACCESS_TOKEN]
        }.firstOrNull()
    }

    suspend fun saveUserMeta(
        username: String,
        userId: Int,
        role: String,
        familyMemberId: Int?
    ) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.USERNAME] = username
            prefs[PreferencesKeys.USER_ID] = userId.toString()
            prefs[PreferencesKeys.USER_ROLE] = role
            familyMemberId?.let {
                prefs[PreferencesKeys.FAMILY_MEMBER_ID] = it.toString()
            }
        }
    }

    suspend fun getUsernameSingle(): String? {
        return context.dataStore.data.map { prefs ->
            prefs[PreferencesKeys.USERNAME]
        }.firstOrNull()
    }

    suspend fun clearPreferences() {
        context.dataStore.edit { it.clear() }
    }
}
