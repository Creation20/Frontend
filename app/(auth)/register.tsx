import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    // Mock register
    setTimeout(() => {
      setLoading(false);
      router.replace('/(auth)/diagnostic');
    }, 1500);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0B6E6E', '#063838']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="book-open-page-variant" size={32} color="#FFF" />
            <Text style={styles.logoText}>LexiAid</Text>
          </View>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>
            Your personalized reading journey starts here
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field
            label="Full Name"
            icon="person-outline"
            value={name}
            onChange={setName}
            placeholder="John Doe"
          />
          <Field
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChange={setEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#0B6E6E" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor="#9BA3BF"
                secureTextEntry={!showPassword}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#9BA3BF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
            style={styles.signUpBtn}
          >
            <View style={[styles.btnInner, { backgroundColor: '#0B6E6E' }]}>
               <Text style={styles.signUpText}>
                {loading ? 'Setting up...' : 'Create Account'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#FFF" />}
            </View>
          </TouchableOpacity>

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already a member? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon as any} size={18} color="#0B6E6E" />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9BA3BF"
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 20 },
  backBtn: {
    marginBottom: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  formWrapper: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  form: { padding: 32, gap: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, color: '#1A1D2E', fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 16,
  },
  errorText: { color: '#991B1B', fontSize: 13, fontWeight: '700' },
  signUpBtn: { marginTop: 10 },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 20,
    gap: 10,
    elevation: 4,
    shadowColor: '#0B6E6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  signUpText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  signInRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  signInPrompt: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  signInLink: { fontSize: 14, color: '#0B6E6E', fontWeight: '800' },
});
