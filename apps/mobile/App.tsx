import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getStoredAuth, DEFAULT_SERVER_URL } from './src/services/api';
import { LoginScreen } from './src/screens/LoginScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { AuthState } from './src/types';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    serverUrl: DEFAULT_SERVER_URL,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const stored = await getStoredAuth();
        if (stored.token) {
          setAuthState(stored);
        } else {
          setAuthState((prev) => ({ ...prev, serverUrl: stored.serverUrl }));
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrap();
  }, []);

  const handleLoginSuccess = (token: string, user: any, serverUrl: string) => {
    setAuthState({ token, user, serverUrl });
  };

  const handleLogout = () => {
    setAuthState((prev) => ({ ...prev, token: null, user: null }));
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#021812" />
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#021812" />
        {authState.token ? (
          <ScannerScreen user={authState.user} onLogout={handleLogout} />
        ) : (
          <LoginScreen
            initialServerUrl={authState.serverUrl}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#021812',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#021812',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
