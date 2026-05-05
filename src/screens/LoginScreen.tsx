import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { sendCaptcha, loginByCellphone, LoginResult } from '../api/auth';

interface Props {
  onLogin: (result: LoginResult) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phone.trim() || phone.length !== 11) {
      Alert.alert('', '请输入 11 位手机号');
      return;
    }
    try {
      await sendCaptcha(phone.trim());
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      Alert.alert('', '验证码发送失败');
    }
  };

  const handleLogin = async () => {
    if (!phone.trim() || !code.trim()) return;
    setLoading(true);
    try {
      const result = await loginByCellphone(phone.trim(), code.trim());
      if (result) {
        onLogin(result);
      } else {
        Alert.alert('', '登录失败，请检查验证码');
      }
    } catch {
      Alert.alert('', '登录失败');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FanTune</Text>
        <Text style={styles.subtitle}>登录酷狗音乐账号</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="手机号"
          placeholderTextColor={colors.textTertiary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={11}
        />

        <View style={styles.codeRow}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="验证码"
            placeholderTextColor={colors.textTertiary}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.codeBtn, countdown > 0 && styles.codeBtnDisabled]}
            onPress={handleSendCode}
            disabled={countdown > 0}
            activeOpacity={0.7}
          >
            <Text style={styles.codeBtnText}>
              {countdown > 0 ? `${countdown}s` : '发送验证码'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.loginBtnText}>登录</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
  codeBtn: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeBtnDisabled: {
    opacity: 0.5,
  },
  codeBtnText: {
    fontSize: 14,
    color: colors.text,
  },
  loginBtn: {
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg,
  },
});
