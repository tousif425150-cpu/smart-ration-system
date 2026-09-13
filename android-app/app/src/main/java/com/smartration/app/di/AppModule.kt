package com.smartration.app.di

import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import timber.log.Timber
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideTimberTree(): Timber.Tree {
        return Timber.DebugTree()
    }

    @Provides
    @Singleton
    fun provideAppContext(@ApplicationContext context: Context): Context = context
}
