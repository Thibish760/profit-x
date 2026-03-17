import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient as _LG } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
const LinearGradient = _LG as React.ComponentType<any>;

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top spacer pushes form to lower half */}
      <View style={{ height: height * 0.28 }} />

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>Login to your Account</Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Password"
            placeholderTextColor="#555"
            value={password}
            onChangeText={(v) => { setPassword(v); setError(''); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Remember me */}
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe(!rememberMe)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberText}>remember me</Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Login button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={async () => {
              if (email === 'admin@gmail.com' && password === '12345678') {
                try {
                  const seen = await AsyncStorage.getItem('seen_getstarted');
                  if (seen) {
                    router.replace('/(tabs)');
                  } else {
                    router.replace('/getstarted');
                  }
                } catch (err) {
                  router.replace('/(tabs)');
                }
              } else {
                setError('Invalid email or password.');
              }
            }}
          style={styles.loginBtnWrap}
        >
          <LinearGradient
            colors={['#3F8105', '#ACFE3E']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.loginBtn}
          >
            <Text style={styles.loginText}>Login</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85}>
          <Image
            source={require('../assets/images/image 200.png')}
            style={styles.googleIcon}
            resizeMode="contain"
          />
          <Text style={styles.googleText}>Continue with google</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sign up */}
      <View style={styles.bottomRow}>
        <Text style={styles.noAccountText}>Dont have an account ? </Text>
        <TouchableOpacity>
          <Text style={styles.signInLink}>sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 28,
    letterSpacing: 0.3,
  },

  // Inputs
  input: {
    backgroundColor: '#0e0e0e',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
    color: '#fff',
    fontSize: 15,
    marginBottom: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
  },

  // Remember me
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: '#ACFE3E',
    borderColor: '#ACFE3E',
  },
  checkmark: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberText: {
    color: '#aaa',
    fontSize: 14,
  },

  // Error
  errorText: {
    color: '#ff4d4d',
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
  },

  // Login button
  loginBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 14,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // OR divider
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  orText: {
    color: '#555',
    fontSize: 14,
  },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    gap: 12,
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  googleText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },

  // Bottom
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  noAccountText: {
    color: '#888',
    fontSize: 14,
  },
  signInLink: {
    color: '#ACFE3E',
    fontSize: 14,
    fontWeight: '600',
  },
});
