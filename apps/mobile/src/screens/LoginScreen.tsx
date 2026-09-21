import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { api, setServerUrl, saveStoredAuth, DEFAULT_SERVER_URL } from '../services/api';
import { ShieldCheck, Server, Lock, Mail, ChevronRight, Settings } from 'lucide-react-native';

interface LoginScreenProps {
  initialServerUrl: string;
  onLoginSuccess: (token: string, user: any, serverUrl: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialServerUrl,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setLocalServerUrl] = useState(initialServerUrl || DEFAULT_SERVER_URL);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      await setServerUrl(serverUrl);
      const data = await api.login(email, password);

      if (data && data.accessToken) {
        const user = data.user || { email };
        await saveStoredAuth(data.accessToken, user);
        onLoginSuccess(data.accessToken, user, serverUrl);
      } else {
        throw new Error('Invalid authentication response from server.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not connect to the server. Please verify your Render URL and network connection.';
      Alert.alert('Authentication Failed', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <ShieldCheck color="#10b981" size={42} />
          </View>
          <Text style={styles.title}>UHV GATE SCANNER</Text>
          <Text style={styles.subtitle}>
            TKM College of Engineering • Universal Human Values Cell
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Coordinator Login</Text>
          <Text style={styles.cardSub}>
            Sign in with your administrator or coordinator credentials to begin scanning attendee passes.
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Mail color="#94a3b8" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="admin@tkmce.ac.in"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock color="#94a3b8" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
          </View>

          {/* Server Config Toggle */}
          <TouchableOpacity
            style={styles.serverToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Settings color="#6ee7b7" size={14} />
            <Text style={styles.serverToggleText}>
              {showServerConfig ? 'Hide Server URL' : 'Configure Server Endpoint (Render)'}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverBox}>
              <Text style={styles.serverBoxLabel}>Backend API Endpoint URL</Text>
              <View style={styles.inputContainer}>
                <Server color="#94a3b8" size={16} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { fontSize: 12 }]}
                  placeholder={DEFAULT_SERVER_URL}
                  placeholderTextColor="#64748b"
                  value={serverUrl}
                  onChangeText={setLocalServerUrl}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              <Text style={styles.serverHint}>
                Default: https://uhv-cell-api.onrender.com
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In to Scanner</Text>
                <ChevronRight color="#ffffff" size={18} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <Text style={styles.footerText}>
          Universal Human Values Cell • Event Gate Operations
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#021812',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    borderWidth: 1.5,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#a7f3d0',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#06281e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#021812',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
  },
  serverToggleText: {
    fontSize: 12,
    color: '#6ee7b7',
    fontWeight: '600',
  },
  serverBox: {
    backgroundColor: '#021812',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#065f46',
    marginBottom: 16,
  },
  serverBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a7f3d0',
    marginBottom: 6,
  },
  serverHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  loginBtn: {
    backgroundColor: '#059669',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 24,
  },
});
